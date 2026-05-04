import { defineSite } from "@rank4ai/fleet-core/types";

// Rank4AI is the agency itself; entity type is LocalBusiness (with
// ProfessionalService + Organization additional types in the live @graph).
// Multi-founder schema (Adam, Jimmy, Oliver) is hand-tuned in src/layouts/Layout.astro
// and does not migrate cleanly to fleet-core SchemaGraph (single-author).
// This manifest captures the primary identity for future migration; live
// schema graph stays site-local until SchemaGraph supports multi-author.

export default defineSite({
  slug: "rank4ai",
  tier: "main",
  state: "commercially_ready",
  preLaunch: false,
  modules: [],
  config: {
    domain: "www.rank4ai.co.uk",
    siteUrl: "https://www.rank4ai.co.uk",
    name: "Rank4AI",
    alternateNames: ["Rank 4 AI"],
    legalName: "Rank4AI Ltd",
    legalNumber: "16584507",
    description: "Rank4AI is a UK AI search agency that helps businesses get recommended by ChatGPT, Claude, Gemini, Perplexity, Copilot and Google AI.",
    entityType: "LocalBusiness",
    additionalEntityTypes: ["ProfessionalService", "Organization"],
    logoUrl: "/logo.png",
    contactPoint: {
      contactType: "customer service",
      email: "info@rank4ai.co.uk",
      url: "https://www.rank4ai.co.uk/contact/",
      availableLanguage: "English",
    },
    priceRange: "££",
    openingHours: {
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: "09:00",
      closes: "17:30",
    },
    foundingDate: "2025",
    topic: "AI search optimisation",
    knowsAbout: [
      "AI search visibility",
      "generative engine optimization",
      "AEO",
      "GEO",
      "ChatGPT optimisation",
      "Perplexity optimisation",
      "entity SEO",
      "AI search agencies UK",
    ],
    sameAs: [
      "https://x.com/rank4ai",
      "https://www.linkedin.com/company/rank4ai",
      "https://www.instagram.com/rank4ai",
      "https://www.facebook.com/rank4ai",
      "https://www.youtube.com/@Rank4AI",
      "https://github.com/AdamParkerRank4AI",
      "https://medium.com/@info_98087",
      "https://substack.com/@rank4aiuk",
      "https://find-and-update.company-information.service.gov.uk/company/16584507",
    ],
    address: {
      streetAddress: "40 De Vere Road",
      locality: "Colchester",
      region: "Essex",
      postalCode: "CO3 4EA",
      countryCode: "GB",
    },
    author: {
      name: "Adam Parker",
      initials: "AP",
      role: "Founder",
      bio: "Adam Parker is the founder of Rank4AI. He leads the AI search visibility methodology and the Five Signal Model used across 1,400+ UK SMB audits.",
      bylineLink: "/about/",
      knowsAbout: [
        "AI search visibility",
        "generative engine optimization",
        "AEO",
        "GEO",
        "ChatGPT optimisation",
        "Perplexity optimisation",
        "entity SEO",
        "AI search agencies UK",
      ],
      sameAs: [
        "https://www.linkedin.com/in/adamparker-rank4ai",
        "https://x.com/rank4ai",
      ],
    },
    additionalAuthors: [
      {
        name: "Jimmy Connoley",
        initials: "JC",
        role: "Co-Founder",
        bio: "Jimmy leads commercial performance and ecosystem validation at Rank4AI. B2B growth strategy background.",
        bylineLink: "/about/",
        knowsAbout: [
          "B2B growth strategy",
          "commercial performance",
          "entity clarity",
          "ecosystem validation",
          "business development",
          "AI search visibility",
        ],
        email: "jimmy@rank4ai.online",
      },
      {
        name: "Oliver Mackman",
        initials: "OM",
        role: "Operations and Marketing Director",
        bio: "Oliver leads digital strategy, marketing operations and analytics at Rank4AI. Background in technical SEO and commercial operations.",
        bylineLink: "/about/",
        knowsAbout: [
          "digital strategy",
          "marketing operations",
          "analytics",
          "technical SEO",
          "AI search optimisation",
          "commercial operations",
        ],
      },
    ],
    defaultLocale: "en-GB",
  },
});
