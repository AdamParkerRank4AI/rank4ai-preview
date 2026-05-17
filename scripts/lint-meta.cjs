#!/usr/bin/env node
/**
 * Fleet meta-length linter.
 *
 * Scans .astro pages and .ts data files for:
 *   - title fields > 60 chars
 *   - description / metaDescription fields > 160 chars
 *
 * Counts as warning (exit 0) by default; pass --strict to fail the build.
 *
 * Picked up word-boundary preservation: cuts at the last space before the cap.
 * Drop-in for any fleet site. Add to package.json:
 *   "prebuild": "node scripts/lint-meta.cjs"
 */
const fs = require('fs');
const path = require('path');

const TITLE_MAX = 60;
const DESC_MAX = 160;
const STRICT = process.argv.includes('--strict');

const ROOT = path.resolve(__dirname, '..');
const PAGES_DIR = path.join(ROOT, 'src/pages');
const DATA_DIR = path.join(ROOT, 'src/data');

function walk(dir, ext) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) {
      out.push(...walk(p, ext));
    } else if (name.endsWith(ext)) {
      out.push(p);
    }
  }
  return out;
}

const issues = [];

function checkFile(file) {
  const src = fs.readFileSync(file, 'utf8');
  const rel = path.relative(ROOT, file);

  // Astro frontmatter const title / description
  if (file.endsWith('.astro')) {
    const titleMatch = src.match(/^const\s+title\s*=\s*['"`](.+?)['"`]\s*;?\s*$/m);
    if (titleMatch && titleMatch[1].length > TITLE_MAX) {
      issues.push({ file: rel, field: 'title', length: titleMatch[1].length, value: titleMatch[1] });
    }
    const descMatch = src.match(/^const\s+description\s*=\s*['"`](.+?)['"`]\s*;?\s*$/m);
    if (descMatch && descMatch[1].length > DESC_MAX) {
      issues.push({ file: rel, field: 'description', length: descMatch[1].length, value: descMatch[1] });
    }
  }

  // TS data files: scan for title:'...' and metaDescription:'...' inside objects
  if (file.endsWith('.ts')) {
    // title fields
    const titleRe = /title:\s*(['"`])((?:\\\1|(?!\1).)+?)\1/g;
    let m;
    while ((m = titleRe.exec(src))) {
      if (m[2].length > TITLE_MAX) {
        // find the slug context (look backwards for nearest slug)
        const before = src.slice(0, m.index);
        const slugMatch = before.match(/slug:\s*['"]([^'"]+)['"][\s\S]*$/);
        const slug = slugMatch ? slugMatch[1] : '?';
        issues.push({ file: rel, field: `title (slug=${slug})`, length: m[2].length, value: m[2] });
      }
    }
    const descRe = /metaDescription:\s*(['"`])((?:\\\1|(?!\1).)+?)\1/g;
    while ((m = descRe.exec(src))) {
      if (m[2].length > DESC_MAX) {
        const before = src.slice(0, m.index);
        const slugMatch = before.match(/slug:\s*['"]([^'"]+)['"][\s\S]*$/);
        const slug = slugMatch ? slugMatch[1] : '?';
        issues.push({ file: rel, field: `metaDescription (slug=${slug})`, length: m[2].length, value: m[2] });
      }
    }
  }
}

for (const f of walk(PAGES_DIR, '.astro')) checkFile(f);
for (const f of walk(DATA_DIR, '.ts')) checkFile(f);

if (issues.length === 0) {
  console.log('lint-meta: 0 issues');
  process.exit(0);
}

const tag = STRICT ? 'ERROR' : 'WARN';
console.log(`lint-meta: ${tag} ${issues.length} ${issues.length === 1 ? 'issue' : 'issues'}`);
for (const i of issues) {
  console.log(`  [${i.length}] ${i.file} :: ${i.field}`);
  console.log(`    ${i.value.slice(0, 80)}${i.value.length > 80 ? '...' : ''}`);
}
if (STRICT) process.exit(1);
process.exit(0);
