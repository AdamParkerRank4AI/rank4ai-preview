#!/usr/bin/env node
// Find orphan + weakly-linked pages.
// Usage: node scripts/find-orphans.cjs [--min N]

const fs = require('fs');
const path = require('path');

const DIST = path.join(__dirname, '..', 'dist');
const SITE = 'https://www.rank4ai.co.uk';
const HOST = 'rank4ai.co.uk';
const argMin = (() => {
  const i = process.argv.indexOf('--min');
  return i > -1 ? parseInt(process.argv[i + 1], 10) : 2;
})();

function readSitemapUrls() {
  const candidates = ['sitemap-0.xml', 'sitemap.xml'];
  for (const name of candidates) {
    const p = path.join(DIST, name);
    if (!fs.existsSync(p)) continue;
    const xml = fs.readFileSync(p, 'utf8');
    const urls = [];
    const re = /<loc>([^<]+)<\/loc>/g;
    let m;
    while ((m = re.exec(xml))) {
      let u = m[1].replace(SITE, '').replace('https://' + HOST, '') || '/';
      if (!u.endsWith('/') && !/\.[a-z0-9]+$/i.test(u)) u += '/';
      urls.push(u);
    }
    return Array.from(new Set(urls));
  }
  return [];
}

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

function normalise(href, selfUrl) {
  if (!href) return null;
  href = href.split('#')[0].split('?')[0];
  if (!href) return null;
  if (/^(https?:)?\/\//i.test(href)) {
    if (!href.includes(HOST)) return null;
    href = href.replace(/^https?:\/\/[^/]+/, '');
  }
  if (!href.startsWith('/')) {
    try { href = new URL(href, SITE + selfUrl).pathname; } catch (e) { return null; }
  }
  if (!href.endsWith('/') && !/\.[a-z0-9]+$/i.test(href)) href += '/';
  return href;
}

const sitemap = readSitemapUrls();
const htmls = walk(DIST, []);
const inbound = new Map(sitemap.map((u) => [u, new Set()]));

for (const file of htmls) {
  const self = pathFromHtml(file);
  const html = fs.readFileSync(file, 'utf8');
  const re = /<a\b[^>]*\shref="([^"]+)"/gi;
  let m;
  while ((m = re.exec(html))) {
    const target = normalise(m[1], self);
    if (!target || target === self) continue;
    if (inbound.has(target)) inbound.get(target).add(self);
  }
}

const results = sitemap
  .filter((u) => u !== '/')
  .map((u) => ({ url: u, count: (inbound.get(u) || new Set()).size }))
  .filter((r) => r.count < argMin)
  .sort((a, b) => a.count - b.count || a.url.localeCompare(b.url));

console.log('Total URLs in sitemap: ' + sitemap.length);
console.log('Pages with < ' + argMin + ' inbound internal links: ' + results.length);
console.log('---');
for (var i = 0; i < results.length; i++) console.log(results[i].count + '\t' + results[i].url);
