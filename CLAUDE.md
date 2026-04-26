# Rank4AI — rank4ai.co.uk

## On session start
**Read `DAILY_BRIEF.md` at repo root if it exists.** It is auto-generated each morning by the dashboard's `push_to_fleet.py` and contains: top actions, page-1 zero-click queries, SERP movers, AI Search citation gaps, competitor visibility, today's audit issues, trending queries, content plans on file, and yesterday's wins. Use it to ground the conversation; it captures the full dashboard view, not just recommendations.

## Site
- **Domain:** rank4ai.co.uk (live since 15 Apr 2026)
- **Repo:** AdamParkerRank4AI/rank4ai-preview
- **Local:** ~/rank4ai-site
- **Cloudflare account:** info@rank4ai.online
- **Company:** Rank4AI Ltd (the agency itself)
- **Authors:** Adam Parker, Jimmy Connoley, Oliver Mackman (rotate per piece)
- **~628 live pages + ~376 redirect stubs** (stubs excluded from sitemap)

## Deployment
- Cloudflare Pages auto-deploys from GitHub on push to main
- `main` = LIVE site
- **ALWAYS ASK: "dev or main?" before pushing**
- After deploying new pages, no `npm run deploy` script exists yet (gap — see below)

## Tech Stack
- Astro 6 + Tailwind CSS 4 + TypeScript
- Integrations: @astrojs/sitemap, @astrojs/partytown
- Cloudflare Pages, FormSubmit, Supabase (anon-keyed for forms)
- Schema: FAQPage, Speakable, Organisation, Person, Article on every page
- All AI crawlers allowed in robots.txt
- llms.txt + ai-sitemap.txt + robots.txt all present in public/

## Credentials
- IndexNow Key: 4c1cc17752ab451887a14b719906f527 (file: public/4c1cc17752ab451887a14b719906f527.txt)
- FormSubmit primary: info@rank4ai.online (switch to .co.uk when email ready)
- Supabase: anon key in .env (used for live forms + dashboard mirror)

## Key Rules
1. **NO em dashes** anywhere in user-facing copy. Use full stops, colons, or commas.
2. Sitemap excludes redirect stubs and admin/lp routes (see astro.config.mjs filter)
3. Author rotation per blog/Q&A piece — never duplicate same author across consecutive auto-publishes
4. Supabase pages table mirrors live URLs (used by dashboard)

## Deploy pipeline (matches MI baseline as of 24 Apr 2026)
- `npm run deploy` → `npm run build && node scripts/deploy.cjs`
- `npm run index` → `node scripts/deploy.cjs` (skip build, just ping)
- `npm run indexnow` → `node scripts/indexnow-submit.cjs` (Bing/ChatGPT only)
- `scripts/deploy.cjs`: sitemap ping → IndexNow → Google Indexing API → CF cache purge → logs to `deploy-log.json`
- `scripts/google-indexing-submit.cjs`: service account at `~/google-indexing-credentials.json`, 200/day cap
- `scripts/purge-cf-cache.cjs`: zone `0f96cd18076e983f2ead742c0b454836`, requires `CF_TOKEN_RANK4AI`

## Plans & Databases (iCloud)
- Master content/strategy: `iCloud/claude/astro/rank4ai/`
- Site rebuild plan + designs: `iCloud/claude/astro/plan/`
- Content schedule: `iCloud/claude/astro/rank4ai/CONTENT_SCHEDULE.md`
- Daily content plan: `iCloud/claude/astro/rank4ai/DAILY_CONTENT_PLAN_30_DAYS.md`
- Blog strategy: `iCloud/claude/astro/rank4ai/BLOG_STRATEGY.md`
- Content map: `iCloud/claude/astro/rank4ai/CONTENT_MAP.md`

## Cross-Site (Fleet)
- **FLEET INBOX** (read first): `iCloud/claude/astro/FLEET/INBOX.md` — pending items for this site, address before starting new work
- Fleet index: `iCloud/claude/astro/FLEET/README.md`
- Master changelog: `iCloud/claude/astro/plan/CHANGELOG.md` (append entries here after non-trivial changes)
- Sister sites: `~/compare-invoice-finance` (marketinvoice.co.uk), `~/compareaiseo` (seocompare.co.uk)
- Build template: `iCloud/claude/astro/plan/SITE_BUILD_TEMPLATE.md`
- Dashboard: `~/rank4ai-dashboard` — clients.json includes rank4ai; daily audit data appears in `src/data/live/daily_audit_rank4ai.json`
- **Cross-site rule:** when making a structural change here, check whether it should also apply to market invoice and seocompare. Surface to Adam, do not auto-apply.
