#!/usr/bin/env node
// Find internal links that point to pages that don't exist (404 targets).

const fs = require('fs');
const path = require('path');

const DIST = path.join(__dirname, '..', 'dist');
const HOST = 'rank4ai.co.uk';
const SITE = 'https://www.rank4ai.co.uk';

function walk(dir, acc) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (e.name.endsWith('.html')) acc.push(p);
  }
  return acc;
}

function pathFromHtml(file) {
  const rel = path.relative(DIST, file).replace(/\\/g, '/');
  let u = '/' + rel.replace(/index\.html$/, '').replace(/\.html$/, '/');
  if (u === '/index.html') u = '/';
  if (!u.endsWith('/') && !/\.[a-z0-9]+$/i.test(u)) u += '/';
  return u;
}

function targetExists(target) {
  if (target === '/') return fs.existsSync(path.join(DIST, 'index.html'));
  const withoutQuery = target.split('?')[0].split('#')[0];
  if (!withoutQuery) return true;
  if (/\.[a-z0-9]+$/i.test(withoutQuery)) {
    return fs.existsSync(path.join(DIST, withoutQuery));
  }
  const dir = withoutQuery.endsWith('/') ? withoutQuery.slice(0, -1) : withoutQuery;
  if (fs.existsSync(path.join(DIST, dir, 'index.html'))) return true;
  if (fs.existsSync(path.join(DIST, dir + '.html'))) return true;
  return false;
}

function normalise(href, selfUrl) {
  if (!href) return null;
  href = href.split('#')[0].split('?')[0];
  if (!href) return null;
  if (/^(mailto:|tel:|javascript:)/i.test(href)) return null;
  if (/^(https?:)?\/\//i.test(href)) {
    if (!href.includes(HOST)) return null;
    href = href.replace(/^https?:\/\/[^/]+/, '');
  }
  if (!href.startsWith('/')) {
    try { href = new URL(href, SITE + selfUrl).pathname; }
    catch (e) { return null; }
  }
  if (!href.endsWith('/') && !/\.[a-z0-9]+$/i.test(href)) href += '/';
  return href;
}

function stripScriptsAndStyles(html) {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '');
}

const htmls = walk(DIST, []);
const broken = new Map();

for (const file of htmls) {
  const self = pathFromHtml(file);
  const html = stripScriptsAndStyles(fs.readFileSync(file, 'utf8'));
  const re = /<a\b[^>]*\shref="([^"]+)"/gi;
  let m;
  while ((m = re.exec(html))) {
    const target = normalise(m[1], self);
    if (!target) continue;
    if (/%7B|%24%7B|\$\{|\{\{/.test(target)) continue;
    if (!targetExists(target)) {
      if (!broken.has(target)) broken.set(target, new Set());
      broken.get(target).add(self);
    }
  }
}

console.log('Broken internal link targets: ' + broken.size);
console.log('---');
const entries = Array.from(broken.entries()).sort();
for (const [target, sources] of entries) {
  console.log(target);
  const srcList = Array.from(sources).slice(0, 5);
  for (const src of srcList) console.log('    from ' + src);
  if (sources.size > 5) console.log('    ... and ' + (sources.size - 5) + ' more');
}
