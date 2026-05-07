/**
 * Fleet attribution helper (rank4ai.co.uk · marketinvoice.co.uk · seocompare.co.uk)
 *
 * Captures and persists full lead attribution across tab opens, sessions,
 * and 30-day windows using localStorage.
 *
 * What gets stored:
 *   first_touch  - landing URL, referrer, UTMs, click IDs, channel — first time
 *                  we ever saw this browser (or after 30-day reset).
 *   last_touch   - same fields but for the current page (refreshed every page view).
 *   session_*    - this-session timing (started, last_seen, page count).
 *   journey      - rolling list of {url, path, ts} for every page visited
 *                  (capped at 50 items to bound localStorage size).
 *   device       - user-agent, screen, viewport, language, timezone.
 *
 * What forms call:
 *   window.fleetAttribution.payload()         → returns the full data object
 *   window.fleetAttribution.notes()           → human-readable single-line notes
 *   window.fleetAttribution.submit(opts)      → posts to Supabase + FormSubmit
 *                                                with full attribution attached
 *
 * Loaded on every page via BaseLayout.astro <script src="/attribution.js" is:inline>.
 *
 * Site identification: KEY_PREFIX is set per site (r4_ / mi_ / sc_) below
 * via window.__FLEET_SITE; defaults to inferring from hostname.
 */
(function () {
  'use strict';

  // ---- Site identification + storage key ----
  const HOSTNAME = (typeof window !== 'undefined' && window.location && window.location.hostname) || '';
  const SITE_ID = HOSTNAME.includes('rank4ai') ? 'r4'
    : HOSTNAME.includes('marketinvoice') ? 'mi'
    : HOSTNAME.includes('seocompare') ? 'sc'
    : 'fleet';
  const KEY = SITE_ID + '_attribution';
  const SESSION_KEY = SITE_ID + '_session';
  const TTL_MS = 30 * 24 * 60 * 60 * 1000;        // 30 days
  const SESSION_TTL_MS = 30 * 60 * 1000;          // 30 mins of inactivity = new session
  const MAX_JOURNEY = 50;

  // ---- Helpers ----
  function safeParse(s) { try { return JSON.parse(s); } catch { return null; } }
  function nowIso() { return new Date().toISOString(); }
  function nowMs() { return Date.now(); }

  function captureUrlBits() {
    const url = new URL(window.location.href);
    return {
      url: window.location.href,
      path: window.location.pathname,
      referrer: document.referrer || null,
      referrer_host: document.referrer ? (function () { try { return new URL(document.referrer).hostname; } catch { return null; } })() : null,
      utm_source: url.searchParams.get('utm_source'),
      utm_medium: url.searchParams.get('utm_medium'),
      utm_campaign: url.searchParams.get('utm_campaign'),
      utm_term: url.searchParams.get('utm_term'),
      utm_content: url.searchParams.get('utm_content'),
      gclid: url.searchParams.get('gclid'),
      fbclid: url.searchParams.get('fbclid'),
      msclkid: url.searchParams.get('msclkid'),
      ts: nowIso(),
    };
  }

  function captureDevice() {
    let viewport = '';
    let screen = '';
    try {
      viewport = window.innerWidth + 'x' + window.innerHeight;
      screen = (window.screen && window.screen.width) ? window.screen.width + 'x' + window.screen.height : '';
    } catch {}
    let timezone = '';
    try { timezone = Intl.DateTimeFormat().resolvedOptions().timeZone; } catch {}
    return {
      user_agent: navigator.userAgent,
      language: navigator.language,
      languages: (navigator.languages || []).slice(0, 5),
      viewport: viewport,
      screen: screen,
      timezone: timezone,
      platform: navigator.platform,
      cookies_enabled: navigator.cookieEnabled,
      online: navigator.onLine,
    };
  }

  function inferSource(t) {
    if (!t) return 'direct';
    if (t.utm_source) return t.utm_source;
    if (t.gclid) return 'google-ads';
    if (t.fbclid) return 'facebook-ads';
    if (t.msclkid) return 'bing-ads';
    if (!t.referrer_host) return 'direct';
    const h = t.referrer_host.toLowerCase();
    if (h.includes('google.')) return 'google-organic';
    if (h.includes('bing.')) return 'bing-organic';
    if (h.includes('duckduckgo.')) return 'duckduckgo-organic';
    if (h.includes('yahoo.')) return 'yahoo-organic';
    if (h.includes('chat.openai.') || h.includes('chatgpt.')) return 'chatgpt';
    if (h.includes('perplexity.')) return 'perplexity';
    if (h.includes('claude.') || h.includes('anthropic.')) return 'claude';
    if (h.includes('gemini.') || h.includes('bard.')) return 'gemini';
    if (h.includes('copilot.microsoft.')) return 'copilot';
    if (h.includes('linkedin.')) return 'linkedin';
    if (h.includes('twitter.') || h.includes('t.co') || h.includes('x.com')) return 'twitter-x';
    if (h.includes('facebook.') || h.includes('fb.com')) return 'facebook';
    if (h.includes('reddit.')) return 'reddit';
    if (h.includes('youtube.')) return 'youtube';
    if (h.includes('instagram.')) return 'instagram';
    if (h.includes('tiktok.')) return 'tiktok';
    if (h.includes(HOSTNAME)) return 'internal';
    if (HOSTNAME.includes('rank4ai') && (h.includes('marketinvoice') || h.includes('seocompare'))) return 'fleet-internal';
    if (HOSTNAME.includes('marketinvoice') && (h.includes('rank4ai') || h.includes('seocompare'))) return 'fleet-internal';
    if (HOSTNAME.includes('seocompare') && (h.includes('rank4ai') || h.includes('marketinvoice'))) return 'fleet-internal';
    return 'referral-' + h;
  }

  // ---- Load existing state, refresh, save ----
  function loadState() {
    let state = safeParse(localStorage.getItem(KEY));
    if (state && state.first_touch && state.first_touch.ts) {
      const age = nowMs() - new Date(state.first_touch.ts).getTime();
      if (age > TTL_MS) state = null;     // expired, treat as new visitor
    }
    if (!state) {
      state = {
        first_touch: null,
        last_touch: null,
        journey: [],
        site: SITE_ID,
        first_seen_at: nowIso(),
      };
    }
    return state;
  }

  function loadSession() {
    let s = safeParse(sessionStorage.getItem(SESSION_KEY));
    const now = nowMs();
    if (s && s.last_seen_ms && (now - s.last_seen_ms) > SESSION_TTL_MS) s = null;
    if (!s) {
      s = {
        session_started_at: nowIso(),
        page_count: 0,
        first_landing_in_session: window.location.pathname,
        last_seen_ms: now,
      };
    }
    return s;
  }

  // ---- Initialise on every page load ----
  const state = loadState();
  const session = loadSession();
  const here = captureUrlBits();
  const device = captureDevice();

  // first_touch: only set on the very first page load we ever see
  if (!state.first_touch) {
    state.first_touch = Object.assign({}, here, { source: inferSource(here) });
  }

  // last_touch: refresh on every page
  state.last_touch = Object.assign({}, here, { source: inferSource(here) });

  // journey: append current page (de-dup against immediate previous)
  const prev = state.journey[state.journey.length - 1];
  if (!prev || prev.url !== here.url) {
    state.journey.push({ url: here.url, path: here.path, ts: here.ts });
    if (state.journey.length > MAX_JOURNEY) state.journey = state.journey.slice(-MAX_JOURNEY);
  }

  // session: bump
  session.page_count = (session.page_count || 0) + 1;
  session.last_seen_ms = nowMs();
  session.last_seen_at = nowIso();

  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {}
  try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(session)); } catch {}

  // ---- Public API ----
  function payload() {
    return {
      site: SITE_ID,
      // First-touch (where they originally came from — survives 30 days)
      first_touch: state.first_touch,
      first_seen_at: state.first_seen_at,
      // Last-touch (referrer at the page they're submitting from)
      last_touch: state.last_touch,
      // This session
      session_started_at: session.session_started_at,
      session_page_count: session.page_count,
      session_first_landing: session.first_landing_in_session,
      // Full visit journey (across all sessions, cap 50)
      journey: state.journey,
      journey_length: state.journey.length,
      // Device
      device: device,
      // Submitted from
      submitted_at: nowIso(),
      submitted_from: window.location.href,
      submitted_path: window.location.pathname,
    };
  }

  function notes() {
    const ft = state.first_touch || {};
    const lt = state.last_touch || {};
    const j = state.journey.map(p => p.path).join(' → ');
    return [
      'first_source=' + (ft.source || 'unknown'),
      'first_landing=' + (ft.path || ''),
      'first_referrer=' + (ft.referrer || 'none'),
      'first_utm_source=' + (ft.utm_source || ''),
      'first_utm_medium=' + (ft.utm_medium || ''),
      'first_utm_campaign=' + (ft.utm_campaign || ''),
      'first_click_id=' + (ft.gclid || ft.fbclid || ft.msclkid || ''),
      'first_seen=' + state.first_seen_at,
      'last_source=' + (lt.source || 'unknown'),
      'last_referrer=' + (lt.referrer || 'none'),
      'session_started=' + session.session_started_at,
      'session_pages=' + session.page_count,
      'journey=' + j,
      'tz=' + (device.timezone || ''),
      'viewport=' + (device.viewport || ''),
      'lang=' + (device.language || ''),
    ].join(' | ');
  }

  // Optional IP/geo enrichment - free tier of ipapi.co (1000 req/day).
  // Returns a Promise. Forms can await this OR fire-and-forget.
  function fetchGeo() {
    return fetch('https://ipapi.co/json/', { method: 'GET' })
      .then(r => r.ok ? r.json() : null)
      .then(g => g ? {
        ip: g.ip,
        country: g.country_name,
        country_code: g.country_code,
        region: g.region,
        city: g.city,
        postal: g.postal,
        timezone: g.timezone,
        org: g.org,
      } : null)
      .catch(() => null);
  }

  // Build a flat object suitable for both Supabase columns and FormSubmit fields.
  // Each attribute prefixed with `attr_` so a single payload satisfies both.
  function flatPayload() {
    const p = payload();
    const ft = p.first_touch || {};
    const lt = p.last_touch || {};
    const d = p.device || {};
    return {
      // First-touch (the original "where they came from")
      attr_first_source: ft.source || '',
      attr_first_landing_url: ft.url || '',
      attr_first_landing_path: ft.path || '',
      attr_first_referrer: ft.referrer || '',
      attr_first_referrer_host: ft.referrer_host || '',
      attr_first_utm_source: ft.utm_source || '',
      attr_first_utm_medium: ft.utm_medium || '',
      attr_first_utm_campaign: ft.utm_campaign || '',
      attr_first_utm_term: ft.utm_term || '',
      attr_first_utm_content: ft.utm_content || '',
      attr_first_gclid: ft.gclid || '',
      attr_first_fbclid: ft.fbclid || '',
      attr_first_msclkid: ft.msclkid || '',
      attr_first_seen_at: p.first_seen_at,
      // Last-touch
      attr_last_source: lt.source || '',
      attr_last_url: lt.url || '',
      attr_last_path: lt.path || '',
      attr_last_referrer: lt.referrer || '',
      // Session
      attr_session_started_at: p.session_started_at,
      attr_session_page_count: p.session_page_count,
      attr_session_first_landing: p.session_first_landing,
      // Journey
      attr_journey: p.journey.map(j => j.path).join(' → '),
      attr_journey_count: p.journey_length,
      // Device
      attr_user_agent: d.user_agent || '',
      attr_viewport: d.viewport || '',
      attr_screen: d.screen || '',
      attr_language: d.language || '',
      attr_timezone: d.timezone || '',
      attr_platform: d.platform || '',
      // Submission
      attr_submitted_at: p.submitted_at,
      attr_submitted_from: p.submitted_from,
    };
  }

  window.fleetAttribution = {
    payload: payload,
    flatPayload: flatPayload,
    notes: notes,
    fetchGeo: fetchGeo,
    inferSource: inferSource,
    siteId: SITE_ID,
    storageKey: KEY,
    // Expose internals for debugging from the console
    _state: state,
    _session: session,
  };
})();
