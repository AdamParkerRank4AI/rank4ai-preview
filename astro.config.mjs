// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import partytown from '@astrojs/partytown';

export default defineConfig({
  site: 'https://www.rank4ai.co.uk',
  vite: {
    plugins: [tailwindcss()]
  },
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/admin/') && !page.includes('/lp/'),
    }),
    partytown({
      config: {
        forward: ['dataLayer.push'],
      },
    }),
  ],
  redirects: {
    // Service pages
    '/ai-services': '/what-we-do/',
    '/ai-services/ai-search-audit': '/what-we-do/ai-visibility-audit/',
    '/ai-services/ai-content-rebuild': '/what-we-do/ecosystem-services/',
    '/ai-services/ai-meaning-clean-up': '/what-we-do/full-agency/',
    '/ai-services/ai-messaging-clean-up': '/what-we-do/full-agency/',
    '/ai-services/ai-visibility-boost': '/what-we-do/ecosystem-services/',
    '/ai-services/ai-agency-restructure': '/what-we-do/full-agency/',
    '/ai-services/guides/complete-guide': '/what-we-do/',
    '/ai-visibility-consultancy': '/what-we-do/full-agency/',
    '/ai-search-visibility-services': '/what-we-do/',
    '/ai-seo-audit': '/what-we-do/ai-visibility-audit/',
    '/products': '/what-we-do/',
    '/ai-seo-agency-uk/pricing': '/what-we-do/pricing/',
    '/ai-seo-agency-uk/services': '/what-we-do/',
    // City pages
    '/ai-seo-agency-uk/london': '/who-we-help/london/',
    '/ai-seo-agency-uk/manchester': '/who-we-help/manchester/',
    '/ai-seo-agency-uk/birmingham': '/who-we-help/birmingham/',
    '/ai-seo-agency-uk/leeds': '/who-we-help/leeds/',
    '/ai-seo-agency-uk/bristol': '/who-we-help/bristol/',
    '/ai-seo-agency-uk/essex': '/who-we-help/essex/',
    // Research
    '/ai-market-stats': '/research/uk-ai-visibility-stats/',
    '/ai-search-weekly': '/research/weekly-intelligence/',
    '/methodology': '/research/methodology/',
    '/industry-rankings': '/research/rankings/',
    '/top-10-ai-seo-agencies-uk-2026': '/research/rankings/top-ai-seo-agencies-uk-2026/',
    '/uk-ai-search-specialist-landscape-2026': '/research/rankings/uk-ai-search-specialist-landscape-2026/',
    // Learn
    '/guides': '/learn/guides/',
    '/glossary': '/learn/glossary/',
    '/ai-search-questions': '/learn/questions/',
    '/ai-visibility-check': '/learn/tools/ai-visibility-checker/',
    '/tools/free-llms-txt-creator': '/learn/tools/llms-txt-generator/',
    '/complete-guide-to-ai-search-visibility': '/learn/guides/complete-guide-ai-search/',
    '/guide-to-geo': '/learn/guides/geo/',
    '/how-to-get-cited-chatgpt': '/learn/guides/get-cited-chatgpt/',
    '/ai-search/guides/complete-guide': '/learn/guides/complete-guide-ai-search/',
    '/ai-search/comparisons/guides/complete-guide': '/learn/guides/ai-search-comparisons/',
    '/ai-seo/technical/guides/complete-guide': '/learn/guides/technical-ai-optimisation/',
    '/ai-marketing-growth/guides/complete-guide': '/learn/guides/ai-marketing-growth/',
    '/ai-search-questions/guides/complete-guide': '/learn/questions/',
    '/ai-search/who-should-i-hire': '/learn/guides/who-should-i-hire/',
    // About
    '/how-we-work': '/about/how-we-work/',
    '/our-ai-search-story': '/about/our-story/',
    '/ai-search/framework': '/about/five-signal-framework/',
    '/founder-insights-adam-parker': '/about/',
    '/workingwithus': '/about/how-we-work/',
    '/work-with-an-ai-search-specialist': '/about/how-we-work/',
    // Conversion
    '/start-here': '/free-audit/',
    '/quick-ai-search': '/free-audit/',
    '/rankonchatgpt': '/lp/rank-on-chatgpt/',
    '/ppc': '/lp/rank-on-chatgpt/',
    '/seo-to-aio': '/lp/seo-to-aio/',
    '/meta': '/lp/seo-to-aio/',
    // Old prefix redirects
    '/ai-search-agency-essex': '/who-we-help/essex/',
    '/ai-search-agency-london': '/who-we-help/london/',
    '/ai-search-agency-manchester': '/who-we-help/manchester/',
    '/ai-search-agency-birmingham': '/who-we-help/birmingham/',
    '/ai-search-agency-leeds': '/who-we-help/leeds/',
    '/ai-search-agency-bristol': '/who-we-help/bristol/',
    '/ai-search-services-uk': '/what-we-do/',
    '/ai-search-agency-uk': '/who-we-help/',
  },
});
