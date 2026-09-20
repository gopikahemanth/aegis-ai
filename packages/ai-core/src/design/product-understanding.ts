/**
 * ProductUnderstanding
 *
 * Deterministically extracts ProductCharacteristics from a raw prompt and an
 * optional user-supplied tone hint. No LLM, no randomness. The same prompt
 * always produces the same characteristics.
 *
 * ANTI-PATTERN: This file must NEVER contain `if (domain === "wellness")` or
 * any other domain-name trigger. All decisions derive from signal keywords
 * mapped to abstract characteristics. The Design Director then maps those
 * characteristics to archetypes.
 */

export interface ProductCharacteristics {
  /**
   * WHO is using this product and in what context.
   */
  audienceContext: {
    isPersonal: boolean;       // one user's longitudinal data (wellness, journal, portfolio)
    isConsumer: boolean;       // many end-users, consumer-grade UX (social, marketplace)
    isProfessional: boolean;   // domain-expert users (trading, legal, logistics)
    isEnterprise: boolean;     // organizational tools (admin, B2B, ops)
    ageGroup: "young" | "adult" | "professional" | "mixed";
    techSavviness: "novice" | "moderate" | "expert";
  };

  /**
   * WHAT the user's primary activity is. This single field drives
   * composition, vocabulary, and experience-pattern selection.
   */
  primaryActivity:
    | "personal-tracking"     // mood, habits, health — personal over time
    | "content-browsing"      // catalog, feed, discovery, exploration
    | "record-management"     // CRUD, admin, back-office, data entry
    | "content-creation"      // editor, authoring, design tool
    | "data-analysis"         // dashboards, reporting, business analytics
    | "booking-ordering"      // ecommerce, hospitality, scheduling, reservations
    | "portfolio-showcase"    // brand, studio, freelancer, artist
    | "team-collaboration"    // project management, comms, shared workspace
    | "realtime-monitoring";  // trading, telemetry, ops console, live feeds

  /**
   * HOW the product should feel emotionally.
   */
  emotionalTone: {
    primary: "calm" | "playful" | "serious" | "energetic" | "luxurious"
           | "warm" | "technical" | "editorial" | "friendly";
    secondary?: "optimistic" | "precise" | "reflective" | "bold" | "natural";
    avoidTones: string[];
  };

  /** Whether information density should be tight (dense), balanced, or airy (minimal). */
  informationDensity: "minimal" | "moderate" | "dense";

  /** Charts, metrics, tables are primary content — not just supporting. */
  isDataDriven: boolean;

  /** Imagery, illustration, or visual media dominate over data. */
  isVisualFirst: boolean;

  /** Reading, writing, editorial content dominates. */
  isTextFirst: boolean;

  /** Requires real-time or near-real-time data updates. */
  requiresRealTime: boolean;

  /**
   * The overarching experience shape — the most important field for deciding
   * page compositions and layout families. Derived from primaryActivity + context.
   */
  experiencePattern:
    | "personal-tracker"       // wellness, journaling, habit — personal over time
    | "operations-dashboard"   // monitoring, analytics, reporting, back-office
    | "content-feed"           // social, news, discovery feed
    | "catalog-browser"        // ecommerce, portfolio listing, discovery grid
    | "workspace-editor"       // Figma-like, document editor, code editor
    | "booking-flow"           // hospitality, scheduling, ordering, reservations
    | "showcase-landing"       // portfolio, brand, marketing site
    | "team-workspace"         // project management, team collaboration tools
    | "realtime-console";      // trading, telemetry, ops console

  /**
   * Three-tier vocabulary contract — derived from primaryActivity, NOT from domain name.
   *
   * required  — core product nouns that MUST appear at least once in the app
   * preferred — natural vocabulary of the experience; use where contextually appropriate
   * forbidden — must NEVER appear in JSX text, headings, labels, or placeholders
   */
  vocabularyContract: {
    required: string[];
    preferred: string[];
    forbidden: string[];
  };
}

export type DesignToneHint =
  | "calm"
  | "playful"
  | "minimal"
  | "luxury"
  | "bold"
  | "editorial"
  | "nature"
  | "futuristic"
  | "surprise"
  | "dark"
  | "technical"
  | "warm"
  | "serious"
  | "energetic"
  | "friendly"
  | string;

export interface NormalizedDesignInput {
  selectionMode?: "AUTO" | "USER_SELECTED" | "RANDOM" | "CUSTOM" | "auto" | "user" | "random";
  toneHint?: DesignToneHint;
}

/**
 * Deterministically normalizes any tone hint representation (string, object with toneHint, object with primary)
 * into a canonical lowercase string or undefined. Rejects and protects against non-string objects.
 */
export function normalizeToneHint(toneHint: unknown): string | undefined {
  if (typeof toneHint === "string") {
    const trimmed = toneHint.trim().toLowerCase();
    return trimmed || undefined;
  }

  if (toneHint && typeof toneHint === "object") {
    if ("toneHint" in toneHint && typeof (toneHint as any).toneHint === "string") {
      const trimmed = (toneHint as any).toneHint.trim().toLowerCase();
      return trimmed || undefined;
    }
    if ("primary" in toneHint && typeof (toneHint as any).primary === "string") {
      const trimmed = (toneHint as any).primary.trim().toLowerCase();
      return trimmed || undefined;
    }
    if ("designModeHint" in toneHint && typeof (toneHint as any).designModeHint === "string") {
      const trimmed = (toneHint as any).designModeHint.trim().toLowerCase();
      return trimmed || undefined;
    }
  }

  return undefined;
}

// ─────────────────────────────────────────────────────────────────────────────
// Signal keyword maps — categorized by abstract characteristic, NOT domain name
// ─────────────────────────────────────────────────────────────────────────────

const PERSONAL_TRACKING_SIGNALS = [
  "habit", "mood", "wellness", "journal", "diary", "tracker", "daily",
  "check-in", "checkin", "streak", "self-care", "mindful", "meditation",
  "sleep", "hydration", "water intake", "step count", "calories",
  "fitness log", "health log", "personal log", "reflection", "gratitude",
  "symptom", "anxiety", "mental health", "weight", "nutrition log",
  "workout log", "progress", "routine", "goal tracking", "life tracker",
  "morning", "evening routine",
];

const CONTENT_BROWSING_SIGNALS = [
  "discovery", "explore", "browse", "catalog", "feed", "trending",
  "recommend", "curated", "news feed", "social feed", "articles",
  "browse recipes", "browse books", "find recipes", "find books",
  "discover music", "discover places", "listing", "search", "filter",
  "bookstore", "library browser", "map explore",
];

const RECORD_MANAGEMENT_SIGNALS = [
  "admin", "back-office", "backoffice", "crud", "manage records",
  "data entry", "registry", "inventory", "crm", "erp", "hr system",
  "employee", "ticket", "issue tracker", "bug tracker", "patient records",
  "medical records", "student records", "case management",
];

const CONTENT_CREATION_SIGNALS = [
  "editor", "authoring", "write", "compose", "draft", "publish",
  "cms", "content management", "blog platform", "notes app", "document editor",
  "design tool", "canvas", "diagram", "whiteboard", "rich text",
];

const DATA_ANALYSIS_SIGNALS = [
  "analytics", "dashboard", "report", "metrics", "kpi", "business intelligence",
  "bi tool", "chart", "visualization", "insight", "performance", "analysis",
  "trend", "forecast", "data studio", "monitoring dashboard",
];

const BOOKING_ORDERING_SIGNALS = [
  "booking", "reservation", "appointment", "schedule", "order", "checkout",
  "cart", "ecommerce", "e-commerce", "shop", "store", "marketplace",
  "hotel", "restaurant", "salon", "clinic appointment", "ticket booking",
  "event booking", "rental", "hire", "buy",
];

const PORTFOLIO_SHOWCASE_SIGNALS = [
  "portfolio", "showcase", "gallery", "studio", "agency", "freelancer",
  "artist", "photographer", "designer", "architect", "band website",
  "personal website", "landing page", "brand", "creative agency",
  "our work", "case study", "project showcase",
];

const TEAM_COLLABORATION_SIGNALS = [
  "team", "collaboration", "project management", "kanban", "sprint",
  "scrum", "task management", "assign", "member", "workspace", "shared",
  "band rehearsal", "choir coordination", "club management", "group",
  "organization", "department",
];

const REALTIME_MONITORING_SIGNALS = [
  "trading", "stock", "crypto", "finance", "market data", "live data",
  "telemetry", "sensor", "iot", "monitoring", "alert", "alarm",
  "operations center", "logistics", "fleet", "delivery tracking",
  "supply chain", "ops", "real-time", "realtime", "live feed",
  "order book", "price feed",
];

// Emotional tone signals — entirely independent of domain
const CALM_SIGNALS = ["calm", "serene", "quiet", "peaceful", "gentle", "soft", "slow", "mindful", "unhurried", "tranquil", "sanctuary"];
const PLAYFUL_SIGNALS = ["playful", "fun", "cute", "colorful", "game", "kids", "children", "gamified", "delightful", "whimsical", "energetic", "vibrant", "lively"];
const TECHNICAL_SIGNALS = ["technical", "precise", "engineering", "developer", "code", "api", "infrastructure", "ops", "data", "enterprise", "professional"];
const LUXURIOUS_SIGNALS = ["luxury", "premium", "exclusive", "high-end", "bespoke", "elegant", "sophisticated", "refined", "couture", "private", "wealth"];
const EDITORIAL_SIGNALS = ["editorial", "magazine", "publication", "story", "narrative", "article", "journalism", "culture", "museum", "archive", "heritage", "literary"];
const WARM_SIGNALS = ["warm", "cozy", "inviting", "welcoming", "home", "family", "community", "friendly", "personal", "intimate", "heartfelt"];
const SERIOUS_SIGNALS = ["serious", "professional", "formal", "business", "corporate", "regulated", "compliance", "legal", "medical", "clinical", "government"];
const MINIMAL_SIGNALS = ["minimal", "minimalist", "clean", "simple", "focused", "zen", "restrained", "stripped", "bare"];

// Tones to AVOID by activity — derived from the nature of the activity
const AVOIDANCE_MAP: Record<ProductCharacteristics["primaryActivity"], string[]> = {
  "personal-tracking":   ["clinical", "corporate", "industrial", "bureaucratic"],
  "content-browsing":    ["dense", "bureaucratic", "clinical"],
  "record-management":   ["playful", "whimsical"],
  "content-creation":    ["dense", "bureaucratic"],
  "data-analysis":       [],
  "booking-ordering":    ["clinical", "bureaucratic"],
  "portfolio-showcase":  ["clinical", "bureaucratic", "dense"],
  "team-collaboration":  ["clinical"],
  "realtime-monitoring": ["playful", "whimsical", "decorative"],
};

// Vocabulary contract by primary activity
const VOCABULARY_MAP: Record<
  ProductCharacteristics["primaryActivity"],
  { required: string[]; preferred: string[]; forbidden: string[] }
> = {
  "personal-tracking": {
    required: [],  // populated dynamically from prompt nouns
    preferred: ["Today", "Progress", "Streak", "Reflect", "Check in", "How are you feeling?", "Log", "Goal", "Journey"],
    forbidden: ["Registry", "Inspect", "Record ID", "Manage Records", "Delete Record", "Submit", "Operational Data"],
  },
  "content-browsing": {
    required: [],
    preferred: ["Discover", "Explore", "Trending", "Curated", "Browse", "Recommended", "New", "Featured"],
    forbidden: ["Registry", "Inspect", "Record ID", "Manage Records", "Submit Form"],
  },
  "record-management": {
    required: ["Record", "Status"],
    preferred: ["Filter", "Export", "Archive", "Assign", "Review", "Approve"],
    forbidden: ["Check in", "Streak", "How are you feeling?", "Reflect"],
  },
  "content-creation": {
    required: [],
    preferred: ["Draft", "Publish", "Edit", "Compose", "Save", "Preview", "Format"],
    forbidden: ["Registry", "Inspect Record", "Record ID"],
  },
  "data-analysis": {
    required: ["Metric", "Trend"],
    preferred: ["Insight", "Performance", "Overview", "Compare", "Filter", "Range", "Export"],
    forbidden: ["Check in", "Streak", "How are you feeling?"],
  },
  "booking-ordering": {
    required: [],
    preferred: ["Book", "Availability", "Reserve", "Confirm", "Schedule", "Select", "Date", "Time", "Details", "Commission", "Workshop"],
    forbidden: ["Registry", "Inspect", "Record ID", "Manage Records"],
  },
  "portfolio-showcase": {
    required: ["Work", "Project"],
    preferred: ["Story", "Explore", "Featured", "Selected", "View", "Case Study", "About"],
    forbidden: ["CRUD", "Submit Form", "Add Record", "Registry", "Inspect", "Record ID"],
  },
  "team-collaboration": {
    required: ["Team", "Member"],
    preferred: ["Assign", "Progress", "Collaborate", "Update", "Milestone", "Due", "Priority"],
    forbidden: ["Registry", "Inspect Record"],
  },
  "realtime-monitoring": {
    required: ["Status", "Alert"],
    preferred: ["Live", "Monitor", "Feed", "Active", "Critical", "Resolved", "Uptime"],
    forbidden: ["Check in", "Streak", "Reflect", "How are you feeling?"],
  },
};

// ─────────────────────────────────────────────────────────────────────────────

function countSignals(text: string, signals: string[]): number {
  return signals.filter(s => text.includes(s)).length;
}

function detectPrimaryActivity(text: string): ProductCharacteristics["primaryActivity"] {
  // Score each activity by how many signals match
  const scores: Record<ProductCharacteristics["primaryActivity"], number> = {
    "personal-tracking":   countSignals(text, PERSONAL_TRACKING_SIGNALS),
    "content-browsing":    countSignals(text, CONTENT_BROWSING_SIGNALS),
    "record-management":   countSignals(text, RECORD_MANAGEMENT_SIGNALS),
    "content-creation":    countSignals(text, CONTENT_CREATION_SIGNALS),
    "data-analysis":       countSignals(text, DATA_ANALYSIS_SIGNALS),
    "booking-ordering":    countSignals(text, BOOKING_ORDERING_SIGNALS),
    "portfolio-showcase":  countSignals(text, PORTFOLIO_SHOWCASE_SIGNALS),
    "team-collaboration":  countSignals(text, TEAM_COLLABORATION_SIGNALS),
    "realtime-monitoring": countSignals(text, REALTIME_MONITORING_SIGNALS),
  };

  // Pick the highest-scoring activity
  let best: ProductCharacteristics["primaryActivity"] = "record-management";
  let bestScore = -1;
  for (const [activity, score] of Object.entries(scores)) {
    if (score > bestScore) {
      bestScore = score;
      best = activity as ProductCharacteristics["primaryActivity"];
    }
  }

  // Minimum signal threshold — if nothing matched strongly, default to content-browsing
  if (bestScore === 0) return "content-browsing";
  return best;
}

function detectExperiencePattern(
  activity: ProductCharacteristics["primaryActivity"],
  isPersonal: boolean,
  isRealTime: boolean,
  isDataDriven: boolean
): ProductCharacteristics["experiencePattern"] {
  switch (activity) {
    case "personal-tracking":
      return "personal-tracker";
    case "realtime-monitoring":
      return isDataDriven ? "realtime-console" : "operations-dashboard";
    case "data-analysis":
      return "operations-dashboard";
    case "content-browsing":
      return "content-feed";
    case "booking-ordering":
      return "booking-flow";
    case "portfolio-showcase":
      return isPersonal ? "showcase-landing" : "catalog-browser";
    case "team-collaboration":
      return "team-workspace";
    case "content-creation":
      return "workspace-editor";
    case "record-management":
      return "operations-dashboard";
    default:
      return "operations-dashboard";
  }
}

function detectEmotionalTone(
  text: string,
  toneHint: string | NormalizedDesignInput | unknown,
  activity: ProductCharacteristics["primaryActivity"],
  isPersonal: boolean
): ProductCharacteristics["emotionalTone"] {
  // If the user explicitly chose a tone (--design-mode=calm/etc.), honor it as primary
  const hint = normalizeToneHint(toneHint);
  if (hint) {
    if (CALM_SIGNALS.some(s => hint.includes(s))) {
      return { primary: "calm", avoidTones: AVOIDANCE_MAP[activity] };
    }
    if (PLAYFUL_SIGNALS.some(s => hint.includes(s))) {
      return { primary: "playful", avoidTones: AVOIDANCE_MAP[activity] };
    }
    if (LUXURIOUS_SIGNALS.some(s => hint.includes(s))) {
      return { primary: "luxurious", avoidTones: AVOIDANCE_MAP[activity] };
    }
    if (EDITORIAL_SIGNALS.some(s => hint.includes(s))) {
      return { primary: "editorial", avoidTones: AVOIDANCE_MAP[activity] };
    }
    if (WARM_SIGNALS.some(s => hint.includes(s))) {
      return { primary: "warm", secondary: "natural", avoidTones: AVOIDANCE_MAP[activity] };
    }
    if (MINIMAL_SIGNALS.some(s => hint.includes(s))) {
      return { primary: "calm", secondary: "precise", avoidTones: AVOIDANCE_MAP[activity] };
    }
    if (TECHNICAL_SIGNALS.some(s => hint.includes(s))) {
      return { primary: "technical", secondary: "precise", avoidTones: AVOIDANCE_MAP[activity] };
    }
    if (hint.includes("bold") || hint.includes("energetic") || hint.includes("vibrant")) {
      return { primary: "energetic", secondary: "bold", avoidTones: AVOIDANCE_MAP[activity] };
    }
    if (hint.includes("dark")) {
      return { primary: "serious", secondary: "reflective", avoidTones: AVOIDANCE_MAP[activity] };
    }
    if (hint.includes("nature") || hint.includes("natural")) {
      return { primary: "warm", secondary: "natural", avoidTones: AVOIDANCE_MAP[activity] };
    }
  }

  // Score tones from prompt text
  const scores = {
    calm:      countSignals(text, CALM_SIGNALS),
    playful:   countSignals(text, PLAYFUL_SIGNALS),
    technical: countSignals(text, TECHNICAL_SIGNALS),
    luxurious: countSignals(text, LUXURIOUS_SIGNALS),
    editorial: countSignals(text, EDITORIAL_SIGNALS),
    warm:      countSignals(text, WARM_SIGNALS),
    serious:   countSignals(text, SERIOUS_SIGNALS),
    minimal:   countSignals(text, MINIMAL_SIGNALS),
  };

  // Activity-based tone defaults (when prompt is tone-neutral)
  const activityDefaultTones: Record<ProductCharacteristics["primaryActivity"], ProductCharacteristics["emotionalTone"]["primary"]> = {
    "personal-tracking":   isPersonal ? "warm" : "friendly",
    "content-browsing":    "friendly",
    "record-management":   "serious",
    "content-creation":    "calm",
    "data-analysis":       "technical",
    "booking-ordering":    "friendly",
    "portfolio-showcase":  "editorial",
    "team-collaboration":  "serious",
    "realtime-monitoring": "technical",
  };

  const maxScore = Math.max(...Object.values(scores));
  if (maxScore === 0) {
    // Nothing matched — use activity default
    return {
      primary: activityDefaultTones[activity],
      avoidTones: AVOIDANCE_MAP[activity],
    };
  }

  // Pick highest scoring tone
  const entries = Object.entries(scores) as [ProductCharacteristics["emotionalTone"]["primary"], number][];
  const [primary] = entries.sort((a, b) => b[1] - a[1]);

  // Pick secondary if it's also present
  const secondary = entries[1][1] > 0 ? entries[1][0] as ProductCharacteristics["emotionalTone"]["secondary"] : undefined;

  return {
    primary: primary[0],
    secondary,
    avoidTones: AVOIDANCE_MAP[activity],
  };
}

function detectAudienceContext(
  text: string,
  activity: ProductCharacteristics["primaryActivity"]
): ProductCharacteristics["audienceContext"] {
  const isPersonal =
    activity === "personal-tracking" ||
    activity === "portfolio-showcase" ||
    countSignals(text, ["my ", "personal", "myself", "self-", "individual", "private", "one person"]) >= 2;

  const isProfessional =
    activity === "realtime-monitoring" ||
    activity === "record-management" ||
    countSignals(text, TECHNICAL_SIGNALS) >= 3 ||
    countSignals(text, SERIOUS_SIGNALS) >= 2;

  const isEnterprise =
    countSignals(text, ["enterprise", "organization", "department", "b2b", "saas", "multi-tenant", "role-based"]) >= 1;

  const isConsumer = !isPersonal && !isProfessional && !isEnterprise;

  const isYoung = countSignals(text, ["student", "teen", "young", "youth", "kids", "children", "college"]) >= 1;
  const isMixed = !isYoung && !isProfessional;

  return {
    isPersonal,
    isConsumer,
    isProfessional,
    isEnterprise,
    ageGroup: isYoung ? "young" : isProfessional ? "professional" : isMixed ? "mixed" : "adult",
    techSavviness: isProfessional || isEnterprise ? "expert" :
                   countSignals(text, ["beginner", "easy", "simple", "no code", "beginner-friendly"]) >= 1 ? "novice" :
                   "moderate",
  };
}

/**
 * Extracts the 1-3 core product nouns for the `required` vocabulary list.
 * These are the fundamental nouns the product cannot exist without.
 * E.g. "mood tracker" → ["mood", "check-in"] ; "bookstore" → ["book", "reading list"]
 */
function extractRequiredVocabulary(text: string, activity: ProductCharacteristics["primaryActivity"]): string[] {
  // Layer in product-specific nouns from common patterns
  const productNouns: Array<[RegExp, string[]]> = [
    [/\b(ceramic|pottery|glaze|kiln)\b/i, ["glaze", "kiln", "pottery", "firing"]],
    [/\bmood\b/i,              ["mood", "check-in"]],
    [/\bhabit\b/i,             ["habit", "streak"]],
    [/\bhydrat/i,              ["hydration", "intake"]],
    [/\bsleep\b/i,             ["sleep", "rest"]],
    [/\bbook(s|store|shelf)?\b/i, ["book", "reading list"]],
    [/\bastronom/i,            ["observation", "session"]],
    [/\brehearsal|band\b/i,    ["rehearsal", "session"]],
    [/\bportfolio\b/i,         ["project", "work"]],
    [/\btrading|stock\b/i,     ["position", "order"]],
    [/\blogistic|fleet\b/i,    ["shipment", "route"]],
    [/\brestaurant|dining\b/i, ["reservation", "table"]],
    [/\bfitness|workout\b/i,   ["workout", "session"]],
    [/\brecipe\b/i,            ["recipe", "ingredient"]],
  ];

  const matchedNouns: string[] = [];
  for (const [pattern, nouns] of productNouns) {
    if (pattern.test(text)) {
      for (const noun of nouns) {
        if (!matchedNouns.includes(noun)) matchedNouns.push(noun);
      }
    }
  }

  // If specific product domain nouns matched, they take priority as the required contract!
  if (matchedNouns.length > 0) {
    return matchedNouns.slice(0, 4);
  }

  const baseRequired = VOCABULARY_MAP[activity].required.slice();
  return baseRequired.slice(0, 4); // cap at 4 terms
}

// ─────────────────────────────────────────────────────────────────────────────

export class ProductUnderstanding {
  /**
   * Analyzes a raw prompt and optional tone hint to produce deterministic
   * ProductCharacteristics. The same inputs always produce the same output.
   *
   * @param prompt            The raw user prompt as provided to the CLI/API
   * @param designInputOrTone Optional tone override or NormalizedDesignInput object
   */
  static analyze(
    prompt: string,
    designInputOrTone?: string | NormalizedDesignInput | unknown
  ): ProductCharacteristics {
    const toneHint = normalizeToneHint(designInputOrTone);
    const text = prompt.toLowerCase();

    // [1] Primary activity — drives everything else
    const primaryActivity = detectPrimaryActivity(text);

    // [2] Audience context
    const audienceContext = detectAudienceContext(text, primaryActivity);

    // [3] Information modality
    const isDataDriven = countSignals(text, DATA_ANALYSIS_SIGNALS) >= 2 ||
                         primaryActivity === "data-analysis" ||
                         primaryActivity === "realtime-monitoring";

    const isVisualFirst = countSignals(text, ["photo", "gallery", "image", "visual", "art", "illustration", "design", "showcase", "portfolio"]) >= 2;

    const isTextFirst = countSignals(text, ["writing", "article", "blog", "story", "editorial", "journal", "notes", "read", "book"]) >= 2;

    const requiresRealTime = countSignals(text, ["real-time", "realtime", "live", "streaming", "socket", "websocket", "ticker", "feed"]) >= 1 ||
                             primaryActivity === "realtime-monitoring";

    // [4] Emotional tone (prompt + optional hint)
    const emotionalTone = detectEmotionalTone(text, toneHint, primaryActivity, audienceContext.isPersonal);

    // [5] Experience pattern (derived from activity + context)
    const experiencePattern = detectExperiencePattern(primaryActivity, audienceContext.isPersonal, requiresRealTime, isDataDriven);

    // [6] Information density (derived from activity + audience)
    const informationDensity: ProductCharacteristics["informationDensity"] =
      primaryActivity === "realtime-monitoring" || primaryActivity === "data-analysis" ? "dense" :
      primaryActivity === "personal-tracking" || primaryActivity === "portfolio-showcase" ? "minimal" :
      "moderate";

    // [7] Vocabulary contract
    const required = extractRequiredVocabulary(text, primaryActivity);
    const vocab = VOCABULARY_MAP[primaryActivity];

    const isAts = text.includes("resume") || text.includes("ats") || text.includes("candidate");
    const isSolar = text.includes("solar") || text.includes("inverter") || text.includes("photovoltaic");
    const foreignForbidden: string[] = [
      ...(!isAts ? ["resume", "candidate", "ATS"] : []),
      ...(!isSolar ? ["inverter", "INV-01", "telemetry", "MPPT", "maintenance job queue"] : []),
    ];

    const forbidden = Array.from(new Set([...vocab.forbidden, ...foreignForbidden]));

    return {
      audienceContext,
      primaryActivity,
      emotionalTone,
      informationDensity,
      isDataDriven,
      isVisualFirst,
      isTextFirst,
      requiresRealTime,
      experiencePattern,
      vocabularyContract: {
        required,
        preferred: vocab.preferred,
        forbidden,
      },
    };
  }
}
