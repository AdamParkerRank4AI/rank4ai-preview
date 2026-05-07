/**
 * Central authors registry for Rank4AI Person schema.
 *
 * Single source of truth for the three named authors. Used by:
 *  - layouts/Layout.astro (global @graph Person blocks)
 *  - components/SpeakableSchema.astro (Article author)
 *  - pages/about/team/*.astro (per-author Person schema)
 *  - pages/blog/[slug].astro (Article author by-id reference)
 *
 * sameAs rule: real, verifiable URLs only. Adding fabricated profile URLs
 * weakens entity resolution rather than strengthening it. If a profile is
 * not in the codebase or known to exist, leave it out.
 */

export interface Author {
  /** Stable @id fragment, used to reference the Person from other schema. */
  id: string
  /** Full URL @id including site origin. */
  ref: string
  name: string
  jobTitle: string
  description: string
  /** Canonical profile page URL on rank4ai.co.uk. */
  url: string
  /** Initials for avatar boxes. */
  initials: string
  /** Topic tags for knowsAbout. */
  knowsAbout: string[]
  /** Real verifiable profile URLs. Empty array is preferable to fabricated ones. */
  sameAs: string[]
  /** Optional contact email. */
  email?: string
}

const SITE = 'https://www.rank4ai.co.uk'
const ORG_ID = `${SITE}/#localbusiness`

export const ORGANIZATION_ID = ORG_ID

export const authors: Record<'adam' | 'jimmy' | 'oliver', Author> = {
  adam: {
    id: 'adam-parker',
    ref: `${SITE}/#adam-parker`,
    name: 'Adam Parker',
    jobTitle: 'Founder',
    description: 'Founder of Rank4AI. Creator of The Five Signal Model. Over 15 years across commercial strategy, product, technology alignment and marketing.',
    url: `${SITE}/about/team/adam-parker/`,
    initials: 'AP',
    knowsAbout: [
      'AI search visibility',
      'generative engine optimization',
      'AEO',
      'GEO',
      'ChatGPT optimisation',
      'Perplexity optimisation',
      'entity SEO',
      'AI search agencies UK',
    ],
    sameAs: [
      'https://www.linkedin.com/in/adamparkerrank4ai/',
      'https://x.com/rank4ai',
      'https://github.com/AdamParkerRank4AI',
      'https://www.muswellrose.com/',
    ],
  },
  jimmy: {
    id: 'jimmy-connoley',
    ref: `${SITE}/#jimmy-connoley`,
    name: 'Jimmy Connoley',
    jobTitle: 'Co-Founder',
    description: 'Co-Founder of Rank4AI. 12 years in B2B growth strategy, business development and commercial performance. Focused on AI search visibility, entity clarity and ecosystem validation.',
    url: `${SITE}/about/team/jimmy-connoley/`,
    initials: 'JC',
    knowsAbout: [
      'B2B growth strategy',
      'commercial performance',
      'entity clarity',
      'ecosystem validation',
      'business development',
      'AI search visibility',
    ],
    // No verified public profiles in the repo. Add real URLs here when known.
    sameAs: [],
    email: 'jimmy@rank4ai.online',
  },
  oliver: {
    id: 'oliver-mackman',
    ref: `${SITE}/#oliver-mackman`,
    name: 'Oliver Mackman',
    jobTitle: 'Operations and Marketing Director',
    description: 'Operations and Marketing Director at Rank4AI. Background in marketing, digital strategy and commercial operations.',
    url: `${SITE}/about/team/oliver-mackman/`,
    initials: 'OM',
    knowsAbout: [
      'digital strategy',
      'marketing operations',
      'analytics',
      'technical SEO',
      'AI search optimisation',
      'commercial operations',
    ],
    // No verified public profiles in the repo. Add real URLs here when known.
    sameAs: [],
  },
}

export const adam = authors.adam
export const jimmy = authors.jimmy
export const oliver = authors.oliver

/**
 * Build a complete Person JSON-LD object for embedding in a page.
 * Uses worksFor by @id reference so it links cleanly to the Organization
 * in the global @graph (Layout.astro).
 */
export function personSchema(author: Author): Record<string, unknown> {
  const node: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': author.ref,
    name: author.name,
    url: author.url,
    jobTitle: author.jobTitle,
    description: author.description,
    worksFor: { '@id': ORG_ID },
    knowsAbout: author.knowsAbout,
  }
  if (author.sameAs.length > 0) node.sameAs = author.sameAs
  if (author.email) node.email = author.email
  return node
}

/**
 * Compact Person node for inclusion in the global @graph.
 * Drops @context (the @graph wrapper provides it).
 */
export function personGraphNode(author: Author): Record<string, unknown> {
  const node: Record<string, unknown> = {
    '@type': 'Person',
    '@id': author.ref,
    name: author.name,
    url: author.url,
    jobTitle: author.jobTitle,
    worksFor: { '@id': ORG_ID },
    knowsAbout: author.knowsAbout,
  }
  if (author.sameAs.length > 0) node.sameAs = author.sameAs
  if (author.email) node.email = author.email
  return node
}

/** Resolve an author by display name (case insensitive). Falls back to Adam. */
export function authorByName(name: string | undefined | null): Author {
  if (!name) return adam
  const n = name.trim().toLowerCase()
  if (n.includes('jimmy')) return jimmy
  if (n.includes('oliver') || n.includes('mackman')) return oliver
  return adam
}
