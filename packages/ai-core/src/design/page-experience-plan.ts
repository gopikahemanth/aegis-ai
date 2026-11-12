/**
 * PageExperiencePlan
 *
 * First-class architectural contract governing route-by-route frontend design.
 *
 * Enforces the core Aegis invariant:
 * EVERY ROUTE IS A FIRST-CLASS DESIGN TARGET.
 *
 * The homepage must NOT receive privileged visual treatment while secondary
 * routes collapse into generic cards, search/filter bars, or simple CRUD tables.
 */

import { WebsiteExperienceIdentity, WebsiteExperienceIdentityResolver } from "./website-experience-identity.js";
import { ProductCharacteristics, ProductUnderstanding } from "./product-understanding.js";
import { ExperienceCapabilityPlan, ExperienceCapabilityResolver } from "./experience-capability-plan.js";
import { NavigationDesignResolver } from "./navigation-design.js";
import { PromptConstraints } from "../governance/prompt-constraints.js";

export interface PageExperiencePlan {
  route: string;
  pageRole: string;
  purpose: string;
  experienceIntent: string;
  focalElement: string;
  surfaceGenre?: string;
  atmosphere?: string;

  composition: {
    topology: string;
    layers: string[];
    sections: string[];
    dominantStructure: string;
  };

  interaction: {
    primary: string[];
    secondary: string[];
  };

  motion: {
    entrance: string;
    scroll: string;
    transitions: string[];
  };

  contentPresentation: string;

  visualHierarchy: {
    primary: string;
    secondary: string[];
  };

  responsiveStrategy: string;

  requiredCapabilities: string[];

  forbiddenPatterns: string[];
}

export class PageExperiencePlanner {
  /**
   * Generates a complete PageExperiencePlan wrapper for expected routes from a raw prompt.
   */
  public static plan(
    rawPrompt: string,
    expectedRoutes: string[],
    plannedPages?: Array<{ path: string; title: string; category?: string; description?: string }>
  ): { pages: PageExperiencePlan[] } {
    const characteristics = ProductUnderstanding.analyze(rawPrompt);
    const capabilityPlan = ExperienceCapabilityResolver.resolve(rawPrompt, characteristics);
    const brandName = NavigationDesignResolver.sanitizeBrandName(undefined, rawPrompt);
    const navigationDesign = NavigationDesignResolver.resolve(
      rawPrompt,
      characteristics.experiencePattern,
      brandName,
      undefined,
      plannedPages || expectedRoutes.map(r => ({ path: r, title: r.replace(/^\//, "") || "Home" })),
      characteristics.emotionalTone.primary,
      undefined,
      undefined,
      expectedRoutes
    );
    const identity = WebsiteExperienceIdentityResolver.resolve(
      rawPrompt,
      characteristics,
      capabilityPlan,
      navigationDesign
    );
    const pages = this.planPages(
      rawPrompt,
      characteristics,
      identity,
      capabilityPlan,
      expectedRoutes,
      plannedPages
    );
    return { pages };
  }

  /**
   * Generates bespoke, route-by-route PageExperiencePlans for every expected route in the website.
   */
  public static planPages(
    rawPrompt: string,
    characteristics: ProductCharacteristics,
    identity: WebsiteExperienceIdentity,
    capabilityPlan: ExperienceCapabilityPlan,
    expectedRoutes: string[],
    plannedPages?: Array<{ path: string; title: string; category?: string; description?: string }>
  ): PageExperiencePlan[] {
    const promptLower = rawPrompt.toLowerCase();
    const genre = identity.genre;

    // Normalizes route list ensuring root '/' is always included
    const routes = Array.from(new Set(["/", ...expectedRoutes])).filter(Boolean);
    const plans: PageExperiencePlan[] = [];

    for (const route of routes) {
      const pageInfo = plannedPages?.find(p => p.path === route || p.path === route.replace(/^\//, ""));
      const routeSlug = route === "/" ? "home" : route.replace(/^\//, "").toLowerCase().replace(/[^a-z0-9]+/g, "-");

      const plan = this.deriveRoutePlan(
        route,
        routeSlug,
        genre,
        promptLower,
        identity,
        capabilityPlan,
        pageInfo?.title,
        pageInfo?.description,
        rawPrompt
      );

      const isOperationalPrompt =
        genre === "HIGH_DENSITY_CONSOLE" ||
        /\b(avionics|aerospace|aircraft|flight|aviation|telemetry|scada|radar|defense|satellite|drone|uav|mission control|cockpit|subsystem|firmware|airframe)\b/i.test(promptLower);

      if (!plan.surfaceGenre) {
        if (isOperationalPrompt) {
          plan.surfaceGenre = "DASHBOARD_PANEL";
        } else if (
          genre === "EDITORIAL_PUBLICATION" ||
          plan.composition?.dominantStructure === "EDITORIAL_SPREAD" ||
          plan.composition?.topology === "EDITORIAL_SPREAD"
        ) {
          plan.surfaceGenre = "EDITORIAL_SPREAD";
        } else if (genre === "SPATIAL_WORLD") {
          plan.surfaceGenre = "SPATIAL_STAGE";
        } else if (genre === "LUXURY_ARTIFACT_STAGE") {
          plan.surfaceGenre = "ARTIFACT_STAGE";
        } else if (genre === "SENSORY_COMMERCE") {
          plan.surfaceGenre = "BOUTIQUE_SHOWCASE";
        } else if (genre === "MINDFUL_COMPANION") {
          plan.surfaceGenre = "MINDFUL_CANVAS";
        } else {
          plan.surfaceGenre = "DASHBOARD_PANEL";
        }
      }

      if (!plan.atmosphere) {
        if (isOperationalPrompt) {
          plan.atmosphere = "high-density obsidian and amber telemetry console with live avionics instrumentation";
        } else if (
          genre === "EDITORIAL_PUBLICATION" ||
          plan.composition?.dominantStructure === "EDITORIAL_SPREAD" ||
          plan.composition?.topology === "EDITORIAL_SPREAD"
        ) {
          plan.atmosphere = "monumental editorial layout on warm paper texture with high-contrast serif typography";
        } else {
          plan.atmosphere = "crisp modern interface with balanced contrast and focused typography";
        }
      }

      if (isOperationalPrompt) {
        if (!plan.forbiddenPatterns.includes("monograph")) plan.forbiddenPatterns.push("monograph");
        if (!plan.forbiddenPatterns.includes("editorial publication")) plan.forbiddenPatterns.push("editorial publication");
      }

      plans.push(plan);
    }

    return plans;
  }

  private static deriveSubtitle(naturalTitle: string, descriptionHint?: string, rawPrompt?: string): string {
    if (descriptionHint && descriptionHint.trim().length > 0) {
      const firstSentence = descriptionHint.split(/[.!?]\s+/)[0].trim();
      if (firstSentence.length > 5) {
        return firstSentence.endsWith(".") ? firstSentence : `${firstSentence}.`;
      }
    }
    if (rawPrompt && rawPrompt.trim().length > 0) {
      const sentences = rawPrompt.split(/[.!?]\s+/);
      const titleWords = naturalTitle.toLowerCase().split(/\s+/).filter(w => w.length > 3);
      for (const s of sentences) {
        const sLower = s.toLowerCase();
        if (titleWords.some(w => sLower.includes(w))) {
          const clean = s.trim();
          if (clean.length > 10) {
            return clean.endsWith(".") ? clean : `${clean}.`;
          }
        }
      }
    }
    return `Interactive operational overview and dedicated feature workflow for ${naturalTitle}.`;
  }

  public static deriveRoutePlan(
    route: string,
    slug: string,
    genre: WebsiteExperienceIdentity["genre"],
    promptLower: string,
    identity: WebsiteExperienceIdentity,
    capabilityPlan?: ExperienceCapabilityPlan,
    titleHint?: string,
    descriptionHint?: string,
    rawPrompt?: string
  ): PageExperiencePlan {
    const brandName = identity?.brandIdentity?.name || "Official Platform";
    const naturalTitle = titleHint || slug.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase());

    // ── 1. Flagship Landing Page ("/" or "home") ─────────────────────────────
    if (route === "/" || slug === "home") {
      const isOperational = /\b(avionics|aerospace|aircraft|flight|aviation|telemetry|scada|radar|defense|satellite|drone|uav|mission control|cockpit|subsystem|firmware|airframe)\b/i.test(promptLower);
      const isMonographOrJournal = genre === "EDITORIAL_PUBLICATION" || /\b(monograph|design review journal|architectural monograph|essay journal)\b/i.test(promptLower);

      let pageRole = `${brandName} Flagship Experience & Overview`;
      const forbidden = ["generic empty cards", "lorem ipsum", "unformatted raw data table"];
      if (isOperational) {
        pageRole = `${brandName} Avionics & Telemetry Flight Deck Command`;
        forbidden.push("monograph", "editorial publication");
      } else if (isMonographOrJournal) {
        pageRole = `${brandName} Monograph Cover & Opening Essay`;
      }

      return {
        route: "/",
        pageRole,
        purpose: descriptionHint || `Primary flagship showcase and entry point for ${brandName}, highlighting key workflows, capabilities, and system operations`,
        experienceIntent: `Engage with ${brandName} through curated high-impact focal elements, intuitive navigational entry points, and verified capabilities`,
        focalElement: `${brandName} Interactive Hero Stage and Core Capabilities Spotlight`,
        composition: {
          topology: "PORTAL_HERO_SHOWCASE",
          layers: ["Atmospheric Visual Surface", "Hero Inspection Stage", "Feature Workspaces Dock"],
          sections: [`${brandName} Overview Hero`, "Core Capabilities & Workflows", "Verified Operations & Directory"],
          dominantStructure: "PORTAL_HERO_SHOWCASE",
        },
        interaction: {
          primary: [`Explore core ${brandName} capabilities`, "Inspect operational metrics and active modules", "Engage with primary domain workflows"],
          secondary: ["Navigate to dedicated subsystem consoles", "Review system documentation and status"],
        },
        motion: {
          entrance: "smooth choreographed hero reveal with subtle depth stagger",
          scroll: "fluid narrative section transitions",
          transitions: ["responsive modal and drawer reveals"],
        },
        contentPresentation: `Editorial, high-impact flagship experience tailored to ${brandName}`,
        visualHierarchy: {
          primary: `${brandName} Hero Stage`,
          secondary: ["Capabilities Matrix", "Operational Status Indicators"],
        },
        responsiveStrategy: "Fluid responsive layout adapting gracefully across desktop, tablet, and mobile",
        requiredCapabilities: ["hero-stage", "capabilities-matrix"],
        forbiddenPatterns: forbidden,
      };
    }

    // ── 2a. Collector Vault & Provenance Registry (Luxury, Horology, Fine Artifacts)
    const isLuxuryOrCollector =
      promptLower.includes("horolog") ||
      promptLower.includes("watch") ||
      promptLower.includes("luxury") ||
      promptLower.includes("jewelry") ||
      promptLower.includes("collector") ||
      promptLower.includes("artifact") ||
      promptLower.includes("atelier");

    if (slug.includes("provenance") || (slug.includes("vault") && isLuxuryOrCollector) || (slug.includes("ledger") && isLuxuryOrCollector)) {
      return {
        route,
        pageRole: `${naturalTitle} Provenance Vault & Heritage Ledger`,
        purpose: descriptionHint || `Authenticated serial ledger, certificate of authenticity verification, and provenance archive for ${naturalTitle}`,
        experienceIntent: `Verify serial authentication hashes, inspect archival provenance history, and track ownership certificates`,
        focalElement: `Interactive collector vault showcase with digital certificate of authenticity verifier, high-resolution hallmarks, and verified ownership records`,
        composition: {
          topology: "COLLECTION_GRID",
          layers: ["Provenance Header", "Collector Vault Matrix", "Certificate Inspection Drawer"],
          sections: [`${naturalTitle} Heritage Archive`, "Authenticated Vault Holdings", "Serial Verification & Ownership Ledger"],
          dominantStructure: "COLLECTION_GRID",
        },
        interaction: {
          primary: [
            `Verify serial numbers against the authentic provenance registry for ${naturalTitle}`,
            `Inspect movement specifications, master certification, and archival history`,
            `Generate authenticated certificate of origin dossier and ownership records`,
          ],
          secondary: ["Download archival certificate", "Request bespoke appraisal or salon consultation"],
        },
        motion: {
          entrance: "regal fade-in with metallic gold accent illumination",
          scroll: "stately archival showcase flow",
          transitions: ["smooth certificate slide-over drawer"],
        },
        contentPresentation: "Refined luxury vault layout with serifs, embossed verification seals, and archival cards",
        visualHierarchy: {
          primary: "Holdings Vault Matrix",
          secondary: ["Verification Seal Drawer", "Serial Ledger"],
        },
        responsiveStrategy: "Multi-column archival grid transforming into single column on mobile",
        requiredCapabilities: [`${slug}-provenance-vault`],
        forbiddenPatterns: ["generic empty cards", "scientific specimen", "ice-core", "telemetry", "crud forms"],
      };
    }

    // ── 2b. Scientific Specimen / Sample / Custody / Ledger ───────────────────
    if (slug.includes("specimen") || slug.includes("sample") || slug.includes("custody") || slug.includes("ice-core") || slug.includes("core-sample") || slug.includes("isotope") || slug.includes("specimen-ledger")) {
      return {
        route,
        pageRole: `${naturalTitle} Custody & Registry Archive`,
        purpose: descriptionHint || `Specimen cataloging, chain-of-custody tracking, and scientific telemetry for ${naturalTitle}`,
        experienceIntent: `Inspect specimen metadata, verify custody verification logs, and track physical preservation parameters`,
        focalElement: `Interactive specimen custody table with telemetry breakdown and verified preservation logs`,
        composition: {
          topology: "COLLECTION_GRID",
          layers: ["Registry Header", "Specimen Ledger Grid", "Telemetry & Custody Drawer"],
          sections: [`${naturalTitle} Registry Overview`, "Specimen Identification & Core Logs", "Custody Transfer & Preservation Drawer"],
          dominantStructure: "COLLECTION_GRID",
        },
        interaction: {
          primary: ["Filter specimens by depth, location, and storage tier", "Inspect extraction logs, isotopic telemetry, and custody chain", "Log new sample custody update"],
          secondary: ["Export sample manifests", "Verify sensor calibration"],
        },
        motion: {
          entrance: "clean table fade-in with metadata highlight",
          scroll: "sticky filter and custody summary bar",
          transitions: ["smooth drawer expansion"],
        },
        contentPresentation: "High-precision scientific registry layout with metadata tags and verification badges",
        visualHierarchy: {
          primary: "Specimen Registry Grid",
          secondary: ["Custody Chain Drawer", "Extraction Telemetry"],
        },
        responsiveStrategy: "Responsive data table with mobile card transformation",
        requiredCapabilities: [`${slug}-custody-registry`],
        forbiddenPatterns: ["character spotlight", "avatar stage", "companion turntable", "voice clips", "abyssal carnivore"],
      };
    }

    // ── 3. Real-Time Operational Command & Telemetry ─────────────────────────
    if (slug.includes("telemetry") || slug.includes("operation") || slug.includes("console") || slug.includes("dashboard") || slug.includes("monitor") || slug.includes("sensor")) {
      return {
        route,
        pageRole: `${naturalTitle} & Operational Command Console`,
        purpose: descriptionHint || `Real-time telemetry monitoring, subsystem diagnostics, and operational controls for ${naturalTitle}`,
        experienceIntent: `Monitor real-time sensor streams, calibrate operational setpoints, and review historical trends`,
        focalElement: `High-density telemetry monitoring canvas with real-time waveform streams and subsystem health annunciators`,
        composition: {
          topology: "WORKSPACE_SPLIT",
          layers: ["Telemetry Canvas", "Subsystem Parameter Controls", "Activity & Event Ledger"],
          sections: [`${naturalTitle} Real-Time Telemetry Stream`, "Subsystem Diagnostics & Health Indicators", "Operational Log & Incident Audit"],
          dominantStructure: "WORKSPACE_SPLIT",
        },
        interaction: {
          primary: [`Inspect live ${naturalTitle} sensor readings and telemetry channels`, "Adjust operational thresholds and sampling parameters", "Export operational logs and diagnostic reports"],
          secondary: ["Acknowledge telemetry alerts", "Switch telemetry sampling intervals"],
        },
        motion: {
          entrance: "rapid metric calibration and live telemetry lock",
          scroll: "fixed command layout with high-density data scroll",
          transitions: ["instant telemetry stream modulation without layout shift"],
        },
        contentPresentation: "High-density operational telemetry console with monospace numeric readouts, status pills, and live charts",
        visualHierarchy: {
          primary: "Real-Time Telemetry Surface",
          secondary: ["Subsystem Readouts", "Diagnostic Logs"],
        },
        responsiveStrategy: "Command grid with collapsible telemetry rails on smaller screens",
        requiredCapabilities: [`${slug}-telemetry-console`],
        forbiddenPatterns: ["generic empty cards", "crud forms", "lorem ipsum", "Carbon Budget Remaining"],
      };
    }

    // ── 4. Catalog / Offerings / Products / Storefront ──────────────────────
    if (slug.includes("catalog") || slug.includes("product") || slug.includes("shop") || slug.includes("store") || slug.includes("offering") || slug.includes("menu")) {
      return {
        route,
        pageRole: `${naturalTitle} & Offerings Showcase`,
        purpose: descriptionHint || `Curated catalog and detailed specifications for ${naturalTitle} at ${brandName}`,
        experienceIntent: "Browse curated offerings, inspect detailed specifications, and configure selections",
        focalElement: "Interactive offerings grid with quick filters, attribute inspection, and detail drawer",
        composition: {
          topology: "COLLECTION_GRID",
          layers: ["Catalog Header", "Offerings Matrix", "Product Detail Inspector"],
          sections: [`${naturalTitle} Overview`, "Curated Offerings Grid", "Item Detail & Specifications Drawer"],
          dominantStructure: "COLLECTION_GRID",
        },
        interaction: {
          primary: [`Filter and search ${naturalTitle} items by category and attributes`, "Inspect item details, specifications, and availability", "Select items for order or inquiry"],
          secondary: ["Sort by popularity or rating", "Share item dossier"],
        },
        motion: {
          entrance: "staggered card reveal with smooth image load",
          scroll: "sticky filter chips and category tabs",
          transitions: ["smooth detail drawer slide-over"],
        },
        contentPresentation: "Refined offerings showcase with high-resolution visual cards, badges, and pricing/specs",
        visualHierarchy: {
          primary: "Offerings Grid",
          secondary: ["Filter Bar", "Item Detail Drawer"],
        },
        responsiveStrategy: "Multi-column responsive grid transforming into single column on mobile",
        requiredCapabilities: [`${slug}-catalog-grid`],
        forbiddenPatterns: ["generic empty cards", "lorem ipsum"],
      };
    }

    // ── 5. Calculation / Parameter Tuning / Estimator ────────────────────────
    if (slug.includes("estimat") || slug.includes("estimate") || slug.includes("estimator") || slug.includes("budget") || slug.includes("calc") || slug.includes("dimension") || slug.includes("cost") || slug.includes("quote") || slug.includes("pricing")) {
      return {
        route,
        pageRole: `${naturalTitle} Calculation & Estimation Stage`,
        purpose: descriptionHint || `Interactive dynamic calculation and itemized estimation for ${naturalTitle}, tailored to ${brandName}`,
        experienceIntent: `Adjust parameters, calibrate requirements, and project live itemized outcomes for ${naturalTitle}`,
        focalElement: (promptLower.includes("room") || promptLower.includes("spatial") || promptLower.includes("architect"))
          ? "Interactive spatial room canvas with live dimension controls and real-time budget ledger"
          : "Interactive calculation stage with live parameter controls and real-time itemized ledger",
        composition: {
          topology: "WORKSPACE_SPLIT",
          layers: ["Calculation Canvas", "Parameter Controls Panel", "Itemized Cost & Output Ledger"],
          sections: [`${naturalTitle} Spatial & Parameter Canvas`, `${naturalTitle} Specification Controls`, "Live Itemized Breakdown & Projections", "Export & Confirmation Drawer"],
          dominantStructure: "WORKSPACE_SPLIT",
        },
        interaction: {
          primary: (promptLower.includes("room") || promptLower.includes("dimension") || promptLower.includes("architect"))
            ? [`Calibrate ${naturalTitle} room dimensions and spatial parameters`, "Inspect dynamic cost calculation and itemized breakdown in real time", `Save or export ${naturalTitle} specification package`]
            : [`Calibrate ${naturalTitle} input parameters and dimensions`, "Inspect dynamic itemized breakdown and projections in real time", `Save or export ${naturalTitle} specification package`],
          secondary: ["Reset parameters to defaults", "Share estimation summary"],
        },
        motion: {
          entrance: "smooth panel slide and parameter indicator settle",
          scroll: "sticky calculation summary bar",
          transitions: ["real-time output counter interpolation"],
        },
        contentPresentation: "High-precision calculation layout with responsive parameter sliders and live ledger",
        visualHierarchy: {
          primary: `${naturalTitle} Parameter Controls`,
          secondary: ["Dynamic Projections Ledger", "Summary Actions"],
        },
        responsiveStrategy: "Split workspace on desktop, stacked controls and sticky output bar on mobile",
        requiredCapabilities: [`${slug}-calculation-engine`],
        forbiddenPatterns: ["generic empty cards", "unformatted raw data table", "placeholder text"],
      };
    }

    // ── 6. Verified Feedback / Reviews ──────────────────────────────────────
    if (slug.includes("review") || slug.includes("feedback") || slug.includes("testimonial") || slug.includes("rating") || slug.includes("evaluation")) {
      return {
        route,
        pageRole: `${naturalTitle} & Verified Feedback Showcase`,
        purpose: descriptionHint || `Verified client experiences, multi-criteria evaluations, and feedback submission for ${naturalTitle}`,
        experienceIntent: "Inspect authenticated testimonials, review quality metrics, and submit detailed evaluations",
        focalElement: "Featured feedback spotlight with verified evaluation scorecards and review submission portal",
        composition: {
          topology: "VERIFIED_FEEDBACK_WALL",
          layers: ["Featured Review Spotlight", "Verified Feedback Grid", "Review Submission Drawer"],
          sections: [`${naturalTitle} Overview & Quality Metrics`, "Featured Story Spotlight", "Verified Client Evaluations Grid", "Submit Review & Rating Portal"],
          dominantStructure: "VERIFIED_FEEDBACK_WALL",
        },
        interaction: {
          primary: ["Filter client reviews and evaluations by category, scale, and ratings", "Inspect detailed client reviews, multi-criteria performance scores, and narratives", "Submit verified client review with rating metrics and comments"],
          secondary: ["Sort by most recent or highest rated", "Verify client badge"],
        },
        motion: {
          entrance: "staggered card cascade and rating score reveal",
          scroll: "smooth reading flow across feedback entries",
          transitions: ["filter reflow with smooth crossfade"],
        },
        contentPresentation: "Editorial feedback layout with pull-quotes, verified badges, and multi-criteria scorecards",
        visualHierarchy: {
          primary: "Featured Feedback Spotlight",
          secondary: ["Evaluations Grid", "Review Submission Form"],
        },
        responsiveStrategy: "Adaptive multi-column feedback grid collapsing to single-column story stack on mobile",
        requiredCapabilities: [`${slug}-review-wall`],
        forbiddenPatterns: ["generic star rating clone", "empty card grid", "placeholder text"],
      };
    }

    // ── 7. Concierge / Scheduling / Booking / Appointments ───────────────────
    if (slug.includes("booking") || slug.includes("consultation") || slug.includes("schedule") || slug.includes("appointment") || slug.includes("reserve")) {
      return {
        route,
        pageRole: `${naturalTitle} Concierge & Scheduling Suite`,
        purpose: descriptionHint || `Service tier selection, real-time availability calendar, and intake brief for ${naturalTitle}`,
        experienceIntent: "Choose service tier, select suitable time slot, and submit project intake requirements",
        focalElement: "Interactive tier cards paired with calendar time slot picker and intake brief",
        composition: {
          topology: "BOOKING_FLOW",
          layers: ["Tier Selector Surface", "Interactive Calendar Grid", "Intake Brief Modal"],
          sections: [`${naturalTitle} Service Tiers & Deliverables`, "Interactive Calendar & Slot Availability", "Specialist Profiles & Expertise", "Intake Brief & Confirmation"],
          dominantStructure: "BOOKING_FLOW",
        },
        interaction: {
          primary: ["Select service tier and review scope of engagement", "Choose preferred date and time slot from available calendar", "Complete intake brief questionnaire and confirm appointment"],
          secondary: ["Upload reference files or sketches", "Sync to personal calendar"],
        },
        motion: {
          entrance: "smooth sequential tier reveal and calendar fade-in",
          scroll: "step-by-step concierge flow",
          transitions: ["tier selection spring transition and calendar date focus"],
        },
        contentPresentation: "Refined concierge scheduling spread with tier breakdowns and responsive calendar",
        visualHierarchy: {
          primary: `${naturalTitle} Service Tiers`,
          secondary: ["Calendar & Slot Picker", "Intake Questionnaire"],
        },
        responsiveStrategy: "Side-by-side tier and calendar on desktop; sequential step wizard on mobile",
        requiredCapabilities: [`${slug}-scheduler`],
        forbiddenPatterns: ["generic saas booking widget", "plain raw form", "placeholder text"],
      };
    }

    // ── 8. Phased Journey / Milestone Tracking / Deliverables ────────────────
    if (slug.includes("milestone") || slug.includes("portal") || slug.includes("tracking") || slug.includes("deliverable") || slug.includes("approval") || slug.includes("timeline")) {
      return {
        route,
        pageRole: `${naturalTitle} Journey & Deliverables Portal`,
        purpose: descriptionHint || `Phased progress tracking, deliverable inspection, and formal approval for ${naturalTitle}`,
        experienceIntent: "Follow project progression across stages, inspect technical deliverables, and execute sign-offs",
        focalElement: "Visual chronological journey rail with deliverable viewer and sign-off action panel",
        composition: {
          topology: "CHRONOLOGICAL_JOURNEY",
          layers: ["Phase Journey Rail", "Deliverables Inspection Stage", "Approval Sign-Off Panel"],
          sections: [`${naturalTitle} Phase Overview & Completion Metrics`, "Chronological Milestone Timeline", "Active Deliverable Inspection Viewer", "Client Sign-Off & Verification Action"],
          dominantStructure: "CHRONOLOGICAL_JOURNEY",
        },
        interaction: {
          primary: ["Track progression across project phases on the interactive timeline", "Inspect milestone deliverables, specifications, and revision history", "Execute milestone approval and formal sign-off"],
          secondary: ["Download deliverable documentation package", "Review upcoming stage schedule"],
        },
        motion: {
          entrance: "timeline progress draw-in and stage cards slide",
          scroll: "chronological stage navigation",
          transitions: ["stage crossfade with deliverable document reveal"],
        },
        contentPresentation: "Professional portal spread with phase status badges, deliverable previews, and sign-off verification",
        visualHierarchy: {
          primary: "Phase Timeline & Progress Rail",
          secondary: ["Deliverables Inspection Panel", "Approval Actions"],
        },
        responsiveStrategy: "Horizontal timeline rail on desktop, vertical milestone accordion on mobile",
        requiredCapabilities: [`${slug}-portal-timeline`],
        forbiddenPatterns: ["generic task list", "trello clone", "crud tables", "placeholder text"],
      };
    }

    // ── 8b. High-Frequency Waveform, Vibration & Spectrogram Analysis ───────
    if (slug.includes("spectrogram") || slug.includes("vibration") || slug.includes("fft") || slug.includes("wear") || slug.includes("waveform") || slug.includes("acoustic") || slug.includes("signal") || slug.includes("harmonic")) {
      return {
        route,
        pageRole: `${naturalTitle} Analysis & Diagnostic Canvas`,
        purpose: descriptionHint || `High-frequency vibration FFT spectrogram analysis, harmonic telemetry, and wear diagnostics for ${naturalTitle}`,
        experienceIntent: `Analyze spectral density, identify anomalous frequency spikes, and compute component wear degradation`,
        focalElement: `Dynamic ${naturalTitle} visualization canvas with real-time waveform inspection, frequency spectrum bins, and multi-channel telemetry controls`,
        composition: {
          topology: "DATA_VISUALIZATION_CANVAS",
          layers: ["Spectrum Visualization Surface", "Harmonic Filter Controls", "Wear Telemetry Ledger"],
          sections: [`${naturalTitle} Primary Telemetry Stream`, `${naturalTitle} Spectrum & Harmonic Diagnostics`, "Parameter Modulation & Cursor Inspector", "Diagnostic Session Export"],
          dominantStructure: "DATA_VISUALIZATION_CANVAS",
        },
        interaction: {
          primary: [`Toggle frequency bandwidths and adjust signal gain for ${naturalTitle}`, `Scrub timeline markers across ${naturalTitle} telemetry harmonics`, `Flag anomaly peaks and generate vibration diagnostic dossier`],
          secondary: ["Switch between linear and logarithmic scale", "Export raw waveform CSV"],
        },
        motion: {
          entrance: "rapid waveform sweep and waterfall spectrum settle",
          scroll: "fixed analytical viewport with synchronized harmonic timeline",
          transitions: ["real-time FFT bin resolution modulation"],
        },
        contentPresentation: "High-precision signal analysis canvas with dark oscilloscope styling, frequency grids, and peak markers",
        visualHierarchy: {
          primary: `${naturalTitle} Spectrum Display`,
          secondary: ["Harmonic Cursor Readouts", "Diagnostic Thresholds"],
        },
        responsiveStrategy: "Responsive analytical stage with responsive chart aspect ratio and collapsible control drawer",
        requiredCapabilities: [`${slug}-spectrogram-analyzer`],
        forbiddenPatterns: ["search bar", "filter chips", "generic card directory", "crud forms"],
      };
    }

    // ── 8c. Inspection, Verification & Pre-Flight Protocols ─────────────────
    if (slug.includes("inspection") || slug.includes("checklist") || slug.includes("audit") || slug.includes("pre-flight") || slug.includes("verification") || slug.includes("qa") || slug.includes("airworthiness")) {
      return {
        route,
        pageRole: `${naturalTitle} Inspection & Airworthiness Protocol`,
        purpose: descriptionHint || `Systematic inspection checklist, physical tolerance verification, and digital sign-off protocol for ${naturalTitle}`,
        experienceIntent: `Step through critical verification checkpoints, record measured tolerances, and certify operational safety`,
        focalElement: `Interactive step-by-step ${naturalTitle} verification deck with pass/fail telemetry locks, tolerance checklists, and physical inspection sign-off`,
        composition: {
          topology: "INSPECTION_CHECKLIST_FLOW",
          layers: ["Protocol Header & Telemetry Lock", "Interactive Verification Deck", "Inspector Attestation Footer"],
          sections: [`${naturalTitle} Pre-Execution Telemetry Lock`, "Sequential Subsystem Inspection Steps", "Tolerance Range & Anomaly Validation", "Inspector Attestation & Work Order Dispatch"],
          dominantStructure: "INSPECTION_CHECKLIST_FLOW",
        },
        interaction: {
          primary: [`Execute sequential verification checks with pass/fail and tolerance toggles for ${naturalTitle}`, `Log measured discrepancy notes and attach anomaly flags`, `Affix certified inspector digital signature and seal inspection block`],
          secondary: ["Review prior inspection historical delta", "Print airworthiness sign-off ticket"],
        },
        motion: {
          entrance: "sequential checklist slide-in with status indicator illumination",
          scroll: "step-locked reading flow with progress indicator",
          transitions: ["spring checkmark confirmation on item pass/fail"],
        },
        contentPresentation: "High-reliability industrial inspection spread with clear safety boundaries, pass/fail badges, and sign-off seals",
        visualHierarchy: {
          primary: "Inspection Verification Deck",
          secondary: ["Tolerance Range Indicators", "Inspector Attestation"],
        },
        responsiveStrategy: "Full-width inspection deck adapting to single-column swipe cards on mobile devices",
        requiredCapabilities: [`${slug}-inspection-deck`],
        forbiddenPatterns: ["search bar", "filter chips", "generic card directory", "crud forms"],
      };
    }

    // ── 8d. Regulatory Compliance & Directives Matrix ───────────────────────
    if (slug.includes("compliance") || slug.includes("faa") || slug.includes("regulation") || slug.includes("directive") || slug.includes("certification") || slug.includes("standard")) {
      return {
        route,
        pageRole: `${naturalTitle} Regulatory Compliance & Directives Matrix`,
        purpose: descriptionHint || `Mandatory regulatory compliance tracking, airworthiness directives audit, and certification lifecycle for ${naturalTitle}`,
        experienceIntent: `Audit regulatory compliance mandates, track airworthiness directive expirations, and verify legal operation certificates`,
        focalElement: `High-density compliance matrix with regulatory airworthiness directives, renewal clocks, mandatory service bulletins, and certificate attestation`,
        composition: {
          topology: "COMPLIANCE_MATRIX_TABLE",
          layers: ["Compliance Horizon Overview", "Directives & Service Bulletins Matrix", "Audit Manifest Drawer"],
          sections: [`${naturalTitle} Compliance Status & Expiration Watch`, "Airworthiness Directives & Service Bulletins", "Regulatory Standard Alignment Matrix", "Audit Manifest & Certification Export"],
          dominantStructure: "COMPLIANCE_MATRIX_TABLE",
        },
        interaction: {
          primary: [`Filter mandatory service bulletins and regulatory directives for ${naturalTitle}`, `Audit airworthiness certificate expiration horizons and recurrence triggers`, `Verify compliance attestation seals and generate airworthiness manifest`],
          secondary: ["Download compliance certificate bundle", "Schedule recurrent regulatory review"],
        },
        motion: {
          entrance: "structured matrix fade-in with urgency highlights",
          scroll: "sticky table header with horizontal column scrolling",
          transitions: ["smooth drawer expansion for directive dossiers"],
        },
        contentPresentation: "High-density regulatory grid with status pills, countdown clocks, authority badges, and verification hashes",
        visualHierarchy: {
          primary: "Directives & Compliance Matrix",
          secondary: ["Urgency Countdown Indicators", "Authority Attestation Badges"],
        },
        responsiveStrategy: "Dense matrix on desktop with pinned key columns; responsive card stack on mobile",
        requiredCapabilities: [`${slug}-compliance-matrix`],
        forbiddenPatterns: ["search bar", "generic empty cards", "crud forms"],
      };
    }

    // ── 8e. Maintenance Dispatch & MRO Operations Board ─────────────────────
    if (slug.includes("dispatch") || slug.includes("work-order") || slug.includes("mro") || slug.includes("maintenance") || slug.includes("workorder") || slug.includes("task-assignment")) {
      return {
        route,
        pageRole: `${naturalTitle} Maintenance & Dispatch Operations Board`,
        purpose: descriptionHint || `MRO work order triage, technician assignment, inventory allocation, and return-to-service dispatch for ${naturalTitle}`,
        experienceIntent: `Triage maintenance work orders across priority lanes, assign certified technicians, and authorize release to service`,
        focalElement: `Interactive MRO work order dispatch board with priority lane triage, technician assignment, parts allocation, and hangar release control`,
        composition: {
          topology: "DISPATCH_BOARD_KANBAN",
          layers: ["Operations Dispatch Header", "Maintenance Workflow Lanes", "Technician & Parts Allocator"],
          sections: [`${naturalTitle} Operational Triage Header`, "Active Maintenance Work Order Kanban Lanes", "Technician Roster & Tool Crib Allocation", "Dispatch Authorization & Release Drawer"],
          dominantStructure: "DISPATCH_BOARD_KANBAN",
        },
        interaction: {
          primary: [`Transition work order cards across triage, active maintenance, and return-to-service stages for ${naturalTitle}`, `Assign licensed technicians and allocate spare inventory parts`, `Authorize dispatch clearance and issue release certification`],
          secondary: ["Sort work orders by turnaround priority", "Filter by hangar bay location"],
        },
        motion: {
          entrance: "board lane slide-in with priority card illumination",
          scroll: "horizontal board scroll with pinned lane summaries",
          transitions: ["smooth drag-and-drop or click-to-advance card animation"],
        },
        contentPresentation: "High-density operations board with lane counters, technician avatars, part requisitions, and release seals",
        visualHierarchy: {
          primary: "Maintenance Work Order Lanes",
          secondary: ["Technician Allocator", "Release Authorization Control"],
        },
        responsiveStrategy: "Multi-lane kanban board on desktop transforming into tabbed lane switcher on mobile",
        requiredCapabilities: [`${slug}-dispatch-board`],
        forbiddenPatterns: ["search bar", "filter chips", "generic card directory", "crud forms"],
      };
    }

    // ── 8f. Material Swatchboard & Tactile Palette ─────────────────────────
    if (slug.includes("material") || slug.includes("swatch") || slug.includes("texture") || slug.includes("finishes")) {
      return {
        route,
        pageRole: `${naturalTitle} & Tactile Swatchboard`,
        purpose: descriptionHint || `Authentic material catalog, tactile finishes, and physical provenance showcase for ${naturalTitle}`,
        experienceIntent: "Inspect material swatches, tactile grain textures, and sustainability provenance",
        focalElement: "Interactive tactile material swatchboard with high-resolution texture inspection and provenance details",
        composition: {
          topology: "TACTILE_SWATCHBOARD",
          layers: ["Material Family Header", "Tactile Swatch Grid", "Provenance & Finish Drawer"],
          sections: [`${naturalTitle} Palette Overview`, "Tactile Swatches Showcase", "Physical Provenance & Sustainability Ledger"],
          dominantStructure: "TACTILE_SWATCHBOARD",
        },
        interaction: {
          primary: ["Filter swatches by material origin, finish, and provenance", "Inspect tactile macro texture swatches and technical specifications", "Curate material moodboard and order physical samples"],
          secondary: ["Toggle light/shadow angle", "Export material schedule"],
        },
        motion: {
          entrance: "tactile swatch card float and illumination",
          scroll: "smooth masonry grid scroll",
          transitions: ["swatch expansion with texture zoom"],
        },
        contentPresentation: "High-tactility material board with tactile swatches, finish badges, and sustainability provenance",
        visualHierarchy: {
          primary: "Tactile Swatchboard Grid",
          secondary: ["Finish Specifications", "Provenance Drawer"],
        },
        responsiveStrategy: "Multi-column swatch grid collapsing to dual column on mobile",
        requiredCapabilities: [`${slug}-swatchboard`],
        forbiddenPatterns: ["generic data table", "crud form", "placeholder text"],
      };
    }

    // ── 8g. Editorial Portfolio & Works Gallery ──────────────────────────────
    if (slug.includes("portfolio") || slug.includes("works") || (slug.includes("gallery") && !slug.includes("pet"))) {
      return {
        route,
        pageRole: `${naturalTitle} Editorial Portfolio & Works Showcase`,
        purpose: descriptionHint || `Editorial monograph gallery of flagship commissions, typologies, and spatial photography for ${naturalTitle}`,
        experienceIntent: "Browse completed works, inspect spatial photography, and review project typologies",
        focalElement: "Curated editorial masonry portfolio showcase with high-resolution photography",
        composition: {
          topology: "EDITORIAL_MASONRY",
          layers: ["Portfolio Header", "Curated Works Masonry Grid", "Project Monograph Drawer"],
          sections: [`${naturalTitle} Editorial Overview`, "Flagship Works Masonry Gallery", "Project Typology & Monograph Dossier"],
          dominantStructure: "EDITORIAL_MASONRY",
        },
        interaction: {
          primary: ["Filter commissions by building typology, scale, and completion year", "Inspect high-resolution architectural photography and spatial drawings", "Explore project case study monograph"],
          secondary: ["View floor plans", "Share project monograph"],
        },
        motion: {
          entrance: "staggered masonry image settle",
          scroll: "editorial pace with parallax depth",
          transitions: ["smooth monograph expansion"],
        },
        contentPresentation: "Architectural monograph layout with editorial photography, typology tags, and project metrics",
        visualHierarchy: {
          primary: "Curated Works Masonry Gallery",
          secondary: ["Typology Filter", "Project Monograph"],
        },
        responsiveStrategy: "Asymmetric masonry grid shifting to balanced single column on mobile",
        requiredCapabilities: [`${slug}-portfolio-gallery`],
        forbiddenPatterns: ["generic card directory", "crud table", "placeholder text"],
      };
    }

    // ── 9. Bespoke Fallback (Purpose-Driven, Zero Hardcoded Domain Bias) ─────
    let fallbackInteractions: { primary: string[]; secondary: string[] };
    if (/fleet|asset|engine|turbin|vehicle|craft|hanger|bay/i.test(slug)) {
      fallbackInteractions = {
        primary: [
          `Monitor active operational cycles and health indices for ${naturalTitle}`,
          `Inspect maintenance telemetry logs and fault codes across ${naturalTitle} assets`,
          `Schedule service interventions and dispatch maintenance orders`,
        ],
        secondary: ["Export fleet readiness reports", "Review asset utilization history"],
      };
    } else if (/forecast|predict|model|simulat|trend|health|analytics/i.test(slug)) {
      fallbackInteractions = {
        primary: [
          `Calibrate predictive modeling parameters and operating horizons for ${naturalTitle}`,
          `Simulate failure probabilities and degradation curves under varying stress loads`,
          `Export prognostic telemetry forecasts and maintenance recommendations`,
        ],
        secondary: ["Compare baseline vs. accelerated wear curves", "Adjust confidence intervals"],
      };
    } else if (/doc|manual|guide|spec|handbook|reference/i.test(slug)) {
      fallbackInteractions = {
        primary: [
          `Navigate structured technical specifications and operating procedures for ${naturalTitle}`,
          `Cross-reference regulatory standards and engineering schematics`,
          `Bookmark critical operational directives and export service guides`,
        ],
        secondary: ["Search indexed technical terminology", "Download offline PDF package"],
      };
    } else if (isLuxuryOrCollector || /complication|calibre|dial|watch|horolog|atelier|salon|jewelry/i.test(slug)) {
      fallbackInteractions = {
        primary: [
          `Inspect artisanal specifications and master complication craftsmanship for ${naturalTitle}`,
          `Configure bespoke materials, finishing hallmarks, and dimensional parameters for ${naturalTitle}`,
          `Curate selected haute horlogerie pieces into private collector dossier`,
        ],
        secondary: ["Examine high-resolution movement macro photography", "Request private atelier appointment"],
      };
    } else {
      fallbackInteractions = {
        primary: [
          `Inspect ${naturalTitle} features, specifications, and primary visual presentation`,
          `Engage with domain actions and customized parameters for ${naturalTitle}`,
          `Generate detailed summary reports and export session data`,
        ],
        secondary: ["Inspect details and technical notes", "View summary breakdown"],
      };
    }

    return {
      route,
      pageRole: `${naturalTitle} Experience Surface`,
      purpose: descriptionHint || `Bespoke interactive experience for ${naturalTitle}, tailored to ${brandName}`,
      experienceIntent: `Engage with ${naturalTitle} through purposeful domain-native interactions and visual hierarchy`,
      focalElement: `Prominent ${naturalTitle} interaction stage and primary focal surface`,
      composition: {
        topology: "BESPOKE_CANVAS",
        layers: ["Brand Aesthetic Surface", "Primary Feature Interaction Stage", "Contextual Information Layer"],
        sections: [`${naturalTitle} Primary Stage`, `${naturalTitle} Inspection & Actions`, "Supporting Context & Details"],
        dominantStructure: "BESPOKE_CANVAS",
      },
      interaction: fallbackInteractions,
      motion: {
        entrance: "smooth choreographed fade and scale",
        scroll: "contextual element reveal",
        transitions: ["state transition with spring easing"],
      },
      contentPresentation: `High-fidelity domain-scoped layout for ${naturalTitle}`,
      visualHierarchy: {
        primary: `${naturalTitle} Stage`,
        secondary: ["Contextual Controls", "Details Panel"],
      },
      responsiveStrategy: "Fluid responsive grid adapting gracefully across desktop, tablet, and mobile",
      requiredCapabilities: [`${slug}-interactive-stage`],
      forbiddenPatterns: ["generic empty cards", "unformatted raw data table", "placeholder text"],
    };
  }
}
