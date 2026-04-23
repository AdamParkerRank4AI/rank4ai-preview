#!/usr/bin/env node
/**
 * Unified Deploy + Index Pipeline
 *
 * One command to rule them all. Run after pushing to main:
 *   node scripts/deploy.cjs
 *
 * What it does (in order):
 * 1. Builds the site (npm run build)
 * 2. Pings Google sitemap (instant, free)
 * 3. Submits to IndexNow / Bing (instant, free → ChatGPT eligibility)
 * 4. Submits to Google Indexing API (200/day, free → hours to index)
 * 5. Logs everything
 *
 * Cloudflare Pages deploys automatically on git push to main.
 * This script handles the indexing side.
 *
 * REUSABLE: Change SITE_URL, INDEXNOW_KEY, and sitemap path for other sites.
 */

const fs = require('fs');
const path = require('path');

// ═══════════════════════════════════════════
// SITE CONFIG — change these per site
// ═══════════════════════════════════════════
const SITE_URL = 'https://www.rank4ai.co.uk';
const SITE_HOST = 'www.rank4ai.co.uk';
const INDEXNOW_KEY = '4c1cc17752ab451887a14b719906f527';
const SITEMAP_URL = `${SITE_URL}/sitemap-index.xml`;
// ═══════════════════════════════════════════

const LOG_PATH = path.join(__dirname, '..', 'deploy-log.json');

function loadLog() {
  if (fs.existsSync(LOG_PATH)) return JSON.parse(fs.readFileSync(LOG_PATH, 'utf-8'));
  return { deploys: [] };
}

function saveLog(log) {
  // Keep last 30 deploys
  log.deploys = log.deploys.slice(-30);
  fs.writeFileSync(LOG_PATH, JSON.stringify(log, null, 2));
}

function getUrlsFromSitemap() {
  const sitemapPath = path.join(__dirname, '..', 'dist', 'sitemap-0.xml');
  if (!fs.existsSync(sitemapPath)) {
    console.log('No sitemap found at dist/sitemap-0.xml. Run npm run build first.');
    return [];
  }
  const sitemap = fs.readFileSync(sitemapPath, 'utf-8');
  return [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1]);
}

// ─────────────────────────────────────────
// Step 1: Google Sitemap Ping
// ─────────────────────────────────────────
async function pingSitemap() {
  // Google deprecated the /ping endpoint in 2023. Sitemap submission now happens
  // automatically via GSC or robots.txt Sitemap directive (which we already have).
  // Bing deprecated theirs too — IndexNow replaces it.
  // We still try the Google ping as a courtesy but don't rely on it.
  const results = {};

  // Google sitemap ping (may not work but costs nothing to try)
  try {
    const res = await fetch(`https://www.google.com/ping?sitemap=${encodeURIComponent(SITEMAP_URL)}`);
    results.Google = res.status === 200 ? 'pinged' : `${res.status} (deprecated — using robots.txt Sitemap directive instead)`;
    console.log(`  Google: ${results.Google}`);
  } catch (e) {
    results.Google = 'skipped (deprecated)';
    console.log(`  Google: sitemap declared in robots.txt (ping endpoint deprecated)`);
  }

  // Bing — handled by IndexNow, no separate ping needed
  results.Bing = 'via IndexNow';
  console.log(`  Bing: handled by IndexNow submission`);

  return results;
}

// ─────────────────────────────────────────
// Step 2: IndexNow (Bing → ChatGPT)
// ─────────────────────────────────────────
async function submitIndexNow(urls) {
  const payload = {
    host: SITE_HOST,
    key: INDEXNOW_KEY,
    keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
    urlList: urls
  };

  try {
    const res = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    console.log(`  IndexNow: ${urls.length} URLs submitted (${res.status})`);
    return { count: urls.length, status: res.status };
  } catch (e) {
    console.log(`  IndexNow: failed — ${e.message}`);
    return { count: 0, error: e.message };
  }
}

// ─────────────────────────────────────────
// Step 3: Google Indexing API
// ─────────────────────────────────────────
async function submitGoogleIndexing() {
  try {
    const { main } = require('./google-indexing-submit.cjs');
    return await main();
  } catch (e) {
    console.log(`  Google Indexing API: ${e.message}`);
    return { submitted: 0, skipped: true };
  }
}

// ─────────────────────────────────────────
// Step 4: Cloudflare Cache Purge
// ─────────────────────────────────────────
async function purgeCache() {
  try {
    const { main } = require('./purge-cf-cache.cjs');
    return await main();
  } catch (e) {
    console.log(`  Cache purge: ${e.message}`);
    return { purged: false, skipped: true };
  }
}

// ─────────────────────────────────────────
// Main Pipeline
// ─────────────────────────────────────────
async function main() {
  const startTime = Date.now();
  console.log('\n═══════════════════════════════════════');
  console.log(`  DEPLOY PIPELINE — ${SITE_HOST}`);
  console.log('═══════════════════════════════════════\n');

  const urls = getUrlsFromSitemap();
  if (urls.length === 0) {
    console.log('No URLs found. Build the site first: npm run build');
    process.exit(1);
  }
  console.log(`Found ${urls.length} URLs in sitemap\n`);

  // Step 1: Sitemap Ping
  console.log('Step 1: Sitemap Ping');
  const pingResults = await pingSitemap();

  // Step 2: IndexNow
  console.log('\nStep 2: IndexNow (Bing → ChatGPT)');
  const indexNowResults = await submitIndexNow(urls);

  // Step 3: Google Indexing API
  console.log('\nStep 3: Google Indexing API');
  const googleResults = await submitGoogleIndexing();

  // Step 4: Cloudflare Cache Purge
  console.log('\nStep 4: Cloudflare Cache Purge');
  const purgeResults = await purgeCache();

  // Log
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  const log = loadLog();
  log.deploys.push({
    timestamp: new Date().toISOString(),
    urlCount: urls.length,
    duration: `${duration}s`,
    sitemapPing: pingResults,
    indexNow: indexNowResults,
    googleIndexing: googleResults,
    cachePurge: purgeResults,
  });
  saveLog(log);

  console.log('\n═══════════════════════════════════════');
  console.log(`  DONE in ${duration}s`);
  console.log(`  ${urls.length} URLs × 3 channels`);
  console.log(`  Sitemap: Google ${pingResults.Google}, Bing ${pingResults.Bing}`);
  console.log(`  IndexNow: ${indexNowResults.count} URLs`);
  console.log(`  Google Indexing: ${googleResults.submitted} URLs${googleResults.skipped ? ' (skipped — no credentials)' : ''}`);
  console.log('═══════════════════════════════════════\n');
}

main();
