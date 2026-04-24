#!/usr/bin/env node
// Identify pages that look thin or low-quality on AI-readiness proxies:
// - very low word count in main article body
// - no answer capsule
// - fewer than 2 H2 headings
// - no internal links
// - no FAQ
// Score each page 0-100 and list the bottom 20.

const fs = require('fs');
const path = require('path');

const DIST = path.join(__dirname, '..', 'dist');

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

function strip(html) {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '');
}

function extractMain(html) {
  const m1 = html.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i);
  if (m1) return m1[1];
  const m2 = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i);
  if (m2) return m2[1];
  return html;
}

const htmls = walk(DIST, []);
const results = [];

for (const file of htmls) {
  const raw = fs.readFileSync(file, 'utf8');
  const clean = strip(raw);
  const body = extractMain(clean);

  const text = body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const words = text.length ? text.split(' ').length : 0;
  const h2Count = (body.match(/<h2\b/gi) || []).length;
  const h3Count = (body.match(/<h3\b/gi) || []).length;
  const internalLinks = (body.match(/<a\b[^>]*\shref="\/[^"]+"/gi) || []).length;
  const hasAnswer = /answer-capsule/i.test(body);
  const hasFaq = /Frequently (Asked|asked)|FAQPage|<h2[^>]*>FAQ|<h2[^>]*>F\.A\.Q/i.test(body);
  const hasSchema = /application\/ld\+json/i.test(raw);

  let score = 0;
  if (words >= 400) score += 30; else if (words >= 200) score += 15;
  if (h2Count >= 3) score += 20; else if (h2Count >= 1) score += 10;
  if (h3Count >= 2) score += 10;
  if (internalLinks >= 5) score += 15; else if (internalLinks >= 2) score += 8;
  if (hasAnswer) score += 10;
  if (hasFaq) score += 10;
  if (hasSchema) score += 5;

  results.push({
    url: pathFromHtml(file),
    score,
    words,
    h2: h2Count,
    links: internalLinks,
    capsule: hasAnswer,
    faq: hasFaq,
  });
}

results.sort((a, b) => a.score - b.score);
const bottom = results.slice(0, 20);
console.log('Bottom 20 pages by AI readiness score:\n');
console.log('score  words  h2  links  capsule  faq   url');
for (const r of bottom) {
  console.log(
    String(r.score).padStart(5) + '  ' +
    String(r.words).padStart(5) + '  ' +
    String(r.h2).padStart(2) + '  ' +
    String(r.links).padStart(5) + '  ' +
    (r.capsule ? '  yes  ' : '  no   ') + '  ' +
    (r.faq ? 'yes' : 'no ') + '   ' +
    r.url
  );
}
