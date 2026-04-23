#!/usr/bin/env node
/**
 * Cloudflare Cache Purge
 *
 * Purges the entire cache for this site's Cloudflare zone, so the new deploy
 * is served immediately (otherwise users can see stale HTML for up to ~4 hours).
 *
 * Requires env vars:
 *   CLOUDFLARE_API_TOKEN  — token with Zone:Cache Purge scope
 *   (token comes from ~/.zshrc: CF_TOKEN_RANK4AI for this site)
 *
 * Zone ID is hard-coded per site. Change this for other sites:
 *   marketinvoice.co.uk = a087fb8362314266147dcbf72cec5932
 *   rank4ai.co.uk       = 0f96cd18076e983f2ead742c0b454836
 *   seocompare.co.uk    = 464d0139c2f9c598664ec89a731a3e87
 *   49k.co.uk           = edcd7debfad2e0cc0edd6f71eb6baf64
 */

const ZONE_ID = '0f96cd18076e983f2ead742c0b454836'; // rank4ai.co.uk

async function main() {
  const token = process.env.CLOUDFLARE_API_TOKEN || process.env.CF_TOKEN_RANK4AI;
  if (!token) {
    console.log('⏭ Cache purge: no CLOUDFLARE_API_TOKEN in env. Skipping.');
    console.log('   export CLOUDFLARE_API_TOKEN=$CF_TOKEN_RANK4AI to enable.');
    return { skipped: true };
  }
  try {
    const res = await fetch(`https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/purge_cache`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ purge_everything: true }),
    });
    const data = await res.json();
    if (data.success) {
      console.log(`  Cache purge: ✓ OK (zone ${ZONE_ID.slice(0, 8)}…)`);
      return { purged: true };
    } else {
      console.log(`  Cache purge: ✗ ${JSON.stringify(data.errors)}`);
      return { purged: false, errors: data.errors };
    }
  } catch (e) {
    console.log(`  Cache purge: failed — ${e.message}`);
    return { purged: false, error: e.message };
  }
}

if (require.main === module) {
  main();
} else {
  module.exports = { main };
}
