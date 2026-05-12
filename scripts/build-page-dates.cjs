#!/usr/bin/env node
/**
 * Page Dates Manifest — for every .astro page in src/pages/, derive added/updated dates from git.
 * Output: src/data/page-dates.json — {url: {added, updated}}
 * Run before `npm run build` to power freshness badges in <PageDates />.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PAGES_DIR = path.join(ROOT, 'src', 'pages');
const OUTPUT = path.join(ROOT, 'src', 'data', 'page-dates.json');

const TRIVIAL_COMMIT_PATTERNS = [
  /em[- ]dash/i,
  /text-\[/i,
  /\bmobile readab/i,
  /\bbulk\b.*\b(replace|fix|sweep)\b/i,
  /\bstyle (sweep|fix|tweak)\b/i,
  /\bformat(ting)?\b/i,
  /\btypo\b/i,
  /\bwhitespace\b/i,
  /\bchore\b/i,
  /\bcleanup\b/i,
  /\bremove (orphan|duplicate)/i,
  /\brebuild .* section\b/i,
  /\bbump\b/i,
  /\.gitignore/i,
  /\bAuto:.* Q&A /i,
  /\bAuto:.* qa /i,
  /\bAuto:.* blog /i,
  /\bAuto:.* stat /i,
  /\bAuto:.* guide /i,
];

function isTrivialCommit(msg) {
  return TRIVIAL_COMMIT_PATTERNS.some((re) => re.test(msg));
}

function fileToUrl(filePath) {
  let url = filePath.replace(PAGES_DIR, '').replace(/\\/g, '/').replace(/\.astro$/, '');
  if (url.endsWith('/index')) url = url.replace(/\/index$/, '/');
  if (!url.endsWith('/')) url = url + '/';
  return url;
}

function gitDate(file, mode) {
  try {
    if (mode === 'added') {
      const cmd = `git log --diff-filter=A --follow --reverse --format=%ad --date=short -- "${file}" 2>/dev/null | head -1`;
      return execSync(cmd, { cwd: ROOT, encoding: 'utf8' }).trim() || null;
    }
    const cmd = `git log -20 '--format=%H|%ad|%s' --date=short -- "${file}" 2>/dev/null`;
    const lines = execSync(cmd, { cwd: ROOT, encoding: 'utf8' }).trim().split('\n');
    for (const line of lines) {
      if (!line) continue;
      const [, date, ...rest] = line.split('|');
      const msg = rest.join('|');
      if (!isTrivialCommit(msg)) return date;
    }
    const fallback = execSync(`git log -1 --format=%ad --date=short -- "${file}" 2>/dev/null`, { cwd: ROOT, encoding: 'utf8' }).trim();
    return fallback || null;
  } catch {
    return null;
  }
}

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (entry.name.endsWith('.astro')) files.push(full);
  }
  return files;
}

function isShallowRepo() {
  try {
    const out = execSync('git rev-parse --is-shallow-repository 2>/dev/null', { cwd: ROOT, encoding: 'utf8' }).trim();
    return out === 'true';
  } catch {
    return false;
  }
}

function main() {
  if (!fs.existsSync(PAGES_DIR)) {
    console.error('No src/pages/ found.');
    process.exit(1);
  }

  // Shallow clones (Cloudflare Pages, CI) can't produce per-file git history.
  // git log returns HEAD's date for every file, which would clobber the
  // committed page-dates.json with all-identical dates and silently break
  // sitemap lastmod. Preserve the committed file instead.
  if (isShallowRepo()) {
    console.log('Shallow repository detected, preserving committed page-dates.json (skipping regen).');
    return;
  }

  const files = walk(PAGES_DIR);
  const manifest = {};
  let withDates = 0;
  for (const file of files) {
    if (file.includes('[') || file.includes(']')) continue;
    const url = fileToUrl(file);
    const added = gitDate(file, 'added');
    const updated = gitDate(file, 'updated');
    if (added || updated) {
      manifest[url] = { added, updated };
      withDates++;
    }
  }
  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
  fs.writeFileSync(OUTPUT, JSON.stringify(manifest, null, 2));
  console.log(`Wrote ${withDates} page dates to ${path.relative(ROOT, OUTPUT)}`);
}

main();
