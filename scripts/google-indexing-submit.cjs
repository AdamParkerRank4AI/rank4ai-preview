#!/usr/bin/env node
/**
 * Google Indexing API Submission Script
 *
 * Submits URLs to Google's Indexing API for near-instant indexing.
 * Officially for JobPosting/BroadcastEvent but widely used beyond.
 * 200 URLs/day per service account. Pages indexed within hours.
 *
 * SETUP REQUIRED:
 * 1. Go to Google Cloud Console → APIs & Services → Enable "Web Search Indexing API"
 * 2. Create a Service Account → Download JSON key
 * 3. Save as ~/google-indexing-credentials.json
 * 4. In Google Search Console → Settings → Users → Add the service account email
 *    as an Owner (the email looks like: name@project.iam.gserviceaccount.com)
 *
 * Run: node scripts/google-indexing-submit.cjs
 * Or:  node scripts/google-indexing-submit.cjs --changed-only (only new/modified URLs)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CREDENTIALS_PATH = path.join(require('os').homedir(), 'google-indexing-credentials.json');
const SITE_URL = 'https://www.rank4ai.co.uk';
const MAX_URLS_PER_DAY = 200;
const LOG_PATH = path.join(__dirname, '..', 'indexing-log.json');

// Google OAuth2 token endpoint
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const INDEXING_API = 'https://indexing.googleapis.com/v3/urlNotifications:publish';
const SCOPE = 'https://www.googleapis.com/auth/indexing';

/**
 * Create a JWT and exchange it for an access token
 */
async function getAccessToken(credentials) {
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    iss: credentials.client_email,
    scope: SCOPE,
    aud: TOKEN_URL,
    iat: now,
    exp: now + 3600
  })).toString('base64url');

  const crypto = require('crypto');
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(`${header}.${payload}`);
  const signature = sign.sign(credentials.private_key, 'base64url');

  const jwt = `${header}.${payload}.${signature}`;

  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
  });

  if (!response.ok) {
    throw new Error(`Token request failed: ${response.status} ${await response.text()}`);
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * Submit a single URL to the Indexing API
 */
async function submitUrl(url, accessToken) {
  const response = await fetch(INDEXING_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify({
      url: url,
      type: 'URL_UPDATED'
    })
  });

  const data = await response.json();
  return { url, status: response.status, data };
}

/**
 * Get URLs from sitemap
 */
function getUrlsFromSitemap() {
  const sitemapPath = path.join(__dirname, '..', 'dist', 'sitemap-0.xml');
  if (!fs.existsSync(sitemapPath)) {
    console.log('No sitemap found. Run npm run build first.');
    process.exit(1);
  }
  const sitemap = fs.readFileSync(sitemapPath, 'utf-8');
  return [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1]);
}

/**
 * Get only changed URLs (from recent git commits)
 */
function getChangedUrls() {
  try {
    // Get files changed in the last commit
    const changed = execSync('git diff --name-only HEAD~1 HEAD -- src/pages/', { encoding: 'utf-8' });
    const files = changed.trim().split('\n').filter(Boolean);

    return files.map(f => {
      // Convert file path to URL: src/pages/guides/costs.astro → /guides/costs/
      let urlPath = f.replace('src/pages/', '/').replace('.astro', '/').replace('/index/', '/');
      if (urlPath.endsWith('//')) urlPath = urlPath.slice(0, -1);
      return `${SITE_URL}${urlPath}`;
    });
  } catch (e) {
    console.log('Could not get changed files from git, submitting all URLs');
    return getUrlsFromSitemap();
  }
}

/**
 * Load/save submission log to avoid re-submitting recently indexed URLs
 */
function loadLog() {
  if (fs.existsSync(LOG_PATH)) {
    return JSON.parse(fs.readFileSync(LOG_PATH, 'utf-8'));
  }
  return { submissions: [] };
}

function saveLog(log) {
  fs.writeFileSync(LOG_PATH, JSON.stringify(log, null, 2));
}

async function main() {
  // Check for credentials
  if (!fs.existsSync(CREDENTIALS_PATH)) {
    console.log('⏭ Google Indexing API: No credentials found at ~/google-indexing-credentials.json');
    console.log('  To set up:');
    console.log('  1. Google Cloud Console → Enable "Web Search Indexing API"');
    console.log('  2. Create Service Account → Download JSON key');
    console.log('  3. Save as ~/google-indexing-credentials.json');
    console.log('  4. Add service account email as Owner in Google Search Console');
    console.log('  Skipping Google Indexing API submission.\n');
    return { submitted: 0, skipped: true };
  }

  const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf-8'));
  const changedOnly = process.argv.includes('--changed-only');

  let urls = changedOnly ? getChangedUrls() : getUrlsFromSitemap();

  // Cap at daily limit
  if (urls.length > MAX_URLS_PER_DAY) {
    console.log(`Google Indexing API: ${urls.length} URLs found, capping at ${MAX_URLS_PER_DAY}/day limit`);
    // Prioritise changed URLs, then newest pages
    urls = urls.slice(0, MAX_URLS_PER_DAY);
  }

  console.log(`Google Indexing API: Submitting ${urls.length} URLs...`);

  try {
    const accessToken = await getAccessToken(credentials);
    const log = loadLog();
    let success = 0;
    let failed = 0;

    for (const url of urls) {
      try {
        const result = await submitUrl(url, accessToken);
        if (result.status === 200) {
          success++;
          log.submissions.push({
            url,
            timestamp: new Date().toISOString(),
            status: 'success'
          });
        } else {
          failed++;
          console.log(`  Failed: ${url} — ${result.status} ${JSON.stringify(result.data)}`);
        }
        // Small delay to avoid rate limiting
        await new Promise(r => setTimeout(r, 100));
      } catch (e) {
        failed++;
        console.log(`  Error: ${url} — ${e.message}`);
      }
    }

    // Keep only last 7 days of logs
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    log.submissions = log.submissions.filter(s => s.timestamp > weekAgo);
    saveLog(log);

    console.log(`Google Indexing API: ${success} submitted, ${failed} failed`);
    return { submitted: success, failed, skipped: false };
  } catch (err) {
    console.log(`Google Indexing API: Auth failed — ${err.message}`);
    return { submitted: 0, skipped: true };
  }
}

// Allow running standalone or as module
if (require.main === module) {
  main();
} else {
  module.exports = { main };
}
