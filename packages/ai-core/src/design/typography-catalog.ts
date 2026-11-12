/**
 * Aegis AI — Phase 3 Curated Typography Catalog
 *
 * Provides a curated library of exactly 30 distinct font pairings
 * spanning varied application domains (SaaS, Luxury, Aerospace, Marine,
 * Editorial, Education, Industrial, Healthcare, etc.).
 *
 * Each pairing contains a robust system fallback cascade so projects
 * remain 100% readable and unbroken even if remote font networks are unavailable.
 */

export interface FontScale {
  h1: string;
  h2: string;
  h3: string;
  h4: string;
  body: string;
  small: string;
}

export interface FontPairing {
  id: string;
  name: string;
  category:
    | "saas"
    | "aerospace"
    | "luxury"
    | "marine"
    | "editorial"
    | "creative"
    | "artisanal"
    | "industrial"
    | "healthcare"
    | "education"
    | "fintech"
    | "enterprise"
    | "collaboration"
    | "hospitality";
  displayFont: string;
  bodyFont: string;
  monoFont: string;
  displayStack: string;
  bodyStack: string;
  monoStack: string;
  googleFontsUrl: string;
  useCase: string;
  rationale: string;
  scale: FontScale;
}

const DEFAULT_SCALE: FontScale = {
  h1: "2.75rem",
  h2: "2rem",
  h3: "1.5rem",
  h4: "1.25rem",
  body: "1rem",
  small: "0.875rem",
};

const COMPACT_SCALE: FontScale = {
  h1: "2.25rem",
  h2: "1.75rem",
  h3: "1.35rem",
  h4: "1.15rem",
  body: "0.9375rem",
  small: "0.8125rem",
};

const EDITORIAL_SCALE: FontScale = {
  h1: "3.25rem",
  h2: "2.25rem",
  h3: "1.65rem",
  h4: "1.3rem",
  body: "1.0625rem",
  small: "0.875rem",
};

export const CURATED_FONT_PAIRINGS: FontPairing[] = [
  // 1. SaaS & Modern Digital Product
  {
    id: "inter_clean_saas",
    name: "Inter Modern Neutral",
    category: "saas",
    displayFont: "Inter",
    bodyFont: "Inter",
    monoFont: "JetBrains Mono",
    displayStack: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    bodyStack: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    monoStack: '"JetBrains Mono", "Fira Code", monospace',
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap",
    useCase: "B2B SaaS dashboards, workflow automation, and productivity applications",
    rationale: "Maximum legibility across high information-density views with tall x-height and clear numerals.",
    scale: COMPACT_SCALE,
  },
  // 2. High-Tech B2B Product
  {
    id: "plus_jakarta_inter",
    name: "Plus Jakarta & Inter",
    category: "saas",
    displayFont: "Plus Jakarta Sans",
    bodyFont: "Inter",
    monoFont: "JetBrains Mono",
    displayStack: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, sans-serif',
    bodyStack: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    monoStack: '"JetBrains Mono", monospace',
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;700;800&family=Inter:wght@400;500&display=swap",
    useCase: "Modern cloud platforms, infrastructure management, and developer tools",
    rationale: "Contemporary geometric display personality balanced with neutral body readability.",
    scale: DEFAULT_SCALE,
  },
  // 3. Aerospace & Satellite Operations
  {
    id: "space_grotesk_space_mono",
    name: "Space Grotesk & Space Mono",
    category: "aerospace",
    displayFont: "Space Grotesk",
    bodyFont: "Space Grotesk",
    monoFont: "Space Mono",
    displayStack: '"Space Grotesk", -apple-system, BlinkMacSystemFont, monospace, sans-serif',
    bodyStack: '"Space Grotesk", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    monoStack: '"Space Mono", monospace',
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Space+Mono:wght@400;700&display=swap",
    useCase: "Satellite constellations, orbital telemetry HUDs, and astronomy control consoles",
    rationale: "Distinctive technological precision reminiscent of aerospace flight director consoles.",
    scale: COMPACT_SCALE,
  },
  // 4. Tactical Flight / Telemetry HUD
  {
    id: "barlow_telemetry",
    name: "Barlow & Barlow Condensed",
    category: "aerospace",
    displayFont: "Barlow Condensed",
    bodyFont: "Barlow",
    monoFont: "Share Tech Mono",
    displayStack: '"Barlow Condensed", -apple-system, sans-serif',
    bodyStack: '"Barlow", -apple-system, BlinkMacSystemFont, sans-serif',
    monoStack: '"Share Tech Mono", monospace',
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700&family=Barlow:wght@400;500&family=Share+Tech+Mono&display=swap",
    useCase: "Mission control telemetry streams, avionics monitors, and radar dashboards",
    rationale: "Condensed heads optimize screen real estate in mission-critical data tables.",
    scale: COMPACT_SCALE,
  },
  // 5. Marine Engineering & Spatial Architecture
  {
    id: "outfit_jakarta",
    name: "Outfit & Plus Jakarta Sans",
    category: "marine",
    displayFont: "Outfit",
    bodyFont: "Plus Jakarta Sans",
    monoFont: "IBM Plex Mono",
    displayStack: '"Outfit", -apple-system, BlinkMacSystemFont, sans-serif',
    bodyStack: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, sans-serif',
    monoStack: '"IBM Plex Mono", monospace',
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Outfit:wght@500;600;700&family=Plus+Jakarta+Sans:wght@400;500&display=swap",
    useCase: "Subsea habitat management, marine research stations, and acoustic sensors",
    rationale: "Fluid, circular forms evoke pressure vessels and organic marine geometries.",
    scale: DEFAULT_SCALE,
  },
  // 6. Maritime Logistics & Naval Engineering
  {
    id: "lexend_deca_ibm_plex",
    name: "Lexend Deca & IBM Plex Sans",
    category: "marine",
    displayFont: "Lexend Deca",
    bodyFont: "IBM Plex Sans",
    monoFont: "IBM Plex Mono",
    displayStack: '"Lexend Deca", -apple-system, BlinkMacSystemFont, sans-serif',
    bodyStack: '"IBM Plex Sans", -apple-system, BlinkMacSystemFont, sans-serif',
    monoStack: '"IBM Plex Mono", monospace',
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Lexend+Deca:wght@600;700&family=IBM+Plex+Sans:wght@400;500&family=IBM+Plex+Mono&display=swap",
    useCase: "Cargo fleet logistics, oceanic bathymetry portals, and port operations",
    rationale: "Engineering-grade rigor combined with rapid ocular scanning.",
    scale: COMPACT_SCALE,
  },
  // 7. Bespoke Hypercar Atelier & Haute Horlogerie
  {
    id: "cinzel_cormorant",
    name: "Cinzel & Cormorant Garamond",
    category: "luxury",
    displayFont: "Cinzel",
    bodyFont: "Cormorant Garamond",
    monoFont: "Courier Prime",
    displayStack: '"Cinzel", "Times New Roman", Georgia, serif',
    bodyStack: '"Cormorant Garamond", Garamond, Georgia, serif',
    monoStack: '"Courier Prime", monospace',
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700&family=Cormorant+Garamond:wght@400;500;600&display=swap",
    useCase: "Handcrafted hypercar ateliers, bespoke watchmaking, and heritage jewelry commissions",
    rationale: "Roman inscriptional capitals paired with refined classical serif for bespoke luxury.",
    scale: EDITORIAL_SCALE,
  },
  // 7b. Luxury Architecture Studio & Sustainable Interior Atelier
  {
    id: "cormorant_dm_sans",
    name: "Cormorant Garamond & DM Sans",
    category: "luxury",
    displayFont: "Cormorant Garamond",
    bodyFont: "DM Sans",
    monoFont: "IBM Plex Mono",
    displayStack: '"Cormorant Garamond", Garamond, Georgia, serif',
    bodyStack: '"DM Sans", -apple-system, BlinkMacSystemFont, sans-serif',
    monoStack: '"IBM Plex Mono", monospace',
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=IBM+Plex+Mono:wght@400;500;600&display=swap",
    useCase: "Luxury architectural studios, interior design monographs, and spatial planning ateliers",
    rationale: "Expressive editorial serif headings paired with restrained modern sans-serif for architectural clarity.",
    scale: EDITORIAL_SCALE,
  },
  // 8. Luxury Automotive Performance
  {
    id: "clash_display_archivo",
    name: "Clash Display & Archivo",
    category: "luxury",
    displayFont: "Clash Display",
    bodyFont: "Archivo",
    monoFont: "JetBrains Mono",
    displayStack: '"Clash Display", -apple-system, BlinkMacSystemFont, sans-serif',
    bodyStack: '"Archivo", -apple-system, BlinkMacSystemFont, sans-serif',
    monoStack: '"JetBrains Mono", monospace',
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700&display=swap",
    useCase: "High-performance vehicle configurators, aerodynamics studios, and racing teams",
    rationale: "Bold automotive stance with aggressive corner cuts and aerodynamic weight.",
    scale: DEFAULT_SCALE,
  },
  // 9. Editorial Heritage & Journalism
  {
    id: "playfair_source_serif",
    name: "Playfair Display & Source Serif",
    category: "editorial",
    displayFont: "Playfair Display",
    bodyFont: "Source Serif 4",
    monoFont: "JetBrains Mono",
    displayStack: '"Playfair Display", Georgia, "Times New Roman", serif',
    bodyStack: '"Source Serif 4", Georgia, serif',
    monoStack: '"JetBrains Mono", monospace',
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;1,400&family=Source+Serif+4:ital,wght@0,400;0,600;1,400&display=swap",
    useCase: "Long-form journalism, literary digests, policy institutes, and thought leadership",
    rationale: "High-contrast transitional serif reminiscent of broadsheet print elegance.",
    scale: EDITORIAL_SCALE,
  },
  // 10. Long-Form Publishing & Research
  {
    id: "newsreader_inter",
    name: "Newsreader & Inter",
    category: "editorial",
    displayFont: "Newsreader",
    bodyFont: "Inter",
    monoFont: "JetBrains Mono",
    displayStack: '"Newsreader", Georgia, serif',
    bodyStack: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
    monoStack: '"JetBrains Mono", monospace',
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,500;0,6..72,700;1,6..72,400&family=Inter:wght@400;500&display=swap",
    useCase: "Economic whitepapers, academic institutes, and investigative reporting archives",
    rationale: "Optical size-optimized serif title paired with clean, accessible sans body text.",
    scale: EDITORIAL_SCALE,
  },
  // 11. Avant-Garde & Creative Studio
  {
    id: "syne_work_sans",
    name: "Syne & Work Sans",
    category: "creative",
    displayFont: "Syne",
    bodyFont: "Work Sans",
    monoFont: "Space Mono",
    displayStack: '"Syne", -apple-system, BlinkMacSystemFont, sans-serif',
    bodyStack: '"Work Sans", -apple-system, BlinkMacSystemFont, sans-serif',
    monoStack: '"Space Mono", monospace',
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Work+Sans:wght@400;500&display=swap",
    useCase: "Contemporary art exhibitions, experiential design studios, and music labels",
    rationale: "Striking sculptural letterforms communicate artistic daring and originality.",
    scale: EDITORIAL_SCALE,
  },
  // 12. Modern Typography Atelier
  {
    id: "instrument_sans_serif",
    name: "Instrument Serif & Instrument Sans",
    category: "creative",
    displayFont: "Instrument Serif",
    bodyFont: "Instrument Sans",
    monoFont: "JetBrains Mono",
    displayStack: '"Instrument Serif", Georgia, serif',
    bodyStack: '"Instrument Sans", -apple-system, BlinkMacSystemFont, sans-serif',
    monoStack: '"JetBrains Mono", monospace',
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Instrument+Sans:wght@400;500;600&display=swap",
    useCase: "Architecture monographs, photography portfolios, and cultural foundations",
    rationale: "Precision-drawn humanist serif with contemporary grotesque partner.",
    scale: EDITORIAL_SCALE,
  },
  // 13. Artisanal Culinary & Hospitality
  {
    id: "fraunces_cabinet",
    name: "Fraunces & Cabinet Grotesk",
    category: "artisanal",
    displayFont: "Fraunces",
    bodyFont: "Inter",
    monoFont: "Courier Prime",
    displayStack: '"Fraunces", Georgia, serif',
    bodyStack: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
    monoStack: '"Courier Prime", monospace',
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&family=Inter:wght@400;500&display=swap",
    useCase: "Boutique wineries, specialty roasteries, farm-to-table dining, and craft distilleries",
    rationale: "Warm, organic 'wonky' serifs impart tactile human craftsmanship.",
    scale: EDITORIAL_SCALE,
  },
  // 14. Fine Dining & Luxury Hospitality
  {
    id: "cormorant_proza",
    name: "Cormorant & Proza Libre",
    category: "hospitality",
    displayFont: "Cormorant",
    bodyFont: "Proza Libre",
    monoFont: "Courier Prime",
    displayStack: '"Cormorant", Garamond, Georgia, serif',
    bodyStack: '"Proza Libre", -apple-system, BlinkMacSystemFont, sans-serif',
    monoStack: '"Courier Prime", monospace',
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Cormorant:wght@600;700&family=Proza+Libre:wght@400;500&display=swap",
    useCase: "Michelin-starred restaurants, historic hotel reservations, and tasting salons",
    rationale: "Exquisite French Renaissance proportions with rhythmic humanist text companion.",
    scale: DEFAULT_SCALE,
  },
  // 15. Industrial Utility & Heavy Equipment
  {
    id: "archivo_roboto_mono",
    name: "Archivo & Roboto Mono",
    category: "industrial",
    displayFont: "Archivo",
    bodyFont: "Archivo",
    monoFont: "Roboto Mono",
    displayStack: '"Archivo", -apple-system, BlinkMacSystemFont, sans-serif',
    bodyStack: '"Archivo", -apple-system, BlinkMacSystemFont, sans-serif',
    monoStack: '"Roboto Mono", monospace',
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Archivo:wght@600;700;800&family=Roboto+Mono:wght@400;500&display=swap",
    useCase: "Warehouse logistics, manufacturing telemetry, robotics monitoring, and inventory systems",
    rationale: "Rugged grotesk built for high-contrast industrial readability on field tablets.",
    scale: COMPACT_SCALE,
  },
  // 16. Structural Engineering & Construction
  {
    id: "teko_rajdhani",
    name: "Teko & Rajdhani",
    category: "industrial",
    displayFont: "Teko",
    bodyFont: "Rajdhani",
    monoFont: "Roboto Mono",
    displayStack: '"Teko", -apple-system, sans-serif',
    bodyStack: '"Rajdhani", -apple-system, BlinkMacSystemFont, sans-serif',
    monoStack: '"Roboto Mono", monospace',
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Teko:wght@600;700&family=Rajdhani:wght@500;600&display=swap",
    useCase: "Civil engineering projects, heavy machinery telemetry, and building sensors",
    rationale: "Bold condensed geometric headings mirroring steel beams and architectural drafting.",
    scale: DEFAULT_SCALE,
  },
  // 17. Healthcare & Clinical Precision
  {
    id: "albert_sans_jakarta",
    name: "Albert Sans & Plus Jakarta",
    category: "healthcare",
    displayFont: "Albert Sans",
    bodyFont: "Plus Jakarta Sans",
    monoFont: "IBM Plex Mono",
    displayStack: '"Albert Sans", -apple-system, BlinkMacSystemFont, sans-serif',
    bodyStack: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, sans-serif',
    monoStack: '"IBM Plex Mono", monospace',
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Albert+Sans:wght@600;700&family=Plus+Jakarta+Sans:wght@400;500&display=swap",
    useCase: "Diagnostic laboratories, patient monitoring portals, and clinical pharmacology",
    rationale: "Calm, hygienic geometric clarity reassuring patients and clinicians.",
    scale: DEFAULT_SCALE,
  },
  // 18. Personal Health & Wellness Tracking
  {
    id: "figtree_outfit",
    name: "Figtree & Outfit",
    category: "healthcare",
    displayFont: "Figtree",
    bodyFont: "Outfit",
    monoFont: "JetBrains Mono",
    displayStack: '"Figtree", -apple-system, BlinkMacSystemFont, sans-serif',
    bodyStack: '"Outfit", -apple-system, BlinkMacSystemFont, sans-serif',
    monoStack: '"JetBrains Mono", monospace',
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Figtree:wght@600;700&family=Outfit:wght@400;500&display=swap",
    useCase: "Habit tracking, sleep telemetry, meditation journals, and personal health dashboards",
    rationale: "Warm and inviting sans letterforms that reduce stress and encourage daily engagement.",
    scale: DEFAULT_SCALE,
  },
  // 19. Accessible & Universal Education
  {
    id: "lexend_nunito",
    name: "Lexend & Nunito",
    category: "education",
    displayFont: "Lexend",
    bodyFont: "Nunito",
    monoFont: "Fira Code",
    displayStack: '"Lexend", -apple-system, BlinkMacSystemFont, sans-serif',
    bodyStack: '"Nunito", -apple-system, BlinkMacSystemFont, sans-serif',
    monoStack: '"Fira Code", monospace',
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Lexend:wght@600;700&family=Nunito:wght@400;600&display=swap",
    useCase: "K-12 learning management, student portfolios, special needs education, and public literacy",
    rationale: "Scientifically engineered letter spacing proven to increase reading fluency and reduce cognitive load.",
    scale: DEFAULT_SCALE,
  },
  // 20. Academic & Higher Education
  {
    id: "merriweather_open_sans",
    name: "Merriweather & Open Sans",
    category: "education",
    displayFont: "Merriweather",
    bodyFont: "Open Sans",
    monoFont: "Source Code Pro",
    displayStack: '"Merriweather", Georgia, serif',
    bodyStack: '"Open Sans", -apple-system, BlinkMacSystemFont, sans-serif',
    monoStack: '"Source Code Pro", monospace',
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Merriweather:wght@700&family=Open+Sans:wght@400;600&display=swap",
    useCase: "University course catalogs, research symposiums, and faculty publication repositories",
    rationale: "Authoritative academic serif title coupled with neutral, universally readable body text.",
    scale: DEFAULT_SCALE,
  },
  // 21. High-Velocity Web3 & Fintech
  {
    id: "sora_dm_sans",
    name: "Sora & DM Sans",
    category: "fintech",
    displayFont: "Sora",
    bodyFont: "DM Sans",
    monoFont: "JetBrains Mono",
    displayStack: '"Sora", -apple-system, BlinkMacSystemFont, sans-serif',
    bodyStack: '"DM Sans", -apple-system, BlinkMacSystemFont, sans-serif',
    monoStack: '"JetBrains Mono", monospace',
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=DM+Sans:wght@400;500;700&display=swap",
    useCase: "Decentralized finance exchanges, payment processing gateways, and asset managers",
    rationale: "Cryptographic geometric cues with sharp apexes and modern numeric tabular alignment.",
    scale: COMPACT_SCALE,
  },
  // 22. Wealth Management & Private Banking
  {
    id: "dm_serif_inter",
    name: "DM Serif Display & Inter",
    category: "fintech",
    displayFont: "DM Serif Display",
    bodyFont: "Inter",
    monoFont: "JetBrains Mono",
    displayStack: '"DM Serif Display", Georgia, serif',
    bodyStack: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
    monoStack: '"JetBrains Mono", monospace',
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Inter:wght@400;500;600&display=swap",
    useCase: "Private banking portals, institutional treasury, and wealth management portfolios",
    rationale: "Commanding financial authority in headlines supported by clean data tables.",
    scale: DEFAULT_SCALE,
  },
  // 23. Cloud Infrastructure & Developer Platform
  {
    id: "spline_sans_mono",
    name: "Spline Sans & Spline Sans Mono",
    category: "enterprise",
    displayFont: "Spline Sans",
    bodyFont: "Spline Sans",
    monoFont: "Spline Sans Mono",
    displayStack: '"Spline Sans", -apple-system, BlinkMacSystemFont, sans-serif',
    bodyStack: '"Spline Sans", -apple-system, BlinkMacSystemFont, sans-serif',
    monoStack: '"Spline Sans Mono", monospace',
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Spline+Sans:wght@500;600;700&family=Spline+Sans+Mono:wght@400;500&display=swap",
    useCase: "Kubernetes clusters, serverless orchestration, and CI/CD pipelines",
    rationale: "Engineered specifically for UI/code mixed displays and technical workflows.",
    scale: COMPACT_SCALE,
  },
  // 24. Enterprise Linux & Open Source
  {
    id: "red_hat_display_text",
    name: "Red Hat Display & Text",
    category: "enterprise",
    displayFont: "Red Hat Display",
    bodyFont: "Red Hat Text",
    monoFont: "Red Hat Mono",
    displayStack: '"Red Hat Display", -apple-system, BlinkMacSystemFont, sans-serif',
    bodyStack: '"Red Hat Text", -apple-system, BlinkMacSystemFont, sans-serif',
    monoStack: '"Red Hat Mono", monospace',
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Red+Hat+Display:wght@700;800&family=Red+Hat+Text:wght@400;500&family=Red+Hat+Mono&display=swap",
    useCase: "Open-source foundations, container registries, and enterprise operating systems",
    rationale: "Unmistakable enterprise technology pedigree and balanced typographic rhythm.",
    scale: DEFAULT_SCALE,
  },
  // 25. Architecture & Spatial Design
  {
    id: "urbanist_inter",
    name: "Urbanist & Inter",
    category: "creative",
    displayFont: "Urbanist",
    bodyFont: "Inter",
    monoFont: "Space Mono",
    displayStack: '"Urbanist", -apple-system, BlinkMacSystemFont, sans-serif',
    bodyStack: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
    monoStack: '"Space Mono", monospace',
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Urbanist:wght@600;700;800&family=Inter:wght@400;500&display=swap",
    useCase: "Architectural firms, urban planning models, and interior design showrooms",
    rationale: "Geometric low-contrast sans echoing structural grids and modernist elevations.",
    scale: DEFAULT_SCALE,
  },
  // 26. Creative Agency & Campaign
  {
    id: "epilogue_chivo",
    name: "Epilogue & Chivo",
    category: "creative",
    displayFont: "Epilogue",
    bodyFont: "Chivo",
    monoFont: "JetBrains Mono",
    displayStack: '"Epilogue", -apple-system, BlinkMacSystemFont, sans-serif',
    bodyStack: '"Chivo", -apple-system, BlinkMacSystemFont, sans-serif',
    monoStack: '"JetBrains Mono", monospace',
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Epilogue:wght@700;800&family=Chivo:wght@400;500&display=swap",
    useCase: "Brand strategy agencies, creative director portfolios, and ad tech platforms",
    rationale: "Variable grotesque with bold punch and expressive typographic character.",
    scale: EDITORIAL_SCALE,
  },
  // 27. Team Collaboration & Knowledge Workspace
  {
    id: "manrope_inter",
    name: "Manrope & Inter",
    category: "collaboration",
    displayFont: "Manrope",
    bodyFont: "Inter",
    monoFont: "JetBrains Mono",
    displayStack: '"Manrope", -apple-system, BlinkMacSystemFont, sans-serif',
    bodyStack: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
    monoStack: '"JetBrains Mono", monospace',
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Manrope:wght@600;700;800&family=Inter:wght@400;500&display=swap",
    useCase: "Knowledge bases, document collaboration suites, and remote sprint workspaces",
    rationale: "Open counters and semi-rounded corners maintain friendly readability over long work sessions.",
    scale: DEFAULT_SCALE,
  },
  // 28. Vibrant Consumer & Mobile-First
  {
    id: "poppins_inter",
    name: "Poppins & Inter",
    category: "saas",
    displayFont: "Poppins",
    bodyFont: "Inter",
    monoFont: "JetBrains Mono",
    displayStack: '"Poppins", -apple-system, BlinkMacSystemFont, sans-serif',
    bodyStack: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
    monoStack: '"JetBrains Mono", monospace',
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Poppins:wght@600;700&family=Inter:wght@400;500&display=swap",
    useCase: "Consumer subscriptions, food delivery, fitness challenges, and mobile apps",
    rationale: "Pure geometric circular forms create an upbeat, approachable demeanor.",
    scale: DEFAULT_SCALE,
  },
  // 29. Futuristic Gaming & Metaverse
  {
    id: "unbounded_space_grotesk",
    name: "Unbounded & Space Grotesk",
    category: "creative",
    displayFont: "Unbounded",
    bodyFont: "Space Grotesk",
    monoFont: "Share Tech Mono",
    displayStack: '"Unbounded", -apple-system, BlinkMacSystemFont, sans-serif',
    bodyStack: '"Space Grotesk", -apple-system, BlinkMacSystemFont, sans-serif',
    monoStack: '"Share Tech Mono", monospace',
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Unbounded:wght@700;800&family=Space+Grotesk:wght@400;600&display=swap",
    useCase: "Esports league tournaments, WebGL 3D world portals, and game launchers",
    rationale: "Ultrawide geometric letterforms delivering an intense futuristic presence.",
    scale: DEFAULT_SCALE,
  },
  // 30. Legal, Governance & Compliance
  {
    id: "eb_garamond_inter",
    name: "EB Garamond & Inter",
    category: "enterprise",
    displayFont: "EB Garamond",
    bodyFont: "Inter",
    monoFont: "Courier Prime",
    displayStack: '"EB Garamond", Garamond, Georgia, serif',
    bodyStack: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
    monoStack: '"Courier Prime", monospace',
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=EB+Garamond:wght@600;700&family=Inter:wght@400;500&display=swap",
    useCase: "Regulatory compliance audit consoles, contract drafting, and privacy governance",
    rationale: "Timeless Garamond gravitas balanced with modern sans data display.",
    scale: DEFAULT_SCALE,
  },
];

export class TypographyManager {
  /**
   * Retrieves all 30 curated font pairings.
   */
  public static getAllPairings(): FontPairing[] {
    return CURATED_FONT_PAIRINGS;
  }

  /**
   * Finds a pairing by its deterministic ID.
   */
  public static getPairingById(id: string): FontPairing | undefined {
    return CURATED_FONT_PAIRINGS.find((p) => p.id === id);
  }

  /**
   * Selects the most appropriate font pairing based on prompt domain, tone, and avoid list.
   */
  public static selectPairing(options: {
    domain?: string;
    prompt?: string;
    tone?: string;
    seed?: number;
    avoidList?: string[];
  }): FontPairing {
    const { domain = "", prompt = "", tone = "", seed = 0, avoidList = [] } = options;
    const text = `${domain} ${prompt} ${tone}`.toLowerCase();

    // 1. Identify candidate category dynamically from aesthetic tone and domain context
    let categoryMatches: FontPairing[] = [];
    const toneLower = (tone || "").toLowerCase();

    if (text.includes("architect") || text.includes("interior design") || text.includes("spatial planning") || text.includes("interior studio") || text.includes("architecture studio")) {
      const arch = CURATED_FONT_PAIRINGS.find((p) => p.id === "cormorant_dm_sans");
      if (arch && !avoidList.includes(arch.id)) return arch;
      categoryMatches = CURATED_FONT_PAIRINGS.filter((p) => p.id === "cormorant_dm_sans" || p.category === "luxury");
    } else if (text.includes("aerospace") || text.includes("satellite") || text.includes("constellation") || text.includes("telemetry") || text.includes("avionics") || text.includes("spaceflight")) {
      categoryMatches = CURATED_FONT_PAIRINGS.filter((p) => p.category === "aerospace" || p.id.includes("space") || p.id.includes("barlow") || p.id.includes("archivo") || p.id.includes("spline"));
    } else if (text.includes("marine") || text.includes("ocean") || text.includes("subsea") || text.includes("underwater")) {
      categoryMatches = CURATED_FONT_PAIRINGS.filter((p) => p.id.includes("outfit") || p.id.includes("lexend"));
    } else if (text.includes("automotive") || text.includes("hypercar") || text.includes("supercar")) {
      categoryMatches = CURATED_FONT_PAIRINGS.filter((p) => p.id.includes("cinzel") || p.id.includes("clash") || p.id.includes("fraunces") || p.category === "luxury");
    } else if (toneLower.includes("editorial") || toneLower.includes("contemplative") || toneLower.includes("literary")) {
      categoryMatches = CURATED_FONT_PAIRINGS.filter((p) => p.category === "editorial" || p.category === "artisanal");
    } else if (toneLower.includes("luxurious") || toneLower.includes("prestigious") || toneLower.includes("refined")) {
      categoryMatches = CURATED_FONT_PAIRINGS.filter((p) => p.category === "luxury" || p.category === "creative");
    } else if (toneLower.includes("technical") || toneLower.includes("precise") || toneLower.includes("scientific") || toneLower.includes("analytical")) {
      categoryMatches = CURATED_FONT_PAIRINGS.filter((p) => p.category === "aerospace" || p.category === "industrial" || p.category === "fintech");
    } else if (toneLower.includes("playful") || toneLower.includes("friendly") || toneLower.includes("approachable")) {
      categoryMatches = CURATED_FONT_PAIRINGS.filter((p) => p.category === "creative" || p.category === "education");
    } else if (toneLower.includes("calm") || toneLower.includes("serene") || toneLower.includes("wellness")) {
      categoryMatches = CURATED_FONT_PAIRINGS.filter((p) => p.category === "healthcare" || p.category === "hospitality");
    }

    if (categoryMatches.length === 0) {
      categoryMatches = CURATED_FONT_PAIRINGS;
    }

    // Filter out avoid list items
    const viable = categoryMatches.filter((p) => !avoidList.includes(p.id));
    const pool = viable.length > 0 ? viable : CURATED_FONT_PAIRINGS.filter((p) => !avoidList.includes(p.id));
    const finalPool = pool.length > 0 ? pool : CURATED_FONT_PAIRINGS;

    // Pick deterministically based on seed combined with prompt/domain hash
    let textHash = 0;
    for (let i = 0; i < text.length; i++) {
      textHash = ((textHash << 5) - textHash) + text.charCodeAt(i);
      textHash |= 0;
    }
    const effectiveSeed = Math.abs(seed ^ textHash);
    const idx = effectiveSeed % finalPool.length;
    return finalPool[idx];
  }

  /**
   * Generates CSS font import and CSS custom properties snippet with bulletproof fallbacks.
   */
  public static generateCssTokens(pairing: FontPairing): string {
    return `/* Typography Tokens: ${pairing.name} (${pairing.useCase}) */
@import url('${pairing.googleFontsUrl}');

:root {
  --font-display: ${pairing.displayStack};
  --font-body: ${pairing.bodyStack};
  --font-mono: ${pairing.monoStack};

  --text-h1: ${pairing.scale.h1};
  --text-h2: ${pairing.scale.h2};
  --text-h3: ${pairing.scale.h3};
  --text-h4: ${pairing.scale.h4};
  --text-body: ${pairing.scale.body};
  --text-small: ${pairing.scale.small};
}
`;
  }
}
