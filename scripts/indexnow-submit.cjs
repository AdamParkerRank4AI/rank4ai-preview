#!/usr/bin/env node
/**
 * IndexNow Submission Script
 *
 * Reads the sitemap and submits all URLs to IndexNow (Bing).
 * Since ChatGPT indexes from Bing, this gives near-instant ChatGPT eligibility.
 *
 * Run after build: node scripts/indexnow-submit.js
 */

const fs = require('fs');
const path = require('path');

const SITE_URL = 'https://www.rank4ai.co.uk';
const API_KEY = '4c1cc17752ab451887a14b719906f527';
const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';

async function main() {
  // Read the sitemap to get all URLs
  const sitemapPath = path.join(__dirname, '..', 'dist', 'sitemap-0.xml');

  if (!fs.existsSync(sitemapPath)) {
    console.log('No sitemap found. Run npm run build first.');
    process.exit(1);
  }

  const sitemap = fs.readFileSync(sitemapPath, 'utf-8');
  const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1]);

  console.log(`Found ${urls.length} URLs to submit to IndexNow`);

  // Submit to IndexNow
  const payload = {
    host: 'www.rank4ai.co.uk',
    key: API_KEY,
    keyLocation: `${SITE_URL}/${API_KEY}.txt`,
    urlList: urls
  };

  try {
    const response = await fetch(INDEXNOW_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (response.ok || response.status === 202) {
      console.log(`IndexNow: ${urls.length} URLs submitted successfully (${response.status})`);
    } else {
      console.log(`IndexNow: Response ${response.status} — ${await response.text()}`);
    }
  } catch (err) {
    console.log(`IndexNow: Failed — ${err.message}`);
    console.log('This is normal if the site is not yet live on the domain.');
  }
}

main();
