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
    plannedPages?: Array<{ path: string; title: string; category?: string }>
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
    plannedPages?: Array<{ path: string; title: string; category?: string }>
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
        pageInfo?.title
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

      plans.push(plan);
    }

    return plans;
  }

  private static deriveRoutePlan(
    route: string,
    slug: string,
    genre: WebsiteExperienceIdentity["genre"],
    promptLower: string,
    identity: WebsiteExperienceIdentity,
    capabilityPlan: ExperienceCapabilityPlan,
    titleHint?: string
  ): PageExperiencePlan {
    const brandName = identity.brandIdentity.name;
    const target = `${slug} ${titleHint || ""}`.toLowerCase();
    const cleanPromptLower = PromptConstraints.stripNegativeConstraints(promptLower);
    const isHotelOrHospitality = !PromptConstraints.isForbiddenByPrompt(promptLower, "hotel") && !PromptConstraints.isForbiddenByPrompt(promptLower, "hospitality") &&
      /\b(hotel|boutique hotel|resort|hospitality|luxury stay|luxury suites|villa resort)\b/i.test(cleanPromptLower + " " + brandName.toLowerCase());
    const isCommercialStoreOrFurniture = /\b(furniture|furnishing|furnishings|store|retail|e-commerce|ecommerce|shop|cart|checkout)\b/i.test(cleanPromptLower);
    const isRestaurantOrdering = /\b(ordering|takeout|delivery|cart|checkout|reservation)\b/i.test(cleanPromptLower);
    const isCulinary = !isRestaurantOrdering && !isHotelOrHospitality && !PromptConstraints.isForbiddenByPrompt(promptLower, "culinary") &&
      /(?:culinary\s+travel|food\s+journey|recipe\s+collection|gastronomy\s+journal|chef\s+stories|terroir|savorline)/i.test(cleanPromptLower + " " + brandName.toLowerCase());
    const isMuseum = !isCommercialStoreOrFurniture && !PromptConstraints.isForbiddenByPrompt(promptLower, "museum") && !PromptConstraints.isForbiddenByPrompt(promptLower, "art") &&
      /\b(museum|contemporary art|art gallery|artwork|artist profile|curator|sculpture park|curatorial)\b/i.test(cleanPromptLower + " " + brandName.toLowerCase());
    const isObservatory = /\b(observatory|astronomy|astrophysics|telescope|celestial|starmap|star map|sky observation)\b/i.test(cleanPromptLower + " " + brandName.toLowerCase());

    // =========================================================================
    // SCIENTIFIC OBSERVATORY & ASTRONOMICAL RESEARCH ROUTES
    // =========================================================================
    if (isObservatory) {
      if (route === "/" || slug === "home") {
        return {
          route,
          pageRole: "Monumental Observatory Masthead & Live Sky Telemetry Stage",
          purpose: `Scientific editorial observatory stage for ${brandName} presenting real-time celestial observations, active telescope telemetry, and astronomical discoveries`,
          experienceIntent: `Immerse researchers and the public in observatory operations through real-time sky observation feeds, instrumentation status, and deep-sky findings`,
          focalElement: "Monumental observatory masthead paired with real-time celestial sky coordinate map and telescope focal plane telemetry array",
          composition: {
            topology: "EDITORIAL_SPREAD",
            layers: ["Deep Void Celestial Canvas", "Observatory Telemetry HUD", "Scientific Monograph Spread"],
            sections: ["Observatory Zenith Masthead & Live Feed", "Active Telescope Array & Spectral Status", "Curated Astronomical Discoveries & Sky Catalog"],
            dominantStructure: "EDITORIAL_SPREAD",
          },
          interaction: {
            primary: ["Inspect active telescope instruments and optical filters", "Explore celestial sky coordinates and live observation feeds"],
            secondary: ["Review recent scientific discoveries", "Schedule public stargazing session"],
          },
          motion: {
            entrance: "subtle celestial coordinate grid draw-in and smooth typography settle",
            scroll: "slow parallax drifting of star-field backdrop",
            transitions: ["spectral wavelength filter transition with zero layout jump"],
          },
          contentPresentation: "High-contrast scientific editorial aesthetic with precise monospace telemetry indicators, deep indigo/obsidian surfaces, and crisp optical diagrams",
          visualHierarchy: {
            primary: "Observatory Masthead & Live Sky Feed",
            secondary: ["Telescope Array Telemetry", "Deep-Sky Discoveries"],
          },
          responsiveStrategy: "Responsive scientific spread with sticky observation status badge on mobile viewports",
          requiredCapabilities: ["observatory-telemetry", "star-map-preview", "observation-feed"],
          forbiddenPatterns: ["saas dashboard", "generic cards", "booking form", "hotel amenities", "crud forms"],
        };
      }

      if (slug.includes("observation") && !slug.includes("schedule") && !slug.includes("event")) {
        return {
          route,
          pageRole: "Live Sky Telemetry & Multi-Wavelength Observation Array",
          purpose: "Real-time sky observations captured across optical, infrared, and radio spectrum apertures",
          experienceIntent: "Inspect live multi-band celestial observations, target right ascension/declination coordinates, and atmospheric seeing conditions",
          focalElement: "Interactive celestial coordinate viewport with multi-wavelength spectrum switcher and FITS image viewer",
          composition: {
            topology: "SPATIAL_MAP",
            layers: ["Celestial Coordinate Grid", "Multi-Band Spectrum Mesh", "Observation Telemetry Drawer"],
            sections: ["Sky Coordinate Viewport", "Active Target Ephemeris", "Wavelength Band Selector (Optical, Near-IR, Radio)", "Atmospheric Seeing Metrics"],
            dominantStructure: "SCIENTIFIC_TELEMETRY_ARRAY",
          },
          interaction: {
            primary: ["Switch observation spectral band (Optical, Infrared, Radio)", "Inspect celestial object details and right ascension/declination offsets"],
            secondary: ["Download calibrated observation dataset", "Filter observations by telescope array"],
          },
          motion: {
            entrance: "coordinate grid overlay draw-in and telemetry stream lock",
            scroll: "smooth pan across active sky sectors",
            transitions: ["spectral band crossfade with false-color gradient mapping"],
          },
          contentPresentation: "Scientific instrumentation view with dark celestial aesthetic, calibrated exposure metrics, and live sensor stream",
          visualHierarchy: {
            primary: "Live Celestial Target Viewport",
            secondary: ["Wavelength Controls", "Seeing Conditions Metrics"],
          },
          responsiveStrategy: "Full-width coordinate canvas adapting to stacked telemetry cards on small screens",
          requiredCapabilities: ["sky-observation-viewer", "wavelength-selector", "coordinate-telemetry"],
          forbiddenPatterns: ["card grid", "generic search bar", "crud forms", "saas metrics"],
        };
      }

      if (slug.includes("telescope") || slug.includes("instrument")) {
        return {
          route,
          pageRole: "Telescope Instrumentation & Optical Array Specifications",
          purpose: "Comprehensive technical dossiers for primary reflectors, spectrographs, cryogenic sensors, and adaptive optics",
          experienceIntent: "Explore technical architecture, optical aperture diameters, focal lengths, and operational status of observatory instrumentation",
          focalElement: "Detailed technical cutaway schematic of primary telescope array with active sensor diagnostics",
          composition: {
            topology: "EDITORIAL_SPREAD",
            layers: ["Technical Blueprint Surface", "Instrument Optical Specs", "Diagnostics Telemetry Strip"],
            sections: ["Instrument Roster Header", "Primary Optical Array Schematics", "Cryogenic Detector Status", "Adaptive Optics Wavefront Performance"],
            dominantStructure: "TECHNICAL_INSTRUMENTATION_DOSSIER",
          },
          interaction: {
            primary: ["Switch between telescope instruments to inspect optical schematics", "Review aperture, focal ratio, and detector wavelength coverage"],
            secondary: ["Inspect cryogenic temperature status", "Check maintenance and calibration logs"],
          },
          motion: {
            entrance: "technical schematic vector reveal",
            scroll: "editorial dossier narrative flow",
            transitions: ["smooth instrument schematic crossfade"],
          },
          contentPresentation: "Clean technical editorial layout with blueprint diagrams, precise optical units (arcsec, nm, Kelvin), and monospace status badges",
          visualHierarchy: {
            primary: "Instrument Schematic & Core Specifications",
            secondary: ["Sensor Performance Metrics", "Calibration Schedule"],
          },
          responsiveStrategy: "Stacked instrument schematics and spec tables on mobile",
          requiredCapabilities: ["instrument-spec-viewer", "optical-schematic-display"],
          forbiddenPatterns: ["generic table", "card grid", "crud forms"],
        };
      }

      if (slug.includes("schedule")) {
        return {
          route,
          pageRole: "Telescope Observation Schedules & Astronomical Transit Calendar",
          purpose: "Upcoming celestial observation runs, telescope beam allocation, and astronomical transit windows",
          experienceIntent: "Browse allocated observation windows, target celestial bodies, and sidereal time tracking across telescopes",
          focalElement: "Sidereal transit timeline calendar showing telescope target allocations and lunar phase illumination",
          composition: {
            topology: "EDITORIAL_SPREAD",
            layers: ["Sidereal Time Matrix", "Observation Window Timeline", "Target Proposal Details"],
            sections: ["Observatory Schedule Calendar", "Active Transit Windows", "Telescope Time Allocation Matrix", "Weather & Moon Phase Forecast"],
            dominantStructure: "TRANSIT_SCHEDULE_TIMELINE",
          },
          interaction: {
            primary: ["Navigate sidereal observation timeline", "Filter schedule by telescope instrument and celestial object type"],
            secondary: ["Inspect scientific research proposal summary for scheduled runs", "Export astronomical observation calendar"],
          },
          motion: {
            entrance: "staggered schedule row entry with sidereal time lock",
            scroll: "smooth timeline scrolling",
            transitions: ["date filter transition"],
          },
          contentPresentation: "Clean editorial schedule timeline with astronomical time notation (UTC/Sidereal), celestial target tags, and instrument indicators",
          visualHierarchy: {
            primary: "Transit Timeline & Scheduled Runs",
            secondary: ["Target Proposal Information", "Observing Conditions"],
          },
          responsiveStrategy: "Vertical timeline card stack on mobile",
          requiredCapabilities: ["observation-schedule-timeline", "sidereal-time-tracker"],
          forbiddenPatterns: ["hotel booking", "room reservation", "generic calendar", "crud forms"],
        };
      }

      if (slug.includes("discover") || slug.includes("research-discoveries")) {
        return {
          route,
          pageRole: "Astronomical Discoveries & Astrophysical Research Monograph",
          purpose: "Curated research breakthroughs, exoplanet detections, gravitational wave events, and deep-sky findings",
          experienceIntent: "Read scientific discovery monographs with spectral analysis curves, observational logs, and research investigator notes",
          focalElement: "Lead scientific discovery visual essay featuring light curves, celestial coordinates, and principal investigator summary",
          composition: {
            topology: "EDITORIAL_SPREAD",
            layers: ["Scientific Monograph Canvas", "Light Curve Spectral Data Layer", "Investigator Notes Sidebar"],
            sections: ["Featured Discovery Lead Monograph", "Spectrographic Analysis & Light Curve", "Chronological Discovery Archive", "Principal Investigators Roster"],
            dominantStructure: "SCIENTIFIC_RESEARCH_MONOGRAPH",
          },
          interaction: {
            primary: ["Explore featured research discovery monographs", "Inspect interactive light curve and spectral data points"],
            secondary: ["Filter discoveries by category (Exoplanets, Supernovae, Quasars)", "Access linked peer-reviewed papers"],
          },
          motion: {
            entrance: "slow typographic reveal with spectral curve draw-in",
            scroll: "editorial reading progression",
            transitions: ["discovery article crossfade"],
          },
          contentPresentation: "Prestigious scientific journal aesthetic with high-resolution astrophysical captures, data curves, and author attribution",
          visualHierarchy: {
            primary: "Lead Discovery Article & Light Curve",
            secondary: ["Astrophysical Parameters", "Research Team Notes"],
          },
          responsiveStrategy: "Fluid column reduction with inline data graphs on mobile",
          requiredCapabilities: ["discovery-monograph-viewer", "spectral-curve-display"],
          forbiddenPatterns: ["card grid", "generic table", "crud forms"],
        };
      }

      if (slug.includes("archive") || slug.includes("celestial")) {
        return {
          route,
          pageRole: "Deep-Sky Celestial Object Archive & Ephemeris Database",
          purpose: "Cataloged stars, nebulae, galaxies, and transient objects with precise astrometric data and observation histories",
          experienceIntent: "Search and inspect celestial object catalogs with Messier/NGC designations, redshift metrics, and historical exposures",
          focalElement: "Searchable astrometric catalog interface with interactive coordinate lookup and spectral classification badges",
          composition: {
            topology: "EDITORIAL_SPREAD",
            layers: ["Catalog Surface", "Astrometric Coordinate Search", "Object Dossier Grid", "Detail Lightbox"],
            sections: ["Catalog Search & Filter Bar (Messier, NGC, IC, Exoplanet)", "Astrometric Object Ledger", "Selected Object Ephemeris & Historical Exposures", "FITS File Download Drawer"],
            dominantStructure: "CELESTIAL_EPHEMERIS_CATALOG",
          },
          interaction: {
            primary: ["Search celestial objects by catalog ID, constellation, or object type", "Inspect right ascension, declination, distance (light years), and apparent magnitude"],
            secondary: ["Bookmark object to research watchlist", "View all archived observatory exposures of object"],
          },
          motion: {
            entrance: "staggered catalog row reveal with coordinate glow",
            scroll: "smooth catalog browsing",
            transitions: ["object detail dossier drawer slide"],
          },
          contentPresentation: "Clean astrometric ledger with monospace astronomical coordinates, magnitude pills, and constellation indicators",
          visualHierarchy: {
            primary: "Celestial Object Catalog Table & Details",
            secondary: ["Search & Filter Controls", "Astrometric Provenance"],
          },
          responsiveStrategy: "Adaptive object card view replacing wide tables on mobile",
          requiredCapabilities: ["celestial-catalog-browser", "coordinate-search-engine"],
          forbiddenPatterns: ["saas table", "crud forms", "generic card grid"],
        };
      }

      if (slug.includes("publication") || slug.includes("paper")) {
        return {
          route,
          pageRole: "Astrophysical Research Publications & Pre-Print Library",
          purpose: "Peer-reviewed papers, conference proceedings, and observatory technical memos authored by research fellows",
          experienceIntent: "Browse and read astrophysical publications with DOI identifiers, BibTeX citations, author affiliations, and abstract viewports",
          focalElement: "Curated research publication library with instant abstract drawer and citation export tools",
          composition: {
            topology: "EDITORIAL_SPREAD",
            layers: ["Scholarly Archive Surface", "Journal Filter Bar", "Publication Monograph List", "Abstract Reader Drawer"],
            sections: ["Publications Header & Journal Index", "Latest Peer-Reviewed Papers", "Research Topic Taxonomy (Cosmology, Stellar Evolution, Planetary Science)", "Technical Memorandum Series"],
            dominantStructure: "RESEARCH_PUBLICATION_INDEX",
          },
          interaction: {
            primary: ["Search papers by title, author, or research field", "Open inline abstract reader to preview methodology and conclusions"],
            secondary: ["Copy BibTeX / APA citation to clipboard", "Download PDF preprint"],
          },
          motion: {
            entrance: "clean typographic fade with rule accent",
            scroll: "editorial publication list flow",
            transitions: ["abstract drawer slide-over"],
          },
          contentPresentation: "Scholarly library aesthetic with elegant serif titles, DOI links, and structured metadata blocks",
          visualHierarchy: {
            primary: "Publication Title & Abstract",
            secondary: ["Authors & Affiliations", "Journal & DOI Info"],
          },
          responsiveStrategy: "Stacked paper metadata and abstract on mobile",
          requiredCapabilities: ["publication-library", "abstract-reader", "citation-exporter"],
          forbiddenPatterns: ["card grid", "crud forms", "saas pricing"],
        };
      }

      if (slug.includes("facility") || slug.includes("info")) {
        return {
          route,
          pageRole: "Observatory Summit Facility & Atmospheric Telemetry",
          purpose: "High-altitude summit facility architecture, dome enclosure specifications, seeing quality metrics, and visitor center info",
          experienceIntent: "Learn about the high-altitude mountain research station, environmental monitoring, and public access guidelines",
          focalElement: "Summit campus isometric map and live meteorological telemetry display (barometric pressure, humidity, wind velocity, seeing index)",
          composition: {
            topology: "EDITORIAL_SPREAD",
            layers: ["Summit Architecture Canvas", "Live Meteorological HUD", "Facility Specifications Monograph"],
            sections: ["Summit Station Overview", "Live Atmospheric & Seeing Telemetry", "Dome Enclosure & Optical Tower Directory", "Visitor Center & Summit Access Guidelines"],
            dominantStructure: "FACILITY_TELEMETRY_OVERVIEW",
          },
          interaction: {
            primary: ["Explore summit facility structures and dome towers", "Inspect live summit meteorological and optical seeing readings"],
            secondary: ["View driving directions and summit altitude precautions", "Submit researcher facility access inquiry"],
          },
          motion: {
            entrance: "subtle topographic line draw-in",
            scroll: "architectural dossier reading progression",
            transitions: ["facility sector detail modal zoom"],
          },
          contentPresentation: "Architectural monograph style with elevation contours, meteorological sensor strips, and summit photography",
          visualHierarchy: {
            primary: "Summit Facility Architecture",
            secondary: ["Meteorological Conditions", "Visitor Guidelines"],
          },
          responsiveStrategy: "Stacked telemetry and facility guide on mobile",
          requiredCapabilities: ["facility-overview-viewer", "meteorological-telemetry-hud"],
          forbiddenPatterns: ["hotel amenities", "room booking", "generic cards", "crud forms"],
        };
      }

      if (slug.includes("event") || slug.includes("public")) {
        return {
          route,
          pageRole: "Public Observation Events & Stargazing Night Calendar",
          purpose: "Public stargazing nights, planetary transit viewings, solar observation sessions, and astrophysics lectures",
          experienceIntent: "Discover upcoming public telescope viewing nights, celestial transit events, and guest astronomy lectures",
          focalElement: "Curated astronomy events calendar with celestial phenomenon countdown (e.g. meteor showers, lunar eclipses) and reservation ingress",
          composition: {
            topology: "EDITORIAL_SPREAD",
            layers: ["Event Calendar Surface", "Lunar Phase Bar", "Event Dossier Cards", "Registration Drawer"],
            sections: ["Stargazing Events Header & Celestial Forecast", "Upcoming Public Telescope Observation Nights", "Astrophysics Lecture Series", "Event Registration & Summit Pass Ingress"],
            dominantStructure: "PUBLIC_ASTRONOMY_CALENDAR",
          },
          interaction: {
            primary: ["Browse public astronomy events by date and observing focus", "Reserve summit admission pass for public stargazing night"],
            secondary: ["Filter by family-friendly vs advanced researcher lectures", "Sync astronomy event to calendar"],
          },
          motion: {
            entrance: "event card staggered fade-in with celestial phase settle",
            scroll: "smooth calendar event browsing",
            transitions: ["event detail drawer slide"],
          },
          contentPresentation: "Atmospheric astronomical event calendar with moon phase badges, telescope availability indicators, and twilight start times",
          visualHierarchy: {
            primary: "Event Titles & Celestial Focus",
            secondary: ["Date & Moon Phase Details", "Pass Availability & Registration"],
          },
          responsiveStrategy: "Vertical event card stream on mobile",
          requiredCapabilities: ["public-event-calendar", "stargazing-pass-reservation"],
          forbiddenPatterns: ["hotel reservation", "room booking", "saas pricing", "generic card grid"],
        };
      }

      // Tailored fallback for any other observatory route
      const naturalTitle = slug
        .split(/[-_]+/)
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(" ");

      return {
        route,
        pageRole: `${naturalTitle} & Observatory Telemetry Console`,
        purpose: `Dedicated scientific editorial interface for ${naturalTitle} at ${brandName}`,
        experienceIntent: `Engage with observatory data and specialized telemetry for ${naturalTitle}`,
        focalElement: `Interactive ${naturalTitle} scientific instrumentation display with high-precision metrics`,
        composition: {
          topology: "EDITORIAL_SPREAD",
          layers: ["Deep Void Scientific Canvas", "Instrumentation HUD", "Editorial Content Layer"],
          sections: [`${naturalTitle} Zenith Header`, `${naturalTitle} Telemetry & Observation Data`, "Operational Notes & Archival Context"],
          dominantStructure: "SCIENTIFIC_TELEMETRY_ARRAY",
        },
        interaction: {
          primary: [`Inspect ${naturalTitle} parameters and telemetry`, `Filter ${naturalTitle} records by date and instrument`],
          secondary: ["Export telemetry snapshot", "View linked celestial observations"],
        },
        motion: {
          entrance: "smooth choreographed fade and subtle settle",
          scroll: "quiet contextual telemetry reveal",
          transitions: ["state transition with spring easing"],
        },
        contentPresentation: `High-fidelity observatory layout for ${naturalTitle} with scientific instrumentation indicators`,
        visualHierarchy: {
          primary: `${naturalTitle} Telemetry Presentation`,
          secondary: ["Contextual Details", "Action Controls"],
        },
        responsiveStrategy: "Fluid responsive layout adapting gracefully across viewports",
        requiredCapabilities: [`${slug}-observatory-stage`],
        forbiddenPatterns: ["saas dashboard", "generic empty cards", "hotel/booking terminology", "crud forms"],
      };
    }

    // =========================================================================
    // GENRE 1: SPATIAL_WORLD & CAPABILITY-MATCHED ROUTES
    // =========================================================================
    const isOcean = /\b(underwater|marine|submersible|abyss|benthic|bathymetric|deep-sea|hadal trench|hydrophone)\b/i.test(promptLower);
    const isFantasy = /\b(claymation|kazzoo|fairy realm|enchanted forest)\b/i.test(promptLower);
    const isSpace = /\b(spacecraft|celestial|satellite|planetary|astronomy|orbital station|star-field|orbit|orbital)\b/i.test(promptLower);
    const isFurniture = /\b(furniture|cabinetry|credenza|dining table|armchair|sofa|chair design|joinery|woodworking|oakhaven)\b/i.test(promptLower);
    const isMusic = /\b(music|synthesizer|polyphonic|frequency modulation|melody|harmonic chord|acoustic guitar|audio mixer)\b/i.test(promptLower);

    const homeFocal = isOcean
      ? "Submersible research vessel with interactive bathymetric depth layers and specimen observation dome"
      : isMuseum
      ? `Curated gallery hall and monumental exhibition pavilion with architectural lighting and spatial artwork displays`
      : isFantasy
      ? "Floating claymation island archipelago with animated avatars, volumetric clouds, and 360-degree orbit camera"
      : isSpace
      ? "Orbital habitat station with solar concentrator arrays and star-field parallax"
      : isMusic
      ? "Polyphonic acoustic sound sculpture with vibrating resonance strings and visual waveform emitter"
      : `Interactive 3D ${brandName} stage with orbital camera controls and real-time environment lighting`;

    const chapters = isOcean
      ? ["Chapter 1: The Sunlit Epipelagic Reef", "Chapter 2: Mesopelagic Twilight Shelf", "Chapter 3: Benthic Abyssal Plain", "Chapter 4: Hadal Trench Chasm"]
      : isMuseum
      ? ["Chapter 1: The Monumental Atrium & Spatial Ingress", "Chapter 2: Curated Retrospectives & Artist Statements", "Chapter 3: Interactive Floorplan & Gallery Navigation", "Chapter 4: Permanent Collection & Archival Vault"]
      : isFurniture
      ? ["Chapter 1: Selected Timber Provenance", "Chapter 2: Mortise & Tenon Joinery", "Chapter 3: Hand-Rubbed Oil Finissage", "Chapter 4: Generational Heirloom Assembly"]
      : isSpace
      ? ["Chapter 1: Suborbital Ingress", "Chapter 2: Lagrange Meridian Transit", "Chapter 3: Asteroid Belt Survey", "Chapter 4: Deep Void Telemetry"]
      : isFantasy
      ? ["Chapter 1: The Whispering Awakening", "Chapter 2: The Crossing of Luminous Shallows", "Chapter 3: The Ascent of Cloud Spire", "Chapter 4: The Archive of Unwritten Songs"]
      : ["Chapter 1: Foundations & Origin", "Chapter 2: Core Discovery", "Chapter 3: Advanced Milestone", "Chapter 4: The Apex Horizon"];

    // =========================================================================
    // MUSEUM & CONTEMPORARY ART GALLERY ROUTES
    // =========================================================================
    if (isMuseum) {
      if (route === "/" || slug === "home") {
        return {
          route,
          pageRole: "Monumental Exhibition Pavilion & Curatorial Opening Spread",
          purpose: `Curated contemporary museum pavilion for ${brandName} showcasing rotating exhibitions, artist monographs, and spatial architecture`,
          experienceIntent: `Present the curatorial vision of ${brandName} through gallery-scale imagery, expressive typography, and generous whitespace`,
          focalElement: "Monumental typographic masthead, featured exhibition plinth, and full-bleed contemporary art installation capture",
          composition: {
            topology: "EDITORIAL_SPREAD",
            layers: ["Monochrome Spatial Surface", "Curatorial Typography", "Gallery-Scale Visual Monograph"],
            sections: ["Pavilion Ingress & Current Exhibition Hero", "Featured Contemporary Artists Roster", "Curatorial Essay & Exhibition Calendar"],
            dominantStructure: "EDITORIAL_SPREAD",
          },
          interaction: {
            primary: ["Explore featured rotating exhibitions", "Inspect artist profile monographs"],
            secondary: ["Listen to curatorial introduction audio", "Plan gallery visit"],
          },
          motion: {
            entrance: "subtle monochrome contrast settle and architectural typography fade",
            scroll: "slow gallery-scale parallax drift",
            transitions: ["smooth exhibition crossfade"],
          },
          contentPresentation: "Prestigious modern museum spread with generous whitespace, gallery-scale photography, and curatorial typography",
          visualHierarchy: {
            primary: "Exhibition Feature & Museum Masthead",
            secondary: ["Curatorial Essay", "Visiting Hours & Wing Status"],
          },
          responsiveStrategy: "Responsive spatial layout with mobile menu drawer",
          requiredCapabilities: ["exhibition-showcase", "curatorial-typography"],
          forbiddenPatterns: ["saas dashboard", "generic card grid", "table", "crud forms"],
        };
      }

      if (slug.includes("exhibition") || slug.includes("rotating")) {
        return {
          route,
          pageRole: "Rotating Contemporary Exhibitions & Curatorial Showcase",
          purpose: "Curated contemporary exhibitions catalogue with dates, artist rosters, gallery wing locations, and curatorial essays",
          experienceIntent: "Browse current and upcoming exhibitions, explore curatorial essays, and inspect featured artists",
          focalElement: "Large-format exhibition hero display with gallery dates, wing indicator, and curatorial statement",
          composition: {
            topology: "EDITORIAL_SPREAD",
            layers: ["Exhibition Catalog Surface", "Curatorial Text Column", "Gallery Installation Grid"],
            sections: ["Current Exhibitions Hero", "Upcoming Seasonal Program", "Curatorial Retrospective Notes"],
            dominantStructure: "EDITORIAL_SPREAD",
          },
          interaction: {
            primary: ["Select exhibition to inspect curatorial notes and artist list", "Filter exhibitions by current vs upcoming"],
            secondary: ["Listen to exhibition audio commentary", "Save exhibition artworks to personal collection"],
          },
          motion: {
            entrance: "staggered exhibition card reveal with architectural typography",
            scroll: "generous whitespace gallery scroll",
            transitions: ["curatorial modal slide-over"],
          },
          contentPresentation: "Museum exhibition catalog with full-bleed installation views, curator quotes, and room dates",
          visualHierarchy: {
            primary: "Lead Exhibition Monograph",
            secondary: ["Exhibition Schedule", "Artist Folio Links"],
          },
          responsiveStrategy: "Full-bleed hero collapsing to single column on mobile",
          requiredCapabilities: ["exhibition-showcase", "curatorial-essay-viewer"],
          forbiddenPatterns: ["saas dashboard", "pricing table", "crud forms"],
        };
      }

      if (slug.includes("artist") || slug.includes("profile")) {
        return {
          route,
          pageRole: "Contemporary Artist Profiles & Monograph Folios",
          purpose: "Comprehensive roster of exhibited contemporary artists with biographies, key movements, and artwork folios",
          experienceIntent: "Explore artist biographies, artistic philosophies, curated portfolios, and upcoming retrospectives",
          focalElement: "Artist spotlight folio featuring studio portrait, curatorial biography, and featured gallery pieces",
          composition: {
            topology: "EDITORIAL_SPREAD",
            layers: ["Artist Bio Surface", "Curatorial Monograph", "Featured Works Mosaic"],
            sections: ["Featured Artist Monograph", "Artist Roster & Medium Filter", "Curator Critical Appraisal"],
            dominantStructure: "EDITORIAL_SPREAD",
          },
          interaction: {
            primary: ["Select artist to inspect biography and artwork folios", "Filter artists by movement or medium"],
            secondary: ["Bookmark artist works to saved collection", "Listen to artist audio interview"],
          },
          motion: {
            entrance: "refined portrait reveal and typographic biography settle",
            scroll: "smooth artist folio browsing",
            transitions: ["artist bio crossfade"],
          },
          contentPresentation: "Monograph-style artist dossiers with curatorial commentary, studio photography, and artwork list",
          visualHierarchy: {
            primary: "Featured Artist Spotlight",
            secondary: ["Artist Roster Index", "Curated Artwork Folios"],
          },
          responsiveStrategy: "Stacked artist bio with horizontal folio scroll on mobile",
          requiredCapabilities: ["artist-profile-viewer", "monograph-folio"],
          forbiddenPatterns: ["generic table", "crud forms"],
        };
      }

      if (slug.includes("artwork") || slug.includes("search") || slug.includes("collection")) {
        if (!slug.includes("saved")) {
          return {
            route,
            pageRole: "Searchable Artwork Collection & Curatorial Archive",
            purpose: "Deep semantic and structured collection search exploring paintings, sculptures, installations, and mediums",
            experienceIntent: "Search and inspect permanent and loan artworks by medium, artist, year, and curatorial theme",
            focalElement: "Semantic collection search input paired with high-resolution artwork detail view and medium filters",
            composition: {
              topology: "EDITORIAL_SPREAD",
              layers: ["Collection Archive Surface", "Filter & Search Bar", "Curatorial Artwork Grid"],
              sections: ["Searchable Collection Header", "Curatorial Category Filters", "Artwork Gallery Grid", "Detail Lightbox Modal"],
              dominantStructure: "CURATED_COLLECTION_SHOWCASE",
            },
            interaction: {
              primary: ["Search artworks by title, artist, or medium", "Filter collection by category and gallery wing", "Inspect high-res artwork details"],
              secondary: ["Save artwork to personal saved collection", "Listen to artwork audio commentary"],
            },
            motion: {
              entrance: "staggered artwork plinth reveal",
              scroll: "smooth gallery grid scroll",
              transitions: ["artwork inspection modal zoom"],
            },
            contentPresentation: "Prestigious gallery archive with high-contrast monochrome framing, medium metadata, and curatorial tags",
            visualHierarchy: {
              primary: "Artwork Visual Grid",
              secondary: ["Filter Controls", "Curatorial Provenance Info"],
            },
            responsiveStrategy: "Dynamic grid columns adapting from 3 columns desktop to single column mobile",
            requiredCapabilities: ["artwork-search-engine", "collection-filter", "artwork-detail-modal"],
            forbiddenPatterns: ["saas table", "crud forms"],
          };
        }
      }

      if (slug.includes("floor") || slug.includes("floorplan") || slug.includes("navigate") || slug.includes("map")) {
        return {
          route,
          pageRole: "Interactive Spatial Museum Floor Plan & Gallery Navigation",
          purpose: "Multi-level spatial map of museum wings, exhibition atriums, current installations, and audio waypoints",
          experienceIntent: "Navigate museum architecture, discover gallery wings, locate featured artworks, and plan in-gallery route",
          focalElement: "Architectural floor plan canvas with clickable gallery wings, exhibition waypoints, and room directories",
          composition: {
            topology: "SPATIAL_MAP",
            layers: ["Architectural Floorplan Mesh", "Gallery Waypoint Nodes", "Wing Detail Drawer"],
            sections: ["Interactive Floor Plan Canvas", "Wing & Level Selector", "Gallery Highlights & Waypoint Directory"],
            dominantStructure: "SPATIAL_LORE_MAP",
          },
          interaction: {
            primary: ["Switch museum floors/levels", "Click gallery wing to inspect active exhibition and highlighted works"],
            secondary: ["Filter rooms by artwork medium", "Locate nearest audio guide station"],
          },
          motion: {
            entrance: "architectural floor plan vector draw-in and node glow",
            scroll: "pan and zoom floorplan canvas",
            transitions: ["floor transition crossfade"],
          },
          contentPresentation: "Sleek architectural blueprint style with dark monochrome tones, interactive room pins, and wing dossiers",
          visualHierarchy: {
            primary: "Floor Plan Canvas",
            secondary: ["Wing Information Panel", "Level Switcher Tabs"],
          },
          responsiveStrategy: "Pinch-zoomable SVG canvas with slide-up room drawer on mobile",
          requiredCapabilities: ["interactive-floorplan", "wing-navigator", "gallery-waypoint-engine"],
          forbiddenPatterns: ["saas dashboard", "generic card grid"],
        };
      }

      if (slug.includes("audio") || slug.includes("sound") || slug.includes("listen") || slug.includes("guide")) {
        return {
          route,
          pageRole: "Gallery Audio Guide & Curator Commentary Console",
          purpose: "Curated binaural audio guide with curator commentary, artist voice interviews, and exhibition walkthroughs",
          experienceIntent: "Listen to exhibition room audio guides, artist interview excerpts, and synchronized curatorial transcripts",
          focalElement: "Curator audio player console with exhibition track selector, binaural wave visualizer, and transcript drawer",
          composition: {
            topology: "AUDIO_CONSOLE",
            layers: ["Gallery Acoustic Surface", "Curator Audio Player", "Exhibition Track Dossier"],
            sections: ["Master Audio Guide Player", "Exhibition Tracklist & Room Walkthrough", "Curator Notes & Synchronized Transcript"],
            dominantStructure: "TACTILE_AUDIO_SURFACE",
          },
          interaction: {
            primary: ["Select exhibition audio track and toggle playback", "Scrub waveform timeline to navigate curator commentary"],
            secondary: ["Read synchronized curator transcript", "Bookmark audio track to personal visit guide"],
          },
          motion: {
            entrance: "waveform ripple animation and track drawer slide",
            scroll: "fixed acoustic console view",
            transitions: ["audio play state modulation"],
          },
          contentPresentation: "Gallery audio guide console with track duration, room labels, narrator credentials, and commentary notes",
          visualHierarchy: {
            primary: "Audio Player & Active Track Waveform",
            secondary: ["Exhibition Tracklist", "Curator Commentary Drawer"],
          },
          responsiveStrategy: "Sticky bottom audio controller with vertical track list on mobile",
          requiredCapabilities: ["web-audio-synth", "audio-visualizer-canvas", "curator-audio-player"],
          forbiddenPatterns: ["hydrophone", "whale acoustics", "bathymetric", "submersible", "marine resonance", "card grid", "crud forms"],
        };
      }

      if (slug.includes("visit") || slug.includes("plan") || slug.includes("hours") || slug.includes("ticket")) {
        return {
          route,
          pageRole: "Museum Visit Planner & Gallery Admission Concierge",
          purpose: "Visiting schedule, admission tiers, gallery hours, architectural access, and custom museum visit itinerary builder",
          experienceIntent: "Plan museum visit date and time slot, select preferred exhibition wings, and generate personal itinerary",
          focalElement: "Museum admission and visit schedule concierge with date selector, wing planner, and hours calendar",
          composition: {
            topology: "EDITORIAL_SPREAD",
            layers: ["Hours & Admissions Surface", "Visit Itinerary Builder", "Museum Guidelines & Map Drawer"],
            sections: ["Hours & Admissions Overview", "Interactive Visit Itinerary Builder", "Location, Accessibility & Dining Guide"],
            dominantStructure: "CURATED_COLLECTION_SHOWCASE",
          },
          interaction: {
            primary: ["Select visit date and entry time slot", "Choose exhibition wings and estimated duration", "Save personalized visit plan"],
            secondary: ["Review accessibility notes", "Check current gallery admission guidelines"],
          },
          motion: {
            entrance: "staggered admission tier reveal and date card slide",
            scroll: "smooth visiting guide flow",
            transitions: ["time slot selector transition"],
          },
          contentPresentation: "Clean editorial visit guide with generous whitespace, crisp hours tables, and interactive plan builder",
          visualHierarchy: {
            primary: "Visit Planner & Hours Calendar",
            secondary: ["Admission Tiers", "Visitor Guidelines"],
          },
          responsiveStrategy: "Stacked planner form and hours card on mobile",
          requiredCapabilities: ["visit-planner", "hours-calendar", "admission-tier-selector"],
          forbiddenPatterns: ["generic table", "crud forms"],
        };
      }

      if (slug.includes("saved") || slug.includes("bookmark") || slug.includes("favorite")) {
        return {
          route,
          pageRole: "Personal Saved Artworks & Curated Collection Vault",
          purpose: "Private museum collection vault organizing saved artworks, favorite artist monographs, and curatorial study notes",
          experienceIntent: "Review saved artworks, add private curatorial study notes, and organize pieces by gallery medium",
          focalElement: "Curated personal collection vault with saved artwork cards, medium filters, and study notes modal",
          composition: {
            topology: "EDITORIAL_SPREAD",
            layers: ["Collection Vault Surface", "Medium Filter Tabs", "Saved Artwork Grid", "Study Notes Drawer"],
            sections: ["Personal Collection Header", "Vault Categories (All, Sculpture, Paintings, Installations, Audio Tours)", "Saved Artworks Grid", "Curator Study Notes Modal"],
            dominantStructure: "CURATED_COLLECTION_SHOWCASE",
          },
          interaction: {
            primary: ["Filter saved artworks by medium category", "Add or edit private study notes for saved pieces", "Remove items from collection"],
            secondary: ["Export personal collection dossier", "Jump to full artwork catalog detail"],
          },
          motion: {
            entrance: "staggered artwork card reveal and folder tab transition",
            scroll: "smooth collection vault browsing",
            transitions: ["study notes drawer slide"],
          },
          contentPresentation: "Prestigious personal gallery vault with dark monochrome styling, artwork thumbnails, and personal notes",
          visualHierarchy: {
            primary: "Saved Artwork Collection Grid",
            secondary: ["Vault Category Tabs", "Curatorial Notes"],
          },
          responsiveStrategy: "Adaptive multi-column card layout collapsing to single-column card stack on mobile",
          requiredCapabilities: ["collection-folder-manager", "saved-artworks-vault"],
          forbiddenPatterns: ["generic table", "crud forms"],
        };
      }
    }

    // =========================================================================
    // LUXURY HOSPITALITY & BOUTIQUE HOTEL ROUTES
    // =========================================================================
    if (isHotelOrHospitality) {
      if (route === "/" || slug === "home") {
        return {
          route,
          pageRole: "Grand Hotel Masthead & Property Overview",
          purpose: `Cinematic boutique hotel showcase for ${brandName} featuring property architecture, curated suites, wellness amenities, and reservation ingress`,
          experienceIntent: `Present the architectural sanctuary and refined hospitality of ${brandName} through editorial imagery and subtle motion`,
          focalElement: "Cinematic property masthead, architectural suites gallery plinth, and ambient reservation bar",
          composition: {
            topology: "EDITORIAL_SPREAD",
            layers: ["Warm Neutral Architectural Canvas", "Editorial Masthead Typography", "Curated Suite Mosaic Plinth"],
            sections: ["Grand Property Masthead & Ingress", "Curated Suites & Architectural Overview", "Signature Amenities & Epicurean Teaser"],
            dominantStructure: "EDITORIAL_SPREAD",
          },
          interaction: {
            primary: ["Explore signature suites and villas", "Inspect room availability dates and rates"],
            secondary: ["Explore property amenities and spa", "Plan personalized guest stay"],
          },
          motion: {
            entrance: "subtle architectural typography fade and image settle",
            scroll: "quiet parallax imagery drift",
            transitions: ["smooth suite crossfade"],
          },
          contentPresentation: "Editorial luxury hospitality spread with warm neutral tones, generous whitespace, and architectural photography",
          visualHierarchy: {
            primary: "Hotel Masthead & Property Exterior",
            secondary: ["Signature Suites Plinth", "Reservation Ingress Bar"],
          },
          responsiveStrategy: "Fluid column adaptation with persistent reservation dock",
          requiredCapabilities: ["suite-showcase", "cinematic-hero"],
          forbiddenPatterns: ["saas dashboard", "generic table"],
        };
      }

      if (slug.includes("suite") || slug.includes("room") || slug.includes("accommodation") || slug.includes("villa")) {
        return {
          route,
          pageRole: "Luxury Suite Showcase & Immersive Room Storytelling",
          purpose: "Immersive architectural suite gallery with floorplans, room dimensions, signature amenities, and rates",
          experienceIntent: "Inspect handcrafted suites, view floorplans and luxury appointments, and compare room categories",
          focalElement: "Featured suite spotlight showcase with floorplan drawer, material palette, and interactive booking trigger",
          composition: {
            topology: "EDITORIAL_SPREAD",
            layers: ["Architectural Suite Folio", "Room Specifications Matrix", "Curated Gallery Grid"],
            sections: ["Featured Suite Spotlight Hero", "Suite Roster & Category Selector", "Floorplan & Amenity Dossier"],
            dominantStructure: "EDITORIAL_SPREAD",
          },
          interaction: {
            primary: ["Select suite category to update room photography and specifications", "Toggle between photography and architectural floorplan"],
            secondary: ["Check suite real-time availability", "Add suite to personalized stay planner"],
          },
          motion: {
            entrance: "refined suite photography reveal and typography settle",
            scroll: "smooth editorial room browsing",
            transitions: ["suite category crossfade"],
          },
          contentPresentation: "High-end architectural monograph with room dimensions, custom furnishing callouts, and nightly rates",
          visualHierarchy: {
            primary: "Selected Suite Showcase Hero",
            secondary: ["Suite Specifications Drawer", "Category Navigation Bar"],
          },
          responsiveStrategy: "Stacked suite dossier with horizontal category scroll on mobile",
          requiredCapabilities: ["suite-showcase", "room-storytelling"],
          forbiddenPatterns: ["saas dashboard", "generic table"],
        };
      }

      if (slug.includes("book") || slug.includes("avail") || slug.includes("reserv") || slug.includes("flow")) {
        return {
          route,
          pageRole: "Interactive Room Availability & Reservation Engine",
          purpose: "Date-driven reservation engine with real-time suite availability checks, calendar date selection, and guest rate calculation",
          experienceIntent: "Select travel dates, choose suite tier, customize guest party size, and review seamless booking confirmation",
          focalElement: "Bespoke date range selector paired with real-time suite availability calendar and rate breakdown summary",
          composition: {
            topology: "EDITORIAL_SPREAD",
            layers: ["Reservation Surface", "Availability Calendar Mesh", "Booking Summary Drawer"],
            sections: ["Date & Guest Selection Console", "Suite Availability Matrix", "Reservation Breakdown & Confirmation"],
            dominantStructure: "CURATED_COLLECTION_SHOWCASE",
          },
          interaction: {
            primary: ["Select arrival and departure calendar dates", "Choose suite category and adjust guest count", "Calculate stay totals with transparent rates"],
            secondary: ["Add dining and spa enhancements", "Confirm booking reservation"],
          },
          motion: {
            entrance: "smooth calendar reveal and booking bar elevation",
            scroll: "seamless single-page booking flow",
            transitions: ["rate calculation update with spring easing"],
          },
          contentPresentation: "Clean luxury reservation interface with crisp typography, transparent inclusions, and clear cancellation terms",
          visualHierarchy: {
            primary: "Availability Calendar & Date Selector",
            secondary: ["Suite Availability Cards", "Reservation Rate Summary"],
          },
          responsiveStrategy: "Sticky bottom reservation bar on mobile viewports",
          requiredCapabilities: ["interactive-booking", "availability-calendar"],
          forbiddenPatterns: ["generic table"],
        };
      }

      if (slug.includes("stay") || slug.includes("plan") || slug.includes("itinerary") || slug.includes("personalized")) {
        return {
          route,
          pageRole: "Personalized Stay Planner & Curated Itinerary Concierge",
          purpose: "Multi-day bespoke itinerary builder coordinating dining reservations, spa rituals, and curated local excursions",
          experienceIntent: "Curate a personalized stay by adding dining, spa sessions, and private experiences to a day-by-day itinerary",
          focalElement: "Multi-day itinerary timeline paired with daily activity cards, experience catalog drawer, and stay totals",
          composition: {
            topology: "EDITORIAL_SPREAD",
            layers: ["Day Schedule Tabs", "Interactive Stay Timeline", "Experience Catalog Drawer"],
            sections: ["Stay Itinerary Overview Header", "Day-by-Day Timeline Selector", "Scheduled Experiences & Bookings", "Curated Add-On Catalog"],
            dominantStructure: "CURATED_COLLECTION_SHOWCASE",
          },
          interaction: {
            primary: ["Switch between stay days to inspect scheduled dining and activities", "Add, reorder, or customize itinerary experiences", "Adjust reservation times"],
            secondary: ["Review complete stay schedule", "Save personalized stay plan"],
          },
          motion: {
            entrance: "timeline bar draw-in and day cards slide",
            scroll: "smooth chronological progression",
            transitions: ["day schedule crossfade and item insertion animation"],
          },
          contentPresentation: "Refined hotel concierge itinerary spread with timeline markers, venue badges, and timing callouts",
          visualHierarchy: {
            primary: "Day-by-Day Stay Timeline",
            secondary: ["Scheduled Experiences List", "Curated Experience Drawer"],
          },
          responsiveStrategy: "Stacked day accordion on mobile devices",
          requiredCapabilities: ["stay-planner", "itinerary-timeline"],
          forbiddenPatterns: ["generic table", "generic search bar"],
        };
      }

      if (slug.includes("preferenc") || slug.includes("curat") || slug.includes("profile")) {
        return {
          route,
          pageRole: "Bespoke Guest Preferences & In-Suite Curation Studio",
          purpose: "Tailored guest customization console organizing pillow choices, room temperature, dietary requests, and arrival touches",
          experienceIntent: "Personalize in-suite stay preferences to ensure bespoke curation prior to guest arrival",
          focalElement: "In-suite curation studio with tactile pillow selection, ambient lighting presets, and bespoke beverage stocking options",
          composition: {
            topology: "EDITORIAL_SPREAD",
            layers: ["Preference Canvas Surface", "Preference Category Selector", "In-Suite Curation Card Grid"],
            sections: ["Guest Preference Studio Header", "Sleep & Pillow Menu Selection", "Climate & Ambient Lighting Controls", "Dietary & In-Suite Stocking Requests"],
            dominantStructure: "CURATED_COLLECTION_SHOWCASE",
          },
          interaction: {
            primary: ["Select preferred pillow type (Memory Foam, Down, Silk)", "Set target suite arrival temperature", "Choose dietary requirements and beverage stocking preferences"],
            secondary: ["Save bespoke guest preference profile", "Reset to property signature defaults"],
          },
          motion: {
            entrance: "staggered preference card settle and soft toggle transitions",
            scroll: "gentle editorial reading flow",
            transitions: ["preference state update with subtle glow"],
          },
          contentPresentation: "Tactile editorial studio with toggle cards, sensory descriptors, and clean radio selectors",
          visualHierarchy: {
            primary: "In-Suite Sleep & Pillow Selection",
            secondary: ["Climate & Atmosphere Controls", "Dietary & Refreshment Preferences"],
          },
          responsiveStrategy: "Single-column preference cards on mobile with persistent save button",
          requiredCapabilities: ["guest-preferences", "in-suite-curator"],
          forbiddenPatterns: ["generic table", "search bar"],
        };
      }

      if (slug.includes("amenit") || slug.includes("spa") || slug.includes("well") || slug.includes("pool")) {
        return {
          route,
          pageRole: "Property Amenities, Wellness Sanctuary & Thermal Spa",
          purpose: "Showcase of property facilities, thermal suites, holistic spa treatment menu, and fitness sanctuary",
          experienceIntent: "Explore property amenities, browse spa rituals and wellness therapies, and reserve treatment times",
          focalElement: "Thermal spa treatment menu paired with wellness sanctuary photography, facility hours, and treatment reservation modal",
          composition: {
            topology: "EDITORIAL_SPREAD",
            layers: ["Wellness Monograph Surface", "Amenity Category Tabs", "Treatment Menu Grid"],
            sections: ["Wellness Sanctuary Header", "Property Amenities Overview", "Signature Spa Rituals Menu", "Treatment Booking Concierge"],
            dominantStructure: "CURATED_COLLECTION_SHOWCASE",
          },
          interaction: {
            primary: ["Filter amenities by category (Thermal Spa, Pool, Fitness, Grounds)", "Inspect treatment descriptions and durations"],
            secondary: ["Reserve spa treatment session", "View wellness facility hours"],
          },
          motion: {
            entrance: "subtle mist-like fade and typography reveal",
            scroll: "calm editorial browsing flow",
            transitions: ["category tab crossfade"],
          },
          contentPresentation: "Peaceful spa monograph spread with warm neutral tones, treatment benefits callouts, and duration badges",
          visualHierarchy: {
            primary: "Thermal Spa & Amenities Feature",
            secondary: ["Treatment Rituals Menu", "Facility Operating Details"],
          },
          responsiveStrategy: "Two-column amenity grid collapsing to single-column on mobile",
          requiredCapabilities: ["amenity-showcase", "spa-menu"],
          forbiddenPatterns: ["saas dashboard", "generic table"],
        };
      }

      if (slug.includes("dining") || slug.includes("food") || slug.includes("restaurant") || slug.includes("culinary") || slug.includes("bar")) {
        return {
          route,
          pageRole: "Fine Dining Venues & Epicurean Experiences",
          purpose: "Curated showcase of on-property restaurants, seasonal tasting menus, sommelier wine cellar, and table reservations",
          experienceIntent: "Discover fine dining venues, explore culinary philosophies and sample menus, and reserve dining tables",
          focalElement: "Featured restaurant monograph with seasonal tasting menu, sommelier notes, and table reservation concierge",
          composition: {
            topology: "EDITORIAL_SPREAD",
            layers: ["Epicurean Monograph Surface", "Venue Roster Tabs", "Seasonal Menu Folio"],
            sections: ["Dining Overview & Culinary Philosophy", "Restaurant & Bar Venues Roster", "Seasonal Tasting Menu & Wine Pairing", "Table Reservation Ingress"],
            dominantStructure: "EDITORIAL_SPREAD",
          },
          interaction: {
            primary: ["Switch dining venues to inspect chef philosophy and ambiance", "Browse seasonal tasting menu and pairing notes"],
            secondary: ["Request table reservation", "Download seasonal wine list"],
          },
          motion: {
            entrance: "slow typographic reveal with elegant image settle",
            scroll: "smooth epicurean reading flow",
            transitions: ["venue crossfade and menu folio reveal"],
          },
          contentPresentation: "Gourmet editorial spread with artisan food photography, ingredients provenance, and sommelier callouts",
          visualHierarchy: {
            primary: "Featured Restaurant Presentation",
            secondary: ["Tasting Menu Folio", "Table Reservation Console"],
          },
          responsiveStrategy: "Stacked venue hero and menu folio on mobile",
          requiredCapabilities: ["dining-showcase", "culinary-menu"],
          forbiddenPatterns: ["generic table", "search bar"],
        };
      }

      if (slug.includes("experienc") || slug.includes("local") || slug.includes("excursion") || slug.includes("activit")) {
        return {
          route,
          pageRole: "Curated Local Experiences & Destination Concierge",
          purpose: "Bespoke guided excursions, private yacht charters, cultural artisan visits, and local landscape explorations",
          experienceIntent: "Discover curated regional excursions and activities crafted exclusively for hotel guests",
          focalElement: "Experience spotlight hero paired with activity cards, excursion duration badges, and concierge booking trigger",
          composition: {
            topology: "EDITORIAL_SPREAD",
            layers: ["Destination Experience Surface", "Activity Category Filters", "Excursion Cards Mosaic"],
            sections: ["Local Experiences Header", "Signature Excursions Spotlight", "Curated Activities Roster", "Private Concierge Inquiry"],
            dominantStructure: "CURATED_COLLECTION_SHOWCASE",
          },
          interaction: {
            primary: ["Select local experience to inspect itinerary, duration, and group capacity", "Filter excursions by category (Culture, Nature, Marine, Gastronomy)"],
            secondary: ["Add experience to personalized stay planner", "Inquire with chief concierge"],
          },
          motion: {
            entrance: "staggered excursion card reveal with gentle parallax",
            scroll: "smooth destination discovery flow",
            transitions: ["experience detail modal zoom"],
          },
          contentPresentation: "Luxury travel magazine spread with landscape photography, excursion duration tags, and private guide notes",
          visualHierarchy: {
            primary: "Lead Excursion Spotlight",
            secondary: ["Curated Experience Grid", "Concierge Inquiry Drawer"],
          },
          responsiveStrategy: "Dynamic grid columns adapting gracefully to single-column card stack on mobile",
          requiredCapabilities: ["experience-curator", "concierge-guide"],
          forbiddenPatterns: ["generic table", "search bar"],
        };
      }

      const naturalTitle = titleHint || slug.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase());
      return {
        route,
        pageRole: `${naturalTitle} Experience Surface`,
        purpose: `Bespoke luxury hospitality surface for ${naturalTitle} at ${brandName}`,
        experienceIntent: `Engage with ${naturalTitle} through refined editorial design and hospitality interactions`,
        focalElement: `${naturalTitle} presentation stage and curated hospitality details`,
        composition: {
          topology: "EDITORIAL_SPREAD",
          layers: ["Warm Neutral Canvas", "Editorial Typography Layer", "Interactive Feature Stage"],
          sections: [`${naturalTitle} Header`, `${naturalTitle} Core Experience`, "Supporting Information & Actions"],
          dominantStructure: "CURATED_COLLECTION_SHOWCASE",
        },
        interaction: {
          primary: [`Interact with ${naturalTitle} options`, `Explore ${naturalTitle} details`],
          secondary: ["Review summary notes", "Save selections"],
        },
        motion: {
          entrance: "smooth choreographed fade and subtle settle",
          scroll: "quiet contextual element reveal",
          transitions: ["state transition with spring easing"],
        },
        contentPresentation: `High-fidelity hospitality layout for ${naturalTitle}`,
        visualHierarchy: {
          primary: `${naturalTitle} Presentation`,
          secondary: ["Contextual Details", "Action Buttons"],
        },
        responsiveStrategy: "Fluid responsive layout adapting gracefully across viewports",
        requiredCapabilities: [`${slug}-interactive-stage`],
        forbiddenPatterns: ["saas dashboard", "generic empty cards", "unformatted raw data table", "placeholder text"],
      };
    }

    // =========================================================================
    // GENRE: LUXURY_ARTIFACT_STAGE (High Horology, Jewelry, Perfume, Atelier)
    // =========================================================================
    const isLuxuryPrompt =
      genre === "LUXURY_ARTIFACT_STAGE" ||
      (!isHotelOrHospitality && !isObservatory && /\b(watch|horology|timepiece|atelier|calibre|tourbillon|chronometer|jewelry|perfume|flacon)\b/i.test(promptLower + " " + brandName.toLowerCase()));

    if (isLuxuryPrompt) {
      if (route === "/" || slug === "home" || slug === "stage" || slug === "hero") {
        return {
          route,
          pageRole: "Hero Artifact Stage & 3D Interactive Rotator",
          purpose: `Hero luxury product stage for ${brandName} with 360-degree interactive 3D model, caliber loupe zoom, and material switching`,
          experienceIntent: "Inspect the tactile finish, sapphire caseback, and complications of the manufacture timepiece",
          focalElement: "Hand-finished tourbillon timepiece in grade-5 titanium and rose gold with 360-degree rotation",
          composition: {
            topology: "PORTAL_HERO_SHOWCASE",
            layers: ["Minimalist Studio Plinth", "3D WebGL Mesh Canvas", "Minimalist Horology HUD"],
            sections: ["Timepiece Hero Rotator", "Caliber Complication Loupe", "Private Viewing Salon Trigger"],
            dominantStructure: "FULL_BLEED_STAGE",
          },
          interaction: {
            primary: ["Drag to rotate timepiece 360 degrees", "Switch case material (Titanium, Rose Gold, Platinum)"],
            secondary: ["Zoom loupe into escapement", "Request private atelier appointment"],
          },
          motion: {
            entrance: "smooth axial spin with dramatic spotlight reveal",
            scroll: "subtle zoom into movement facets",
            transitions: ["material shader interpolation"],
          },
          contentPresentation: "Monochrome luxury stage with gold accents and high-precision technical specifications",
          visualHierarchy: {
            primary: "3D Timepiece Stage",
            secondary: ["Material Switcher HUD", "Caliber Specs Strip"],
          },
          responsiveStrategy: "Touch-rotatable artifact canvas with floating specs drawer",
          requiredCapabilities: ["3d-webgl-canvas", "3d-model-rotator"],
          forbiddenPatterns: ["saas dashboard", "generic empty cards", "unformatted raw data table", "placeholder text"],
        };
      }

      // Movement, calibre, mechanics, craftsmanship, anatomy
      if (slug.includes("movement") || slug.includes("calibre") || slug.includes("exploded") || slug.includes("craft") || slug.includes("anatomy") || slug.includes("mechanism") || slug.includes("complication")) {
        return {
          route,
          pageRole: "Mechanical Calibre Architecture & Exploded Movement Inspection",
          purpose: "Deep technical dive into manufacture calibre architecture, balance wheel escapement, and hand-finishing anglage",
          experienceIntent: "Observe exploded movement layers, gear train interaction, and artisan hand-finishing traditions",
          focalElement: "Exploded movement assembly showing bridge architecture, ruby jewels, and tourbillon cage",
          composition: {
            topology: "ASYMMETRIC_TECTONIC_STUDY",
            layers: ["Dark Studio Void", "Exploded Movement Stage", "Horological Chronicle Overlay"],
            sections: ["Exploded Caliber Assembly", "Hand-Finishing Micro-Loupe", "Geneva Wave & Anglage Details"],
            dominantStructure: "ASYMMETRIC_TECTONIC_STUDY",
          },
          interaction: {
            primary: ["Drag explosion slider to separate movement plates", "Select caliber component to inspect anglage"],
            secondary: ["Toggle balance spring oscillation", "View watchmaker notes"],
          },
          motion: {
            entrance: "axial separation of movement components",
            scroll: "layer-by-layer deconstruction",
            transitions: ["part focus and camera zoom"],
          },
          contentPresentation: "Technical horology monograph with exploded schematics and high-magnification photography",
          visualHierarchy: {
            primary: "Exploded Movement Stage",
            secondary: ["Component Selector", "Craftsmanship Chronicle"],
          },
          responsiveStrategy: "Sequential component breakdown on mobile viewports",
          requiredCapabilities: ["movement-viewer", "calibre-inspection"],
          forbiddenPatterns: ["saas dashboard", "generic empty cards", "unformatted raw data table", "placeholder text"],
        };
      }

      // Dial configurator, bespoke engraving, studio
      if (slug.includes("config") || slug.includes("dial") || slug.includes("custom") || slug.includes("engrav") || slug.includes("bespoke") || slug.includes("studio")) {
        return {
          route,
          pageRole: "Artisanal Dial Customization & Bespoke Engraving Studio",
          purpose: "Interactive bespoke customization atelier allowing collectors to configure dials, hands, materials, and caseback engravings with real-time aesthetic feedback",
          experienceIntent: "Customize timepiece specifications and preview bespoke engravings before commission",
          focalElement: "Interactive timepiece configurator canvas with live dial texture switching, metal alloy preview, and bespoke engraving text renderer",
          composition: {
            topology: "BESPOKE_STUDIO",
            layers: ["Studio Lighting Stage", "Interactive Timepiece Mesh Canvas", "Atelier Customization Palette"],
            sections: ["Interactive Timepiece Stage", "Dial & Case Material Palette", "Custom Engraving Studio & Commission Summary"],
            dominantStructure: "BESPOKE_STUDIO",
          },
          interaction: {
            primary: ["Select dial finish (Guilloché, Sunburst, Enamel, Aventurine)", "Enter bespoke caseback engraving text and preview typography"],
            secondary: ["Toggle hand finishes", "Save bespoke configuration to vault"],
          },
          motion: {
            entrance: "subtle spotlight sweep across dial guilloché pattern",
            scroll: "smooth palette transition",
            transitions: ["real-time material shader updates"],
          },
          contentPresentation: "Luxury atelier studio interface with gold accents, precise typography, and tactile configuration swatches",
          visualHierarchy: {
            primary: "Interactive Dial Stage",
            secondary: ["Configuration Swatches", "Engraving Input & Summary"],
          },
          responsiveStrategy: "Sticky dial preview on mobile with swipeable configuration tabs",
          requiredCapabilities: ["dial-configurator", "engraving-preview"],
          forbiddenPatterns: ["saas dashboard", "generic empty cards", "unformatted raw data table", "placeholder text"],
        };
      }

      // Provenance registry, digital certificate verification, ledger
      if (slug.includes("provenance") || slug.includes("certificate") || slug.includes("registry") || slug.includes("verify") || slug.includes("ledger") || slug.includes("auth")) {
        return {
          route,
          pageRole: "Tamper-Evident Provenance Registry & Digital Certificate Authentication",
          purpose: "Searchable cryptographic provenance registry and serial certificate verification portal for authenticated manufactured timepieces",
          experienceIntent: "Verify authentic manufacture serial numbers, provenance history, and certificate of origin",
          focalElement: "Cryptographic serial verification terminal and verified manufacture provenance certificate viewer",
          composition: {
            topology: "PROVENANCE_LEDGER",
            layers: ["Guilloché Security Background", "Certificate Verification Terminal", "Manufacture Ledger Feed"],
            sections: ["Serial Number Verification Portal", "Verified Provenance Certificate Display", "Manufacture Archive Ledger"],
            dominantStructure: "PROVENANCE_LEDGER",
          },
          interaction: {
            primary: ["Enter serial number or certificate hash to verify authenticity", "Inspect digital certificate of origin and ownership chain"],
            secondary: ["Download cryptographic certificate PDF", "Register timepiece acquisition"],
          },
          motion: {
            entrance: "certificate border reveal and digital stamp seal animation",
            scroll: "quiet ledger reveal",
            transitions: ["verification status pulse transition"],
          },
          contentPresentation: "Cryptographic security document aesthetic with guilloché security borders, gold foil seals, and monospace hash displays",
          visualHierarchy: {
            primary: "Serial Verification Terminal",
            secondary: ["Certificate Details Card", "Provenance Chain Ledger"],
          },
          responsiveStrategy: "Stacked certificate viewport with card-based provenance trail on mobile",
          requiredCapabilities: ["provenance-registry", "certificate-verifier"],
          forbiddenPatterns: ["saas dashboard", "generic empty cards", "unformatted raw data table", "placeholder text"],
        };
      }

      // Collector vault, portfolio, collection catalog, timepieces
      if (slug.includes("vault") || slug.includes("collector") || slug.includes("portfolio") || slug.includes("archive") || slug.includes("catalog") || slug.includes("collection") || slug.includes("timepiece")) {
        return {
          route,
          pageRole: "Collector Vault Portfolio & Timepiece Collection Ledger",
          purpose: "Private collector vault cataloging acquired manufacture timepieces, valuation metrics, service history, and certificate dossiers",
          experienceIntent: "Review collector portfolio holdings, market valuation, service milestones, and acquisition records",
          focalElement: "Interactive collector vault showcase featuring curated timepiece cards, total portfolio valuation metrics, and provenance dossiers",
          composition: {
            topology: "COLLECTOR_VAULT",
            layers: ["Obsidian Vault Surface", "Curated Collection Grid", "Valuation Summary Panel"],
            sections: ["Portfolio Valuation Overview", "Collector Timepiece Gallery", "Service History & Milestones Ledger"],
            dominantStructure: "COLLECTOR_VAULT",
          },
          interaction: {
            primary: ["Inspect timepieces in vault", "Filter by complication, case material, and acquisition date"],
            secondary: ["Request certified valuation update", "Schedule atelier servicing"],
          },
          motion: {
            entrance: "vault aperture opening and golden card elevation",
            scroll: "subtle card parallax",
            transitions: ["filter crossfade with smooth height animation"],
          },
          contentPresentation: "Deep obsidian vault aesthetic with brushed brass accents, precision typography, and rich specimen cards",
          visualHierarchy: {
            primary: "Portfolio Valuation Masthead",
            secondary: ["Timepiece Collection Cards", "Provenance Dossier Drawer"],
          },
          responsiveStrategy: "Responsive vault card layout with summary metrics banner on mobile viewports",
          requiredCapabilities: ["collector-vault", "portfolio-ledger"],
          forbiddenPatterns: ["saas dashboard", "generic empty cards", "unformatted raw data table", "placeholder text"],
        };
      }

      // Salon appointments, concierge consultation, atelier booking
      if (slug.includes("appointment") || slug.includes("salon") || slug.includes("consult") || slug.includes("book") || slug.includes("atelier") || slug.includes("concierge")) {
        return {
          route,
          pageRole: "Private Salon Consultation & Atelier Viewing Appointment",
          purpose: "Exclusive consultation scheduling and bespoke commission concierge for Geneva, Paris, and New York ateliers",
          experienceIntent: "Schedule private viewing salon appointment with master horologist",
          focalElement: "Atelier presentation tray with salon city selector and private consultation scheduler",
          composition: {
            topology: "CONCIERGE_SALON",
            layers: ["Silk Presentation Mat Background", "Concierge Consultation Panel", "Salon Location Selector"],
            sections: ["Salon City Selector (Geneva, Paris, New York)", "Private Appointment Scheduler", "Bespoke Consultation Intake"],
            dominantStructure: "CONCIERGE_SALON",
          },
          interaction: {
            primary: ["Select salon city to view available consultation dates", "Select preferred appointment date and time"],
            secondary: ["Specify bespoke interests or collection inquiries", "Confirm private salon reservation"],
          },
          motion: {
            entrance: "quiet fade in with gold border reveal",
            scroll: "minimal scroll",
            transitions: ["salon city transition"],
          },
          contentPresentation: "Understated luxury concierge interface with serif typography and private consultation calendar",
          visualHierarchy: {
            primary: "Salon Presentation Tray",
            secondary: ["City Atelier Selector", "Concierge Intake Form"],
          },
          responsiveStrategy: "Centered concierge card with modal city selector",
          requiredCapabilities: ["concierge-scheduler", "salon-city-switcher"],
          forbiddenPatterns: ["saas dashboard", "generic empty cards", "unformatted raw data table", "placeholder text"],
        };
      }

      // Material, metallurgy
      if (slug.includes("material") || slug.includes("metallurgy") || slug.includes("alloy") || slug.includes("gold") || slug.includes("titanium")) {
        return {
          route,
          pageRole: "Metallurgical Matrix & Case Metallurgy",
          purpose: "Side-by-side metallurgical comparison of grade-5 titanium, 18k 5N rose gold, and platinum 950",
          experienceIntent: "Compare tensile strength, Vickers hardness, density, and thermal tactile ergonomics",
          focalElement: "Interactive metallurgical comparison plinth with live material shader switching and tactile spec cards",
          composition: {
            topology: "METALLURGY_COMPARISON_STAGE",
            layers: ["Studio Plinth Surface", "Material Swatch Stage", "Ergonomics & Hardness Matrix"],
            sections: ["Alloy Composition Stage", "Vickers Hardness Radar", "Tactile Ergonomics Breakdown"],
            dominantStructure: "METALLURGY_COMPARISON_STAGE",
          },
          interaction: {
            primary: ["Toggle alloy alloy to preview case sheen and weight density", "Compare metallurgical parameters"],
            secondary: ["Inspect hypoallergenic surface treatment", "Calculate wrist mass balance"],
          },
          motion: {
            entrance: "specular light sweep across alloy bars",
            scroll: "comparison radar expansion",
            transitions: ["anisotropic metallic shader crossfade"],
          },
          contentPresentation: "Clean metallurgical laboratory presentation with specular reflections and exact alloy formulas",
          visualHierarchy: {
            primary: "Case Metallurgy Plinth",
            secondary: ["Hardness & Density Matrix", "Alloy Composition Formula"],
          },
          responsiveStrategy: "Swipeable alloy selector with comparison table",
          requiredCapabilities: ["material-shader-preview", "alloy-comparator"],
          forbiddenPatterns: ["saas dashboard", "generic empty cards", "unformatted raw data table", "placeholder text"],
        };
      }

      // Fallback for any other luxury route
      const natTitle = titleHint || slug.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase());
      return {
        route,
        pageRole: `${natTitle} Presentation Surface`,
        purpose: `Atelier presentation surface for ${natTitle} crafted for ${brandName}`,
        experienceIntent: `Engage with ${natTitle} through bespoke horological presentation and tactile interaction`,
        focalElement: `Hand-finished ${natTitle} presentation plinth with high-precision horological details`,
        composition: {
          topology: "BESPOKE_STUDIO",
          layers: ["Brushed Dark Obsidian Plinth", "Horological Feature Stage", "Craft Details Drawer"],
          sections: [`${natTitle} Exhibition Stage`, `${natTitle} Technical Details`, "Atelier Actions & Inquiries"],
          dominantStructure: "BESPOKE_STUDIO",
        },
        interaction: {
          primary: [`Inspect ${natTitle} details`, `Toggle ${natTitle} view options`],
          secondary: ["Request atelier dossier", "Save to collection"],
        },
        motion: {
          entrance: "quiet fade in with gold accent settle",
          scroll: "smooth contextual element reveal",
          transitions: ["subtle sheen highlight crossfade"],
        },
        contentPresentation: "Understated haute horlogerie aesthetic with gold accents and high-precision technical specifications",
        visualHierarchy: {
          primary: `${natTitle} Exhibition Stage`,
          secondary: ["Technical Details", "Atelier Actions"],
        },
        responsiveStrategy: "Fluid responsive layout adapting gracefully across viewports",
        requiredCapabilities: [`${slug}-interactive-stage`],
        forbiddenPatterns: ["saas dashboard", "generic empty cards", "unformatted raw data table", "placeholder text"],
      };
    }

    if (genre === "SPATIAL_WORLD") {
      if (route === "/" || slug === "home" || slug === "world-stage") {
        return {
          route,
          pageRole: "World Entrance & Living Spatial Universe",
          purpose: `Primary 3D interactive stage for ${brandName} with WebGL spatial canvas and interactive coordinates`,
          experienceIntent: `Immerse user in procedural 3D world with continuous orbit camera and interactive points of interest`,
          focalElement: homeFocal,
          composition: {
            topology: "IMMERSIVE_WORLD",
            layers: ["Atmosphere Environment Skybox", "Procedural 3D Stage Mesh", "Living Focal Subjects", "Floating Coordinate HUD"],
            sections: ["Hero 3D Stage", "Coordinates & Waypoints Dock", "Live Subject Spotlight"],
            dominantStructure: "FULL_BLEED_STAGE",
          },
          interaction: {
            primary: ["Orbit and tilt 3D camera", "Click coordinate biomes to inspect waypoints"],
            secondary: ["Toggle sound visualizer", "Inspect companion counter"],
          },
          motion: {
            entrance: "camera dolly from sky to center stage",
            scroll: "continuous axial orbit",
            transitions: ["smooth camera pan to target coordinates"],
          },
          contentPresentation: "Spatial 3D canvas with floating glass HUD and live status badges",
          visualHierarchy: {
            primary: "3D Central Stage",
            secondary: ["Waypoint HUD", "Sound Visualizer Pill"],
          },
          responsiveStrategy: "Full-viewport canvas on mobile with compact bottom action dock",
          requiredCapabilities: ["3d-webgl-canvas", "orbit-camera-controller", "realm-compass-hud"],
          forbiddenPatterns: ["search bar", "filter chips", "table", "card grid", "crud forms"],
        };
      }

      if (slug.includes("character") || slug.includes("companion") || slug.includes("avatar") || slug.includes("specimen") || slug.includes("species")) {
        return {
          route,
          pageRole: isOcean ? "Marine Specimen & Deep-Sea Fauna Observation Plinth" : "Interactive Character Spotlight & Lore Stage",
          purpose: isOcean ? "Marine specimen inspection stage with 3D rotatable benthic fauna, sonar telemetry, and sound audition" : "Character inspection stage with 3D rotatable avatars, personality dialogue selector, voice clips, and audio toggles",
          experienceIntent: isOcean ? "Inspect deep-sea benthic organisms, photophore luminescence, and marine biology profiles" : "Inspect handcrafted 3D companions, switch expressions, and listen to authentic character voice lore",
          focalElement: isOcean ? "Large 3D marine specimen observation plinth with animated creature anatomy and photophore glow controls" : "Large 3D character inspection plinth with animated companion avatar and real-time expression/pose controls",
          composition: {
            topology: "CHARACTER_STAGE",
            layers: ["Spotlight Stage Plinth", "3D Avatar Mesh", "Dialogue & Lore Drawer"],
            sections: ["Hero Inspection Stage", "Entity Selector Dock", "Specimen Lore & Audio Excerpts"],
            dominantStructure: "CHARACTER_ENCOUNTER_CAROUSEL",
          },
          interaction: {
            primary: ["Switch entity to update 3D model & details", "Trigger voice clip or acoustic telemetry"],
            secondary: ["Inspect specimen traits and origin habitat", "Toggle inspection parameters"],
          },
          motion: {
            entrance: "gentle entity spin and spring entrance",
            scroll: "fixed stage with rotating pedestal",
            transitions: ["smooth avatar crossfade and audio play"],
          },
          contentPresentation: "Interactive spotlight with 3D model, personality quote, and audio player",
          visualHierarchy: {
            primary: "3D Entity Plinth",
            secondary: ["Entity Carousel Dock", "Lore & Personality Card"],
          },
          responsiveStrategy: "Stacked character stage with horizontal thumbnail bar",
          requiredCapabilities: ["character-switcher", "voice-clip-player", "3d-avatar-stage"],
          forbiddenPatterns: ["generic card directory", "search input", "table", "crud forms"],
        };
      }

      if (slug.includes("quest") || slug.includes("map") || slug.includes("world") || slug.includes("dive") || slug.includes("trail") || slug.includes("waypoint")) {
        return {
          route,
          pageRole: isOcean ? "Benthic Bathymetry Map & Deep Dive Site Navigator" : isSpace ? "Orbital Cartography & Deep Space Coordinate Navigator" : "Spatial Lore Map & Landmark Waypoint Navigator",
          purpose: isOcean ? "Interactive bathymetric floor map with dive site waypoints, trench depths, and hydrothermal coordinates" : "Interactive spatial map with discoverable biomes, landmark waypoints, and exploration progression",
          experienceIntent: "Navigate the topological coordinate map, unlock regional secrets, and track discovery milestones",
          focalElement: isOcean ? "Topological bathymetric seafloor map canvas with glowing dive site coordinates and sonar trails" : "Topological interactive world map canvas with glowing quest landmarks and animated waypoint trails",
          composition: {
            topology: "SPATIAL_MAP",
            layers: ["Topological Terrain Mesh", "Glowing Landmark Markers", "Active Coordinate Overlay"],
            sections: ["Interactive Map Canvas", "Selected Waypoint Detail Drawer", "Exploration Milestone Ledger"],
            dominantStructure: "SPATIAL_LORE_MAP",
          },
          interaction: {
            primary: ["Click map landmark to focus camera and reveal lore", "Filter landmarks by zone status"],
            secondary: ["Mark waypoint as discovered", "View milestone badge"],
          },
          motion: {
            entrance: "top-down map unfold with glowing node pulse",
            scroll: "pan & zoom camera bounds",
            transitions: ["fly to landmark coordinates"],
          },
          contentPresentation: "Interactive vector/spatial map with glowing pins and sliding landmark dossier",
          visualHierarchy: {
            primary: "Interactive Realm Map",
            secondary: ["Selected Landmark Dossier", "Milestone Progress Bar"],
          },
          responsiveStrategy: "Pinch-to-zoom map viewport with bottom sheet dossier",
          requiredCapabilities: ["interactive-map-canvas", "waypoint-selection-engine", "quest-dossier"],
          forbiddenPatterns: ["card grid", "search input", "table", "crud forms"],
        };
      }

      if (slug.includes("sound") || slug.includes("audio") || slug.includes("atmosphere") || slug.includes("freq") || slug.includes("music") || slug.includes("guide")) {
        const isMuseumGuide = isMuseum || slug.includes("audio-guide") || slug.includes("audioguide");
        return {
          route,
          pageRole: isOcean
            ? "Hydrophone Acoustic Array & Marine Resonance Console"
            : isMuseumGuide
            ? "Gallery Audio Guide & Curator Commentary Console"
            : isMusic
            ? "Acoustic Synthesizer Studio & Tactile Sound Console"
            : "Atmospheric Sound Studio & Tactile Audio Environment",
          purpose: isOcean
            ? "Deep-sea hydrophone audio environment with low-frequency whale acoustics, sonar chirps, and hydrothermal bubble mixers"
            : isMuseumGuide
            ? "Immersive exhibition audio walkthrough with curator commentary, artist voices, room navigation, and exhibition listening notes"
            : "Playful audio mixing environment with large interactive sound objects, resonance sliders, and chime visualizers",
          experienceIntent: isMuseumGuide
            ? "Listen to exhibition audio commentary, artist statements, and curated room tracks with interactive playback controls"
            : "Mix ambient audio and trigger tactile soundboard clips using Web Audio synthesis",
          focalElement: isMuseumGuide
            ? "Curator audio player console with exhibition track selector, waveform visualizer, and artist commentary notes"
            : "Tactile sound studio console with glowing resonance pads, frequency visualizer, and ambient environmental mixers",
          composition: {
            topology: "AUDIO_CONSOLE",
            layers: isMuseumGuide
              ? ["Gallery Acoustic Surface", "Curator Audio Player", "Exhibition Track Dossier"]
              : ["Soundwave Visualizer Surface", "Tactile Resonance Pads", "Environmental Mixer Sliders"],
            sections: isMuseumGuide
              ? ["Master Audio Guide Player", "Exhibition Tracklist & Room Walkthrough", "Curator Field Notes & Transcript"]
              : ["Master Frequency Visualizer", "Tactile Sound Trigger Grid", "Ambient Layer Sliders"],
            dominantStructure: "TACTILE_AUDIO_SURFACE",
          },
          interaction: {
            primary: isMuseumGuide
              ? ["Select exhibition room audio track and toggle playback", "Scrub waveform timeline to navigate curator commentary"]
              : ["Tap sound pads to trigger Web Audio synth tones and visual ripple", "Adjust ambient mixer sliders in real-time"],
            secondary: isMuseumGuide
              ? ["Read synchronized curator transcript", "Bookmark audio track to personal visit guide"]
              : ["Toggle soundscape presets", "Record sound mix loop"],
          },
          motion: {
            entrance: "soundwave ripple wave expanding from center",
            scroll: "fixed console view",
            transitions: ["live frequency amplitude modulation"],
          },
          contentPresentation: isMuseumGuide
            ? "Gallery audio player with track progress, room badges, and synchronized curatorial commentary"
            : "Tactile synthesizer console with animated sound waves and luminescent sound pads",
          visualHierarchy: {
            primary: isMuseumGuide ? "Exhibition Audio Player" : "Audio Waveform Visualizer",
            secondary: isMuseumGuide ? ["Room Tracklist", "Curator Notes"] : ["Tactile Sound Object Pads", "Atmospheric Sliders"],
          },
          responsiveStrategy: "Touch-optimized sound pad grid with sliding mixer drawer",
          requiredCapabilities: ["web-audio-synth", "audio-visualizer-canvas", "resonance-mixer"],
          forbiddenPatterns: isMuseumGuide
            ? ["hydrophone", "whale acoustics", "bathymetric", "submersible", "marine resonance", "card grid", "crud forms"]
            : ["search bar", "card grid", "table", "crud forms"],
        };
      }

      // Fallback spatial route (e.g. Journey / Lore / Milestones)
      return {
        route,
        pageRole: "Scroll-Driven Narrative Progression & Discovery Ledger",
        purpose: "Scroll-driven narrative story experience with milestone progression and atmospheric scene transitions",
        experienceIntent: "Follow chronological journey milestones with scene progression and visual essay spreads",
        focalElement: "Cinematic scrollytelling narrative path with pinned chapter scenes and progressive lore reveals",
        composition: {
          topology: "SCROLL_NARRATIVE",
          layers: ["Parallax Scene Background", "Pinned Narrative Chapter Card", "Progress Trail Indicator"],
          sections: chapters,
          dominantStructure: "SCROLL_VISUAL_ESSAY",
        },
        interaction: {
          primary: ["Scroll through chapters triggering scene transitions and lore reveals", "Click chapter timeline nodes to jump to story milestones"],
          secondary: ["Unfold chapter marginalia and secret discovery notes"],
        },
        motion: {
          entrance: "fade in with chapter badge ascent",
          scroll: "continuous scroll-driven scene dolly and parallax",
          transitions: ["chapter cross-wipe with ambient color shift"],
        },
        contentPresentation: "Full-bleed narrative spread with pinned scene canvas and illuminated typography",
        visualHierarchy: {
          primary: "Active Chapter Scene",
          secondary: ["Narrative Text Column", "Journey Milestones Compass"],
        },
        responsiveStrategy: "Vertical scrollytelling with sticky chapter indicator",
        requiredCapabilities: ["scroll-chapter-controller", "parallax-background", "milestone-timeline"],
        forbiddenPatterns: ["card grid", "search bar", "table", "crud forms"],
      };
    }

    // =========================================================================
    // GENRE: CLEAN ENERGY & RENEWABLE OPERATIONS
    // =========================================================================
    const isCleanEnergy = !isSpace && !isOcean && /\b(renewable|clean energy|greenpulse|energy operations|power grid|microgrid|photovoltaic|inverter|turbine|wind farm)\b/i.test(promptLower);

    if (isCleanEnergy) {
      if (route === "/" || slug === "operations" || slug === "home" || slug === "overview" || slug === "dashboard" || slug === "console") {
        return {
          route,
          pageRole: "Renewable Energy Generation & Operational Command Console",
          purpose: `Central real-time operational command console for ${brandName} featuring live renewable generation telemetry, grid export trends, and turbine status`,
          experienceIntent: `Monitor utility-scale solar and wind generation, inspect grid export megawatt output, and review operational alerts`,
          focalElement: "High-density generation telemetry canvas with solar irradiance curve, wind generation capacity, and live grid power factor",
          composition: {
            topology: "FULL_BLEED_STAGE",
            layers: ["Generation Telemetry Surface", "Power Curve HUD", "Grid Feed Telemetry Strip"],
            sections: ["Real-Time Generation Telemetry & Grid Export", "Asset Fleet Overview & Generation Status", "Active Grid Alerts & Curtailment"],
            dominantStructure: "DENSE_TELEMETRY_GRID",
          },
          interaction: {
            primary: ["Inspect live solar/wind generation meters and grid feed channels", "Toggle generation frequency and power factor telemetry"],
            secondary: ["Acknowledge operational grid alerts", "Switch telemetry sampling intervals"],
          },
          motion: {
            entrance: "rapid generation grid calibration and live telemetry lock",
            scroll: "fixed command console layout with high-density metric scroll",
            transitions: ["instant telemetry stream modulation without layout shift"],
          },
          contentPresentation: "High-density clean-energy operational command interface with monospace numeric megawatts, status annunciators, and live power curves",
          visualHierarchy: {
            primary: "Real-Time Generation Telemetry & Grid Export",
            secondary: ["Asset Fleet Readouts", "Active Substation Diagnostics"],
          },
          responsiveStrategy: "Responsive command grid with collapsible telemetry rails on smaller screens",
          requiredCapabilities: ["generation-telemetry-grid", "power-curve-canvas", "grid-diagnostics"],
          forbiddenPatterns: ["monograph", "editorial publication", "building typology", "timber stone", "curatorial index", "crud forms"],
        };
      }

      if (slug.includes("asset") || slug.includes("turbine") || slug.includes("solar") || slug.includes("inventory") || slug.includes("fleet")) {
        return {
          route,
          pageRole: "Solar & Wind Asset Directory & Capacity Roster",
          purpose: `Asset inventory ledger for ${brandName} tracking solar inverters, wind turbines, nameplate capacity, and operating status`,
          experienceIntent: `Filter and inspect renewable assets by farm type, operating state, capacity rating, and telemetry readouts`,
          focalElement: "Asset inventory ledger with generation telemetry metrics, turbine yaw health, inverter temperatures, and status pills",
          composition: {
            topology: "FULL_BLEED_STAGE",
            layers: ["Asset Fleet Canvas", "Asset Registry Ledger", "Subsystem Diagnostic HUD"],
            sections: ["Solar & Wind Asset Fleet Matrix", "Asset Capacity & Nameplate Ledger", "Inverter & Turbine Diagnostic Stream"],
            dominantStructure: "DENSE_TELEMETRY_GRID",
          },
          interaction: {
            primary: ["Select renewable asset to inspect live telemetry and capacity metrics", "Filter assets by operational status (Active, Maintenance, Curtailed)"],
            secondary: ["Review lifetime megawatt-hours and operating temperatures", "Track preventive maintenance intervals"],
          },
          motion: {
            entrance: "staggered asset telemetry lock and inventory ledger draw-in",
            scroll: "smooth high-density ledger scrolling",
            transitions: ["asset telemetry inspector drawer reveal"],
          },
          contentPresentation: "Precision renewable asset operations ledger with monospace asset IDs, status badges, and capacity ratings",
          visualHierarchy: {
            primary: "Active Asset Tracking Ledger",
            secondary: ["Selected Asset Telemetry Metrics", "Fleet Availability Summary"],
          },
          responsiveStrategy: "Stacked asset card stream on mobile viewports with quick-filter chips",
          requiredCapabilities: ["asset-telemetry-ledger", "fleet-capacity-matrix"],
          forbiddenPatterns: ["monograph", "editorial publication", "building typology", "timber stone", "curatorial index", "crud forms"],
        };
      }

      if (slug.includes("analytic") || slug.includes("grid") || slug.includes("performance") || slug.includes("telemetry") || slug.includes("stream")) {
        return {
          route,
          pageRole: "Grid Telemetry Analytics & Environmental Impact Console",
          purpose: `Advanced grid performance telemetry, renewable penetration metrics, and carbon offset analytics for ${brandName}`,
          experienceIntent: `Analyze historical generation curves, grid curtailment metrics, and emissions abatement trends`,
          focalElement: "Multi-channel grid performance waveform canvas with irradiance correlation and carbon displacement counters",
          composition: {
            topology: "FULL_BLEED_STAGE",
            layers: ["Performance Waveform Surface", "Grid Metric HUD", "Environmental Abatement Strip"],
            sections: ["Grid Generation Performance Curve", "Carbon Offset & Emission Abatement", "Curtailment & Substation Diagnostics"],
            dominantStructure: "DENSE_TELEMETRY_GRID",
          },
          interaction: {
            primary: ["Switch telemetry sensor channels (Grid Frequency, Reactive Power, Solar Irradiance, Wind Velocity)", "Tune analysis window and resolution"],
            secondary: ["Export generation data stream", "Inspect curtailment events"],
          },
          motion: {
            entrance: "high-frequency waveform sweep and live ticker lock",
            scroll: "fixed telemetry console view",
            transitions: ["instant channel modulation with zero layout jump"],
          },
          contentPresentation: "Precision telemetry visualization display with green/amber/red threshold status and monospace energy readouts",
          visualHierarchy: {
            primary: "Live Generation Waveform Canvas",
            secondary: ["Grid Parameter Table", "Active Abatement Strip"],
          },
          responsiveStrategy: "Compact parameter grid with swipeable metric channels on mobile",
          requiredCapabilities: ["waveform-stream-canvas", "telemetry-parameter-grid"],
          forbiddenPatterns: ["monograph", "editorial publication", "building typology", "timber stone", "curatorial index", "crud forms"],
        };
      }

      if (slug.includes("maintenance") || slug.includes("work-order") || slug.includes("dispatch") || slug.includes("technician") || slug.includes("repair")) {
        return {
          route,
          pageRole: "Maintenance Dispatch & Technician Work Order Console",
          purpose: `Field dispatch console for ${brandName} coordinating preventive maintenance work orders, technician crews, and equipment spares`,
          experienceIntent: `Schedule turbine overhauls, assign technician work orders, and track mean time to repair`,
          focalElement: "Interactive technician dispatch roster with active work orders, priority tiers, and maintenance timelines",
          composition: {
            topology: "FULL_BLEED_STAGE",
            layers: ["Maintenance Dispatch Canvas", "Work Order Queue", "Technician Availability HUD"],
            sections: ["Preventive Maintenance Schedule", "Field Technician Dispatch Queue", "Component Spares & MTTR Diagnostics"],
            dominantStructure: "DENSE_TELEMETRY_GRID",
          },
          interaction: {
            primary: ["Assign technician crew to open work order", "Filter work orders by priority and asset category"],
            secondary: ["Update work order status and log parts replaced", "Track technician dispatch SLA"],
          },
          motion: {
            entrance: "staggered work order card draw-in and schedule calibration",
            scroll: "smooth dispatch timeline scroll",
            transitions: ["work order details drawer expansion"],
          },
          contentPresentation: "Field engineering maintenance ledger with priority badges, technician badges, and execution timers",
          visualHierarchy: {
            primary: "Active Work Order Queue",
            secondary: ["Technician Crew Roster", "Spares Inventory Level"],
          },
          responsiveStrategy: "Stacked work order cards on mobile with swipe-to-update status",
          requiredCapabilities: ["work-order-queue", "technician-dispatch-grid"],
          forbiddenPatterns: ["monograph", "editorial publication", "building typology", "timber stone", "curatorial index", "crud forms"],
        };
      }

      if (slug.includes("incident") || slug.includes("alert") || slug.includes("triage") || slug.includes("alarm")) {
        return {
          route,
          pageRole: "Operational Incident Triage & Emergency Escalation Console",
          purpose: `Real-time fault monitoring, grid trip alerts, and incident triage for ${brandName}`,
          experienceIntent: `Triage inverter trip alarms, investigate turbine vibrations, and execute emergency curtailment workflows`,
          focalElement: "Critical alert triage queue with severity badges, alarm acknowledgment controls, and escalation logs",
          composition: {
            topology: "FULL_BLEED_STAGE",
            layers: ["Alarm Triage Canvas", "Incident Escalation Ledger", "Fault Diagnostics HUD"],
            sections: ["Active Fault & Grid Incident Queue", "Alarm Severity Triage & Sequence of Events", "Emergency Curtailment Protocols"],
            dominantStructure: "DENSE_TELEMETRY_GRID",
          },
          interaction: {
            primary: ["Acknowledge and triage critical inverter and grid fault alarms", "Initiate incident escalation protocol to on-call engineer"],
            secondary: ["Inspect root cause telemetry logs", "Record incident mitigation notes"],
          },
          motion: {
            entrance: "rapid high-contrast alert pulse and queue stabilization",
            scroll: "fixed alert console view",
            transitions: ["alarm state transition animation"],
          },
          contentPresentation: "Mission-critical incident triage desk with color-coded severity indicators, countdown timers, and acknowledgment triggers",
          visualHierarchy: {
            primary: "Active Incident Triage Stream",
            secondary: ["Alarm Acknowledgment Console", "Escalation Audit Trail"],
          },
          responsiveStrategy: "High-priority alert banner with collapsible incident cards on mobile",
          requiredCapabilities: ["incident-triage-queue", "alert-acknowledgment-engine"],
          forbiddenPatterns: ["monograph", "editorial publication", "building typology", "timber stone", "curatorial index", "crud forms"],
        };
      }

      if (slug.includes("report") || slug.includes("compliance") || slug.includes("log") || slug.includes("audit")) {
        return {
          route,
          pageRole: "Generation Compliance & Environmental Impact Reports",
          purpose: `Regulatory generation compliance records, utility settlement logs, and exportable executive reports for ${brandName}`,
          experienceIntent: `Generate compliance audits, review monthly power purchase agreement deliveries, and export executive logs`,
          focalElement: "Exportable generation audit matrix with PPA delivery targets, capacity factors, and export tools",
          composition: {
            topology: "FULL_BLEED_STAGE",
            layers: ["Compliance Audit Surface", "Executive Summary HUD", "Export Ledger"],
            sections: ["Monthly Generation & PPA Settlement Ledger", "Environmental Compliance Verification", "Export Executive Generation Summary"],
            dominantStructure: "DENSE_TELEMETRY_GRID",
          },
          interaction: {
            primary: ["Generate PPA delivery compliance export", "Filter generation logs by reporting period and jurisdiction"],
            secondary: ["Download CSV/PDF audit package", "Verify grid interconnection certificate"],
          },
          motion: {
            entrance: "clean report matrix draw-in with verified checksum lock",
            scroll: "structured document ledger scroll",
            transitions: ["instant export parameter toggle"],
          },
          contentPresentation: "Regulatory and executive reporting matrix with compliance verification seals, generation tables, and export action bars",
          visualHierarchy: {
            primary: "PPA Generation Settlement Table",
            secondary: ["Compliance Metric Cards", "Export Options Toolbar"],
          },
          responsiveStrategy: "Condensed executive summary cards on mobile viewports",
          requiredCapabilities: ["compliance-report-matrix", "export-generation-engine"],
          forbiddenPatterns: ["monograph", "editorial publication", "building typology", "timber stone", "curatorial index", "crud forms"],
        };
      }

      const naturalTitle = titleHint || slug.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase());
      return {
        route,
        pageRole: `${naturalTitle} Renewable Operations Console`,
        purpose: `Dedicated operational console for ${naturalTitle} at ${brandName}`,
        experienceIntent: `Inspect renewable generation metrics and operational workflows for ${naturalTitle}`,
        focalElement: `Interactive ${naturalTitle} operations console and generation telemetry instrumentation`,
        composition: {
          topology: "FULL_BLEED_STAGE",
          layers: ["Operations Telemetry Canvas", "Instrumentation HUD", "Diagnostics Data Strip"],
          sections: [`${naturalTitle} Header & Core Telemetry`, `${naturalTitle} Subsystem Diagnostics`, "Operational Event Log"],
          dominantStructure: "DENSE_TELEMETRY_GRID",
        },
        interaction: {
          primary: [`Inspect ${naturalTitle} telemetry parameters`, `Adjust ${naturalTitle} operational filters`],
          secondary: ["Export diagnostics log", "View linked operational events"],
        },
        motion: {
          entrance: "rapid precision grid reveal and telemetry lock",
          scroll: "fixed command layout with high-density data scroll",
          transitions: ["instant view state transition"],
        },
        contentPresentation: `High-density clean energy console layout for ${naturalTitle} with monospace data indicators and status badges`,
        visualHierarchy: {
          primary: `${naturalTitle} Core Instrumentation`,
          secondary: ["Subsystem Readouts", "Diagnostics Log"],
        },
        responsiveStrategy: "Responsive command grid collapsing gracefully to single-column telemetry cards",
        requiredCapabilities: [`${slug}-telemetry-console`],
        forbiddenPatterns: ["monograph", "editorial publication", "building typology", "timber stone", "curatorial index", "crud forms"],
      };
    }

    // =========================================================================
    // GENRE: HIGH_DENSITY_CONSOLE & OPERATIONAL AEROSPACE / TELEMETRY
    // =========================================================================
    const isOperationalDomain = /\b(avionics|aerospace|aircraft|flight|aviation|cockpit|airframe|airspace|transponder|squawk|rnav|airway)\b/i.test(promptLower);

    if (isOperationalDomain) {
      if (route === "/" || slug === "home" || slug === "overview" || slug === "dashboard" || slug === "console") {
        return {
          route,
          pageRole: "Mission Telemetry Command & Avionics Flight Deck",
          purpose: `Central real-time operational command console for ${brandName} featuring live telemetry streams, flight vector HUD, and subsystem diagnostics`,
          experienceIntent: `Monitor real-time avionics telemetry, airspace navigation vectors, and aircraft subsystem statuses through high-density telemetry instrumentation`,
          focalElement: "Primary flight telemetry array with attitude indicator, altitude/airspeed tape, and high-frequency subsystem data streams",
          composition: {
            topology: "FULL_BLEED_STAGE",
            layers: ["Avionics Glass Cockpit Canvas", "Attitude & Vector HUD", "Flight Vector Telemetry Strip"],
            sections: ["Primary Flight Telemetry & Attitude Indicator", "Subsystem Diagnostics & Bus Health", "Active Airspace Fleet Roster"],
            dominantStructure: "DENSE_TELEMETRY_GRID",
          },
          interaction: {
            primary: ["Inspect real-time telemetry sensor channels and alert triggers", "Toggle attitude / heading / navigational vector displays"],
            secondary: ["Acknowledge operational subsystem alerts", "Switch active telemetry frequency stream"],
          },
          motion: {
            entrance: "rapid precision vector grid lock and live sensor stream calibration",
            scroll: "fixed cockpit telemetry layout with responsive metric grids",
            transitions: ["instant telemetry stream channel swap without layout shift"],
          },
          contentPresentation: "High-density dark avionics HUD interface with monospace numeric readouts, warning annunciators, and vector graphs",
          visualHierarchy: {
            primary: "Primary Flight Attitude & Vector HUD",
            secondary: ["Real-Time Sensor Bus Readouts", "Active Subsystem Diagnostics"],
          },
          responsiveStrategy: "Responsive command grid with collapsible telemetry rails on smaller screens",
          requiredCapabilities: ["telemetry-stream-grid", "flight-hud-canvas", "avionics-diagnostics"],
          forbiddenPatterns: ["monograph", "editorial publication", "building typology", "timber stone", "curatorial index", "magazine layout", "crud forms"],
        };
      }

      if (slug.includes("fleet") || slug.includes("aircraft") || slug.includes("plane") || slug.includes("asset")) {
        return {
          route,
          pageRole: "Airspace Fleet Operations & Aircraft Roster Ledger",
          purpose: `Active airspace fleet tracking for ${brandName} with transponder metrics, squawk codes, flight hour ledgers, and airframe telemetry`,
          experienceIntent: `Inspect active aircraft in flight, monitor airframe health metrics, and review fleet readiness telemetry`,
          focalElement: "Airspace fleet tracking radar with aircraft transponder metrics, tail registries, and airframe diagnostics",
          composition: {
            topology: "FULL_BLEED_STAGE",
            layers: ["Airspace Radar Canvas", "Fleet Registry Ledger", "Airframe Health HUD"],
            sections: ["Airspace Fleet Overview & Status Matrix", "Aircraft Registry & Transponder Ledger", "Airframe Maintenance Diagnostics"],
            dominantStructure: "DENSE_TELEMETRY_GRID",
          },
          interaction: {
            primary: ["Select aircraft to inspect live telemetry and transponder metrics", "Filter fleet by operational status (Airborne, Grounded, Maintenance)"],
            secondary: ["Review maintenance hours and airframe logs", "Track flight route corridor"],
          },
          motion: {
            entrance: "staggered transponder lock and fleet ledger draw-in",
            scroll: "smooth high-density ledger scrolling",
            transitions: ["aircraft telemetry inspector drawer reveal"],
          },
          contentPresentation: "Precision airspace operations ledger with monospace registration tags, squawk indicators, and operational status pills",
          visualHierarchy: {
            primary: "Active Fleet Tracking Ledger",
            secondary: ["Selected Aircraft Transponder Metrics", "Fleet Readiness Summary"],
          },
          responsiveStrategy: "Stacked fleet card stream on mobile viewports with quick-filter chips",
          requiredCapabilities: ["fleet-telemetry-ledger", "airspace-transponder-radar"],
          forbiddenPatterns: ["monograph", "editorial publication", "building typology", "timber stone", "curatorial index", "crud forms"],
        };
      }

      if (slug.includes("telemetry") || slug.includes("sensor") || slug.includes("metric") || slug.includes("stream")) {
        return {
          route,
          pageRole: "Real-Time Telemetry Stream & Flight Data Recorder",
          purpose: `High-frequency sensor bus telemetry stream for ${brandName} monitoring attitude, heading, barometric altitude, and bus voltages`,
          experienceIntent: `Analyze high-frequency telemetry channels, inspect parameter waveforms, and monitor subsystem health thresholds`,
          focalElement: "Live oscilloscope waveform canvas paired with high-frequency telemetry parameter matrix and alarm annunciators",
          composition: {
            topology: "FULL_BLEED_STAGE",
            layers: ["Sensor Waveform Surface", "Telemetry Parameter HUD", "Subsystem Bus Matrix"],
            sections: ["High-Frequency Bus Stream & Heading Tape", "Sensor Parameter Matrix", "Flight Telemetry Alarms"],
            dominantStructure: "DENSE_TELEMETRY_GRID",
          },
          interaction: {
            primary: ["Switch telemetry sensor channels (Attitude, Gyro, Barometric, Bus Power)", "Tune waveform sample frequency and trigger thresholds"],
            secondary: ["Export telemetry blackbox stream", "Inspect parameter excursion timestamps"],
          },
          motion: {
            entrance: "high-frequency waveform sweep and live ticker lock",
            scroll: "fixed telemetry console view",
            transitions: ["instant channel modulation with zero layout jump"],
          },
          contentPresentation: "Precision avionics instrumentation display with green/amber/red threshold status and monospace hex/numeric readouts",
          visualHierarchy: {
            primary: "Live Sensor Waveform Canvas",
            secondary: ["Telemetry Parameter Table", "Active Alarms Strip"],
          },
          responsiveStrategy: "Compact parameter grid with swipeable sensor channels on mobile",
          requiredCapabilities: ["waveform-stream-canvas", "telemetry-parameter-grid"],
          forbiddenPatterns: ["monograph", "editorial publication", "building typology", "timber stone", "curatorial index", "crud forms"],
        };
      }

      if (slug.includes("flight") || slug.includes("route") || slug.includes("mission") || slug.includes("plan") || slug.includes("nav")) {
        return {
          route,
          pageRole: "Flight Plan Routing & Waypoint Navigation Console",
          purpose: `Interactive flight routing console for ${brandName} featuring RNAV airway corridors, waypoint sequences, and fuel burn diagnostics`,
          experienceIntent: `Plan and inspect active flight trajectories, verify airway waypoints, and review fuel burn calculations`,
          focalElement: "Airway navigation corridor map with clickable waypoints, flight altitude profiles, and RNAV fixes",
          composition: {
            topology: "FULL_BLEED_STAGE",
            layers: ["Navigation Corridor Canvas", "Waypoint Sequence HUD", "Fuel & Clearance Panel"],
            sections: ["Active Flight Route & Trajectory Profile", "Waypoint Sequence Ledger", "Fuel Burn & Airspace Clearance Diagnostics"],
            dominantStructure: "DENSE_TELEMETRY_GRID",
          },
          interaction: {
            primary: ["Inspect airway waypoints and calculate leg distance / ETA", "Toggle altitude flight profile (Climb, Cruise, Descent)"],
            secondary: ["Export flight plan dispatch manifest", "Verify airspace clearance status"],
          },
          motion: {
            entrance: "route vector draw-in and waypoint lock",
            scroll: "smooth navigation map pan and zoom",
            transitions: ["waypoint inspector drawer slide"],
          },
          contentPresentation: "Aeronautical navigation console with vector airway routes, ICAO waypoint identifiers, and flight parameter badges",
          visualHierarchy: {
            primary: "Airway Route Vector Map",
            secondary: ["Waypoint Sequence Ledger", "Flight Clearance Diagnostics"],
          },
          responsiveStrategy: "Full-width route map adapting to stacked waypoint steps on small screens",
          requiredCapabilities: ["flight-route-map", "waypoint-sequence-engine"],
          forbiddenPatterns: ["monograph", "editorial publication", "building typology", "timber stone", "curatorial index", "crud forms"],
        };
      }

      // Operational domain fallback for any other route
      const naturalTitle = titleHint || slug.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase());
      const roleSuffix = isOperationalDomain ? "Telemetry & Operations Console" : "Operations Console";
      return {
        route,
        pageRole: `${naturalTitle} ${roleSuffix}`,
        purpose: `Dedicated operational telemetry console for ${naturalTitle} at ${brandName}`,
        experienceIntent: `Inspect operational parameters and real-time instrumentation for ${naturalTitle}`,
        focalElement: `Interactive ${naturalTitle} operations console and high-density telemetry instrumentation`,
        composition: {
          topology: "FULL_BLEED_STAGE",
          layers: ["Operations Telemetry Canvas", "Instrumentation HUD", "Diagnostics Data Strip"],
          sections: [`${naturalTitle} Header & Core Telemetry`, `${naturalTitle} Subsystem Diagnostics`, "Operational Event Log"],
          dominantStructure: "DENSE_TELEMETRY_GRID",
        },
        interaction: {
          primary: [`Inspect ${naturalTitle} telemetry parameters`, `Adjust ${naturalTitle} operational filters`],
          secondary: ["Export diagnostics log", "View linked operational events"],
        },
        motion: {
          entrance: "rapid precision grid reveal and telemetry lock",
          scroll: "fixed command layout with high-density data scroll",
          transitions: ["instant view state transition"],
        },
        contentPresentation: isOperationalDomain
          ? `High-density avionics console layout for ${naturalTitle} with monospace data indicators and status badges`
          : `High-density operations console layout for ${naturalTitle} with data indicators and status badges`,
        visualHierarchy: {
          primary: `${naturalTitle} Core Instrumentation`,
          secondary: ["Subsystem Readouts", "Diagnostics Log"],
        },
        responsiveStrategy: "Responsive command grid collapsing gracefully to single-column telemetry cards",
        requiredCapabilities: [`${slug}-telemetry-console`],
        forbiddenPatterns: ["monograph", "editorial publication", "building typology", "timber stone", "curatorial index", "crud forms"],
      };
    }

    // =========================================================================
    // GENRE 2: EDITORIAL_PUBLICATION (e.g. Architecture Journal or Culinary Magazine)
    // =========================================================================
    const isArchPublication =
      !isOperationalDomain &&
      !/\b(software architecture|system architecture|data architecture|application architecture|required by the architecture|backend architecture|cloud architecture)\b/i.test(promptLower) &&
      /\b(architectural\s+(?:monograph|journal|review|digest|firm|studio|practice|portfolio|criticism)|architecture\s+(?:firm|studio|monograph|journal|magazine|exhibition)|building\s+typolog(?:y|ies)|spatial\s+(?:monograph|essay)|tectonic\s+journal)\b/i.test(promptLower);

    if (genre === "EDITORIAL_PUBLICATION" || isArchPublication || isCulinary) {
      if (route === "/" || slug === "home" || slug === "monograph") {
        if (isCulinary) {
          return {
            route,
            pageRole: "Culinary Monograph Cover & Epicurean Opening Feature",
            purpose: `Curated gastronomic visual essay for ${brandName} with artisanal food photography, seasonal harvest notes, and culinary narratives`,
            experienceIntent: `Present the epicurean thesis of ${brandName} through curated typography, terroir imagery, and seasonal stories`,
            focalElement: "Monumental serif masthead, seasonal issue stamp, and lead gastronomic essay with terroir photography",
            composition: {
              topology: "EDITORIAL_SPREAD",
              layers: ["Textured Warm Paper Surface", "Heroic Editorial Typography", "Asymmetric Food Photography Grid"],
              sections: ["Epicurean Masthead & Monograph Opening", "Artisan Producer Pull-Quote & Food Study", "Curated Issue Gastronomic Index"],
              dominantStructure: "EDITORIAL_SPREAD",
            },
            interaction: {
              primary: ["Scroll-driven editorial reading progression", "Click to explore featured gastronomic stories"],
              secondary: ["Toggle typography scale (reading mode)", "Explore seasonal culinary features"],
            },
            motion: {
              entrance: "slow typographic reveal with subtle letter-spacing settle",
              scroll: "quiet parallax image drift",
              transitions: ["smooth chapter crossfade"],
            },
            contentPresentation: "Monograph layout with oversized serif headings, drop caps, and artisanal food photography",
            visualHierarchy: {
              primary: "Culinary Masthead & Cover Feature",
              secondary: ["Lead Gastronomic Essay", "Issue Terroir Metadata"],
            },
            responsiveStrategy: "Fluid column reduction with persistent masthead",
            requiredCapabilities: ["editorial-typography", "scroll-driven-storytelling"],
            forbiddenPatterns: ["search bar", "filter chips", "card grid", "crud forms"],
          };
        }

        return {
          route,
          pageRole: "Monograph Cover & Opening Essay",
          purpose: "Curated editorial visual essay with full-bleed monograph imagery, pull quotes, and chapter essays",
          experienceIntent: "Present the theoretical and physical thesis of the issue through oversized typography and architectural photography",
          focalElement: "Monumental serif headline, volume issue stamp, and lead essay monograph with reading time indicator",
          composition: {
            topology: "EDITORIAL_SPREAD",
            layers: ["Textured Warm Paper Surface", "Heroic Editorial Typography", "Asymmetric Photo Grid"],
            sections: ["Editorial Monograph Opening", "Manifesto Pull-Quote & Photo Split", "Curated Issue Volume Index"],
            dominantStructure: "EDITORIAL_SPREAD",
          },
          interaction: {
            primary: ["Scroll-driven editorial reading progression", "Click to enlarge monograph elevations"],
            secondary: ["Toggle typography scale (reading mode)", "Jump to theoretical chapter"],
          },
          motion: {
            entrance: "slow typographic reveal with subtle letter-spacing settle",
            scroll: "quiet parallax image drift",
            transitions: ["smooth chapter crossfade"],
          },
          contentPresentation: "Monograph layout with oversized serif headings, drop caps, and asymmetric architectural photography",
          visualHierarchy: {
            primary: "Monograph Headline & Cover Image",
            secondary: ["Lead Essay Paragraph", "Issue Metadata"],
          },
          responsiveStrategy: "Fluid column reduction with persistent masthead",
          requiredCapabilities: ["editorial-typography", "elevation-lightbox", "reading-progress-tracker"],
          forbiddenPatterns: ["search bar", "filter chips", "card grid", "crud forms"],
        };
      }

      // Culinary Traditions & Heritage Gastronomy
      if (isCulinary && (target.includes("tradition") || target.includes("heritage") || target.includes("history") || target.includes("ancestral") || target.includes("roots"))) {
        return {
          route,
          pageRole: "Culinary Traditions & Heritage Gastronomy Monograph",
          purpose: "In-depth documentation of ancestral cooking techniques, heirloom varieties, and regional gastronomy culture",
          experienceIntent: "Explore timeless culinary heritage, ancestral kitchen methods, and regional food culture preserved across generations",
          focalElement: "Ancestral gastronomy essay paired with heirloom ingredient profiles, artisan producer portraits, and oral history excerpts",
          composition: {
            topology: "EDITORIAL_SPREAD",
            layers: ["Heritage Archive Paper Surface", "Typographic Oral History Column", "Artisan Producer Roster"],
            sections: ["Heritage Monograph Header", "Ancestral Technique Deep Dive", "Heirloom Terroir Spec Sheet", "Oral History & Producer Profiles"],
            dominantStructure: "EDITORIAL_SPREAD",
          },
          interaction: {
            primary: ["Switch regional heritage tradition to inspect ancestral technique and artisan profile", "Filter traditions by historical era and terroir preservation status"],
            secondary: ["Inspect heirloom ingredient specifications", "Listen to oral culinary history audio excerpt"],
          },
          motion: {
            entrance: "slow fade-in with quote emphasis",
            scroll: "editorial column reading flow",
            transitions: ["heritage story crossfade and ingredient reveal"],
          },
          contentPresentation: "Heritage magazine spread with rich archival food photography, technique illustrations, and producer pull-quotes",
          visualHierarchy: {
            primary: "Heritage Narrative & Master Technique Focus",
            secondary: ["Heirloom Ingredient Specifications", "Artisan Producer Directory"],
          },
          responsiveStrategy: "Stacked technique study and oral history on mobile",
          requiredCapabilities: ["heritage-traditions-archive", "editorial-typography"],
          forbiddenPatterns: ["card grid", "search bar", "crud forms"],
        };
      }

      // Personal Saved Discoveries & Curated Collections (Culinary)
      if (isCulinary && (target.includes("saved") || target.includes("bookmark") || target.includes("favorite") || (target.includes("discover") && !target.includes("explore-culinary-destinations")))) {
        return {
          route,
          pageRole: "Personal Saved Discoveries & Curated Collections",
          purpose: "Personal hub organizing saved culinary stories, destination guides, recipes, and notes into custom folders",
          experienceIntent: "Manage saved discoveries, organize bookmarks into thematic folders, and access bookmarked articles and recipes offline",
          focalElement: "Curated collection folders hub with saved recipe cards, destination bookmarks, and custom notes drawer",
          composition: {
            topology: "EDITORIAL_SPREAD",
            layers: ["Collection Folders Bar", "Saved Items Grid", "Notes Drawer"],
            sections: ["Personal Discoveries Header", "Collection Filter Tabs (All, Recipes, Stories, Destinations)", "Saved Discovery Cards Grid", "Item Notes & Organize Modal"],
            dominantStructure: "CURATED_COLLECTION_SHOWCASE",
          },
          interaction: {
            primary: ["Filter saved items by category or custom folder", "Remove or re-categorize saved discoveries", "Add personal notes to bookmarked items"],
            secondary: ["Export curated collection", "Quick-navigate to original recipe or story"],
          },
          motion: {
            entrance: "staggered card reveal with folder tab transition",
            scroll: "smooth collection overview",
            transitions: ["filter tab switch and folder creation drawer"],
          },
          contentPresentation: "Clean magazine bookmark archive with editorial thumbnails, save timestamps, and folder categorization",
          visualHierarchy: {
            primary: "Saved Discovery Collection Grid",
            secondary: ["Folder Tabs", "Item Details & Notes"],
          },
          responsiveStrategy: "Adaptive multi-column card layout collapsing to single-column card stack on mobile",
          requiredCapabilities: ["collection-folder-manager", "discovery-bookmark-hub"],
          forbiddenPatterns: ["generic table", "generic search bar"],
        };
      }

      // Custom Culinary Itinerary & Journey Planner (Culinary)
      if (isCulinary && (target.includes("itinerary") || target.includes("planner") || target.includes("plan") || target.includes("trip") || target.includes("schedule") || target.includes("journey"))) {
        return {
          route,
          pageRole: "Custom Culinary Itinerary & Journey Planner",
          purpose: "Interactive multi-day journey builder scheduling dining reservations, food markets, artisan visits, and cooking workshops",
          experienceIntent: "Craft custom culinary travel itineraries with day-by-day scheduling, meal planning, and interactive timeline management",
          focalElement: "Multi-day timeline builder paired with day schedule tabs, culinary stop organizer, and journey notes",
          composition: {
            topology: "EDITORIAL_SPREAD",
            layers: ["Day Schedule Tabs", "Interactive Itinerary Timeline", "Add Stop Drawer"],
            sections: ["Itinerary Overview Header", "Day Selector & Timeline", "Scheduled Culinary Stops List", "Interactive Stop Builder & Notes"],
            dominantStructure: "CURATED_COLLECTION_SHOWCASE",
          },
          interaction: {
            primary: ["Switch itinerary days to inspect scheduled dining, market visits, and classes", "Add, edit, or remove culinary stops and adjust timing", "Reorder stops along the daily schedule"],
            secondary: ["Export itinerary summary or print guide", "Link saved destinations into itinerary"],
          },
          motion: {
            entrance: "timeline bar animation and day cards slide",
            scroll: "smooth day-to-day progression",
            transitions: ["day schedule crossfade and item insertion animation"],
          },
          contentPresentation: "Polished travel concierge spread with day timeline markers, reservation time chips, and culinary notes",
          visualHierarchy: {
            primary: "Day-by-Day Timeline",
            secondary: ["Culinary Stops & Schedule", "Trip Overview & Totals"],
          },
          responsiveStrategy: "Timeline sidebar beside day details on desktop; stacked day accordion on mobile",
          requiredCapabilities: ["interactive-itinerary-builder", "day-schedule-timeline"],
          forbiddenPatterns: ["generic table", "generic search bar"],
        };
      }

      // Culinary Destinations & Terroir Atlas (Culinary)
      if (isCulinary && (target.includes("destination") || target.includes("terroir") || target.includes("region") || target.includes("travel") || (target.includes("map") && !promptLower.includes("world")) || target.includes("guide"))) {
        return {
          route,
          pageRole: "Culinary Destination Explorer & Terroir Atlas",
          purpose: "Interactive regional destination atlas featuring terroir profiles, local markets, producer directories, and culinary highlights",
          experienceIntent: "Explore culinary landscapes across regions, discover terroir traditions, and inspect curated local dining spots",
          focalElement: "Interactive regional destination showcase paired with terroir profile cards, harvest indicators, and dining spots",
          composition: {
            topology: "EDITORIAL_SPREAD",
            layers: ["Regional Terroir Map", "Destination Detail Panel", "Local Highlights Grid"],
            sections: ["Regional Destination Header", "Terroir & Soil Profile Drawer", "Curated Local Dining & Markets", "Seasonal Harvest Notes"],
            dominantStructure: "CURATED_COLLECTION_SHOWCASE",
          },
          interaction: {
            primary: ["Select destination region to inspect terroir notes, culinary highlights, and local markets", "Filter destinations by season and culinary specialty"],
            secondary: ["Save destination to curated discoveries", "View detailed terroir soil and harvest calendar"],
          },
          motion: {
            entrance: "graceful fade and map elevation",
            scroll: "fluid regional exploration flow",
            transitions: ["region crossfade and detail panel reveal"],
          },
          contentPresentation: "High-end editorial atlas with regional photography, terroir maps, and curated culinary recommendations",
          visualHierarchy: {
            primary: "Regional Terroir Focus",
            secondary: ["Local Food Highlights", "Producer Profiles"],
          },
          responsiveStrategy: "Responsive region grid with drawer detail on mobile",
          requiredCapabilities: ["destination-explorer", "regional-guide-drawer"],
          forbiddenPatterns: ["generic table", "crud table with Add Item", "generic search bar"],
        };
      }

      // Curated Recipe Collection & Kitchen Companion
      if (target.includes("recipe") || target.includes("kitchen") || target.includes("dish") || target.includes("cook")) {
        return {
          route,
          pageRole: "Curated Recipe Collection & Kitchen Companion",
          purpose: "Refined culinary recipe collection featuring ingredient proportions, serving scaler, and step-by-step masterclass cooking mode",
          experienceIntent: "Browse seasonal recipes, scale serving proportions dynamically, and switch to focused step-by-step kitchen mode",
          focalElement: "Featured recipe showcase paired with serving scaler, ingredient taxonomy, and cooking mode controller",
          composition: {
            topology: "EDITORIAL_SPREAD",
            layers: ["Featured Recipe Spread", "Ingredient Scaler Panel", "Method Stepper Modal"],
            sections: ["Curated Recipe Collection Header", "Recipe Filter Tabs (Season, Difficulty)", "Recipe Detail Showcase with Scaler", "Kitchen Companion Method Stepper"],
            dominantStructure: "CURATED_COLLECTION_SHOWCASE",
          },
          interaction: {
            primary: ["Select recipe to view ingredients and culinary narrative", "Scale serving size to adjust ingredient amounts dynamically", "Launch step-by-step cooking mode"],
            secondary: ["Bookmark recipe to personal saved discoveries", "Filter recipes by course or seasonal harvest"],
          },
          motion: {
            entrance: "subtle recipe card cascade and typography reveal",
            scroll: "smooth collection reading flow",
            transitions: ["recipe detail drawer transition and scaler animation"],
          },
          contentPresentation: "Editorial cookbook spread with artisan photography, scaled ingredient tables, and chef technique callouts",
          visualHierarchy: {
            primary: "Featured Recipe Presentation",
            secondary: ["Ingredient Proportions & Scaler", "Preparation Method Stepper"],
          },
          responsiveStrategy: "Full-bleed recipe hero with sticky ingredient sidebar on desktop, collapsible on mobile",
          requiredCapabilities: ["recipe-scaler", "cooking-mode-stepper"],
          forbiddenPatterns: ["crud table with Add Item", "generic search bar"],
        };
      }

      // Architectural Case Studies (Non-culinary)
      if (!isCulinary && (target.includes("case-stud") || target.includes("project"))) {
        return {
          route,
          pageRole: "Monograph Case Studies & Tectonic Blueprints",
          purpose: "In-depth project case studies with architectural drawings, spatial essays, and technical specifications",
          experienceIntent: "Inspect tectonic joints, structural load distributions, and material resonance across seminal buildings",
          focalElement: "Full-screen case study showcase with technical elevation drawings, material index, and structural narrative",
          composition: {
            topology: "ASYMMETRIC_TECTONIC_STUDY",
            layers: ["Architectural Blueprint Background", "Technical Elevation Viewer", "Material Specification Panel"],
            sections: ["Featured Case Study Spread", "Elevation Drawing Deep Dive", "Materiality & Joinery Index", "Case Study Folio Selector"],
            dominantStructure: "ASYMMETRIC_TECTONIC_STUDY",
          },
          interaction: {
            primary: ["Select project to switch full-screen case study and blueprint drawings", "Toggle between photograph, technical elevation, and structural section"],
            secondary: ["Inspect material specification table", "Download architectural dossier"],
          },
          motion: {
            entrance: "precise grid line drawing animation",
            scroll: "horizontal blueprint pan and vertical narrative scroll",
            transitions: ["technical elevation crossfade"],
          },
          contentPresentation: "Architectural monograph spread with blueprint overlays, dimension annotations, and materiality analysis",
          visualHierarchy: {
            primary: "Technical Elevation Viewer",
            secondary: ["Project Monograph Text", "Material Specs Drawer"],
          },
          responsiveStrategy: "Stacked blueprint-above-narrative layout on mobile",
          requiredCapabilities: ["blueprint-viewer", "elevation-toggle", "case-study-switcher"],
          forbiddenPatterns: ["generic card directory", "search input", "filter buttons", "crud forms"],
        };
      }

      // Editorial Photo Essays / Critical Discourse / Stories
      if (target.includes("essay") || target.includes("visual") || target.includes("story") || target.includes("editorial") || target.includes("article") || target.includes("feature")) {
        return {
          route,
          pageRole: isCulinary ? "Editorial Monograph & Regional Food Stories" : "Scroll-Driven Visual Photo Essay & Critical Discourse",
          purpose: isCulinary ? "Cinematic culinary journalism with full-bleed artisan photography, chef field notes, and immersive food narratives" : "Cinematic scrollytelling visual essay with full-bleed photographs, pull-quotes, and chapter transitions",
          experienceIntent: isCulinary ? "Engage with regional food culture and culinary journalism through immersive scroll-linked storytelling" : "Engage with theoretical criticism and high-resolution spatial essays through scroll-coupled layout shifts",
          focalElement: isCulinary ? "Hero full-bleed culinary documentary photograph paired with artisan pull-quote and harvest chronicle" : "Hero full-bleed architectural photograph paired with dramatic pull-quote and scroll-linked chapter progression",
          composition: {
            topology: "SCROLL_VISUAL_ESSAY",
            layers: ["Full-Bleed Architectural Photography", "Typographic Essay Column", "Marginalia Footnotes"],
            sections: ["Visual Essay Monograph Opening", "Full-Bleed Image & Quote Split", "Analytical Narrative with Marginalia", "Curated Archival Folio"],
            dominantStructure: "SCROLL_VISUAL_ESSAY",
          },
          interaction: {
            primary: ["Scroll-linked image transitions and quote reveals", "Click image to open high-resolution photography lightbox"],
            secondary: ["Expand marginalia citations", "Share critical essay excerpt"],
          },
          motion: {
            entrance: "gentle image zoom and subtle typography rise",
            scroll: "continuous scroll-linked image scaling and text pinning",
            transitions: ["chapter wipe with quote emphasis"],
          },
          contentPresentation: "High-end publication spread with full-bleed photographs, bold italic pull-quotes, and marginalia annotations",
          visualHierarchy: {
            primary: "Full-Bleed Photography Spread",
            secondary: ["Dramatic Pull Quote", "Typographic Essay Body"],
          },
          responsiveStrategy: "Full-width photography with inline quotes and bottom-docked marginalia",
          requiredCapabilities: ["scroll-driven-storytelling", "photography-lightbox", "editorial-typography"],
          forbiddenPatterns: ["card grid", "search bar", "filter pills", "crud forms"],
        };
      }

      // Architect Dialogues & Practitioner Monologues (Non-culinary)
      if (!isCulinary && (target.includes("architect") || target.includes("dialogue") || target.includes("profile"))) {
        return {
          route,
          pageRole: "Architect Dialogues & Practitioner Monologues",
          purpose: "In-depth conversations with visionary architects and spatial practitioners with portrait studies and manifesto transcripts",
          experienceIntent: "Read theoretical exchanges between master practitioners with verbatim transcripts and marginalia philosophy",
          focalElement: "Architect portrait study paired with dialogue excerpt and manifesto declaration",
          composition: {
            topology: "EDITORIAL_SPREAD",
            layers: ["Portrait Monolith", "Dialogue Transcript Grid", "Practitioner Archive Drawer"],
            sections: ["Featured Dialogue Header", "Architect Manifesto Quote", "Exchange Transcript (Interviewer & Architect)", "Practitioner Directory Index"],
            dominantStructure: "EDITORIAL_SPREAD",
          },
          interaction: {
            primary: ["Switch architect to update dialogue transcript, portrait, and manifesto quote", "Filter dialogue by theoretical theme (Atmosphere, Tectonics, Materiality)"],
            secondary: ["Inspect architect monograph bibliography", "Listen to audio conversation excerpt"],
          },
          motion: {
            entrance: "fade in with quote emphasis",
            scroll: "editorial column reading flow",
            transitions: ["portrait crossfade and dialogue text transition"],
          },
          contentPresentation: "Interview spread with large portrait photography, speaker initials, and highlighted pull-quotes",
          visualHierarchy: {
            primary: "Architect Portrait & Manifesto Quote",
            secondary: ["Dialogue Exchange Transcript", "Practitioner Roster"],
          },
          responsiveStrategy: "Stacked portrait and dialogue column with sticky speaker indicator",
          requiredCapabilities: ["architect-dialogue-switcher", "manifesto-viewer"],
          forbiddenPatterns: ["card grid", "search bar", "crud forms"],
        };
      }

      // Archival Folio - Culinary Fallback
      if (isCulinary) {
        return {
          route,
          pageRole: "Culinary Travel Publication Folio & Issue Archive",
          purpose: "Chronological edition catalog, back-issue folio, and regional culinary dispatch index",
          experienceIntent: "Browse seminal publication volumes, artisan photography, and curated gastronomic dispatches",
          focalElement: "Curated culinary publication folio index with issue volumes, regional harvest markers, and gastronomical essays index",
          composition: {
            topology: "EDITORIAL_SPREAD",
            layers: ["Archival Grid", "Issue Folio Details", "Regional Guide Drawer"],
            sections: ["Chronological Issue Header", "Issue Volume Folio List", "Regional Gastronomy Matrix", "Curatorial Food Bibliography"],
            dominantStructure: "CURATED_COLLECTION_SHOWCASE",
          },
          interaction: {
            primary: ["Select issue volume to view archival spread and culinary table of contents", "Filter archive by culinary region (Mediterranean, Alpine, Coastal)"],
            secondary: ["Download issue index PDF", "Inspect seasonal gastronomy calendar"],
          },
          motion: {
            entrance: "staggered folio listing appearance",
            scroll: "smooth archive index browsing",
            transitions: ["issue spread reveal"],
          },
          contentPresentation: "Typographic folio table and editorial index with volume stamps and issue dates",
          visualHierarchy: {
            primary: "Issue Folio Spread",
            secondary: ["Regional Gastronomy Matrix", "Publication Bibliography"],
          },
          responsiveStrategy: "Compact issue listing with expandable details accordion",
          requiredCapabilities: ["archive-folio-viewer", "regional-guide-drawer"],
          forbiddenPatterns: ["crud table with Add Item", "generic search bar", "crud forms"],
        };
      }

      // Archival Folio - Architectural Fallback
      return {
        route,
        pageRole: "Publication Folio Archive & Curatorial Index",
        purpose: "Chronological edition catalog, back-issue folio, and building typology index",
        experienceIntent: "Browse seminal publication volumes, archival photography, and curated architectural typologies",
        focalElement: "Curated publication folio index with issue volumes, typology markers, and architectural drawings index",
        composition: {
          topology: "EDITORIAL_SPREAD",
          layers: ["Archival Grid", "Issue Folio Details", "Typology Index Drawer"],
          sections: ["Chronological Issue Header", "Issue Volume Folio List", "Building Typology Matrix", "Curatorial Bibliography"],
          dominantStructure: "CURATED_COLLECTION_SHOWCASE",
        },
        interaction: {
          primary: ["Select issue volume to view archival spread and table of contents", "Filter archive by typology (Timber, Stone, Post-Industrial)"],
          secondary: ["Download issue index PDF", "Inspect building chronologies"],
        },
        motion: {
          entrance: "staggered folio listing appearance",
          scroll: "smooth archive index browsing",
          transitions: ["issue spread reveal"],
        },
        contentPresentation: "Typographic folio table and editorial index with volume stamps and issue dates",
        visualHierarchy: {
          primary: "Issue Folio Spread",
          secondary: ["Typology Matrix", "Publication Bibliography"],
        },
        responsiveStrategy: "Compact issue listing with expandable details accordion",
        requiredCapabilities: ["archive-folio-viewer", "typology-filter-engine"],
        forbiddenPatterns: ["crud table with Add Item", "generic search bar", "crud forms"],
      };
    }



    // =========================================================================
    // GENRE 4: DYNAMIC_BESPOKE (General products with tailored route designs)
    // =========================================================================
    if (slug.includes("quest") || slug.includes("map") || slug.includes("world") || slug.includes("dive") || slug.includes("trail") || slug.includes("waypoint")) {
      return this.deriveRoutePlan(route, slug, "SPATIAL_WORLD", promptLower, identity, capabilityPlan, titleHint);
    }
    if (slug.includes("sound") || slug.includes("audio") || slug.includes("atmosphere") || slug.includes("freq") || slug.includes("music")) {
      return this.deriveRoutePlan(route, slug, "SPATIAL_WORLD", promptLower, identity, capabilityPlan, titleHint);
    }
    if (slug.includes("story") || slug.includes("narrative") || slug.includes("journey") || slug.includes("adventure") || slug.includes("chronicle") || slug.includes("history") || slug.includes("mission") || slug.includes("essay") || slug.includes("expedition")) {
      return this.deriveRoutePlan(route, slug, "SPATIAL_WORLD", promptLower, identity, capabilityPlan, titleHint);
    }
    if (slug.includes("character") || slug.includes("companion") || slug.includes("avatar") || slug.includes("specimen") || slug.includes("species") || slug.includes("creature")) {
      return this.deriveRoutePlan(route, slug, "SPATIAL_WORLD", promptLower, identity, capabilityPlan, titleHint);
    }

    const naturalTitle = titleHint || slug.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase());

    return {
      route,
      pageRole: `${naturalTitle} Experience Surface`,
      purpose: `Bespoke interactive experience for ${naturalTitle}, tailored to ${brandName}`,
      experienceIntent: `Engage with ${naturalTitle} through purposeful domain-native interactions and visual hierarchy`,
      focalElement: `Prominent ${naturalTitle} interaction stage and primary focal surface`,
      composition: {
        topology: "BESPOKE_CANVAS",
        layers: ["Brand Aesthetic Surface", "Primary Feature Interaction Stage", "Contextual Information Layer"],
        sections: [`${naturalTitle} Primary Stage`, `${naturalTitle} Inspection & Actions`, "Supporting Context & Details"],
        dominantStructure: "BESPOKE_CANVAS",
      },
      interaction: {
        primary: [`Interact with ${naturalTitle} controls`, `Toggle ${naturalTitle} parameters`],
        secondary: ["Inspect details", "View summary breakdown"],
      },
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
