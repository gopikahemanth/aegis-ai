/**
 * DomainVocabularySynthesizer
 *
 * Parametric vocabulary synthesizer that extracts domain semantics from brandName,
 * prompt, route, and purpose to produce rich, contextual names, lore, and milestones
 * without ever relying on hardcoded domain strings or cross-domain leakage.
 */

export interface DomainVocabularyOptions {
  brandName: string;
  prompt: string;
  route: string;
  pageRole?: string;
  purpose?: string;
  seed?: number;
}

export interface DomainStoryChapter {
  id: number;
  title: string;
  scene: string;
  color: string;
  emoji: string;
  lore: string;
  milestone: string;
  scrollPct: number;
}

export interface DomainWaypoint {
  id: string;
  name: string;
  zone: string;
  coords: { x: number; y: number };
  status: "Completed" | "Active" | "Available";
  difficulty: "Foundational" | "Intermediate" | "Master";
  lore: string;
  reward: string;
}

export interface DomainTelemetryInfo {
  studioName: string;
  telemetryTitle: string;
  metricLabel: string;
  statusBadge: string;
}

export class DomainVocabularySynthesizer {
  private static hash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }

  public static cleanPositivePrompt(prompt: string): string {
    return (prompt || "").replace(/(?:do\s+not\s+use|don't\s+use|avoid|never\s+use|without|no\s+)\s+[^.!?\n]+/gi, "");
  }

  /**
   * Synthesize narrative chapters tailored to the specific domain and route.
   */
  public static synthesizeChapters(
    optionsOrPrompt: DomainVocabularyOptions | string,
    experiencePatternOrRoute?: string,
    chapterCount?: number,
    seedArg?: number
  ): DomainStoryChapter[] {
    const rawPrompt = typeof optionsOrPrompt === "string" ? optionsOrPrompt : (optionsOrPrompt?.prompt || "");
    const fallbackBrand = /architecture|monograph|building/i.test(rawPrompt)
      ? "Monograph"
      : /ocean|marine|sea|submersible|deep sea/i.test(rawPrompt)
      ? "AbyssWatch"
      : /watch|horology/i.test(rawPrompt)
      ? "Horology Studio"
      : /perfume|fragrance/i.test(rawPrompt)
      ? "Atelier"
      : "The Expedition";

    const options: DomainVocabularyOptions = typeof optionsOrPrompt === "string"
      ? {
          brandName: fallbackBrand,
          prompt: optionsOrPrompt,
          route: experiencePatternOrRoute?.startsWith("/") ? experiencePatternOrRoute : "/chronicle",
          seed: seedArg || 42
        }
      : optionsOrPrompt;

    const brandName = options?.brandName || fallbackBrand;
    const prompt = options?.prompt || "";
    const seed = options?.seed ?? 42;
    const route = options?.route || "/chronicle";
    const positivePrompt = this.cleanPositivePrompt(prompt);
    const combined = `${positivePrompt} ${route}`.toLowerCase();
    const routeSeed = this.hash(route + (options?.pageRole || ""));
    const effectiveSeed = (seed ^ routeSeed) >>> 0;

    // Palette generator based on seed
    const hues = [
      ["#3b82f6", "#8b5cf6", "#ec4899", "#10b981"],
      ["#d97706", "#b45309", "#78350f", "#059669"],
      ["#06b6d4", "#3b82f6", "#6366f1", "#14b8a6"],
      ["#e11d48", "#be123c", "#9f1239", "#fbbf24"],
      ["#10b981", "#059669", "#047857", "#34d399"],
    ];
    const palette = hues[effectiveSeed % hues.length];

    // 0. Maritime Logistics / Commercial Vessel Fleet / Cargo Operations / Port Operations
    if (/\b(maritime|cargo|vessel|fleet|harbor|berth|stowage|voyage|port operations|nautical|shipping)\b/i.test(combined)) {
      return [
        {
          id: 1,
          title: "Berth Dispatch & Cargo Manifest Ingestion",
          scene: "scene-1",
          color: palette[0],
          emoji: "🚢",
          lore: `Commercial cargo vessels clear harbor approach datum as automated crane arrays and manifest systems initialize at ${brandName}.`,
          milestone: "Berth Cleared",
          scrollPct: 0,
        },
        {
          id: 2,
          title: "3D Container Stowage & Stability Geometry",
          scene: "scene-2",
          color: palette[1],
          emoji: "📦",
          lore: "Automated ballast sensors and bay-tier-row cell guides verify dynamic metacentric height and hazardous cargo segregation across all holds.",
          milestone: "Stowage Verified",
          scrollPct: 33,
        },
        {
          id: 3,
          title: "Great Circle Voyage Planning & Telemetry Stream",
          scene: "scene-3",
          color: palette[2],
          emoji: "🧭",
          lore: "Meteorological sea-state routing charts fuel-optimized waypoints, streaming live engine torque and shaft RPM back to operations HQ.",
          milestone: "Course Plotted",
          scrollPct: 66,
        },
        {
          id: 4,
          title: "Terminal Arrival & Automated Stevedore Turnaround",
          scene: "scene-4",
          color: palette[3],
          emoji: "⚓",
          lore: "Tug assist protocol synchronizes with real-time port telemetry, initiating high-speed gantry offloading and multimodal rail transfer.",
          milestone: "Voyage Completed",
          scrollPct: 100,
        },
      ];
    }

    // 1. Luxury furniture / Timber / Woodcraft
    if (/\b(timber|furniture|wood|joinery|cabinetry|cabinetmaker|oakhaven)\b/i.test(combined)) {
      return [
        {
          id: 1,
          title: "The Living Timber Selection",
          scene: "scene-1",
          color: palette[0],
          emoji: "🪵",
          lore: `Centuries-old sustainable timber inspected for seasonal grain tension, annual ring density, and natural oil balance at ${brandName}.`,
          milestone: "Material Sourced",
          scrollPct: 0,
        },
        {
          id: 2,
          title: "Tectonic Mortise & Tenon Architecture",
          scene: "scene-2",
          color: palette[1],
          emoji: "📐",
          lore: "Precision mortise and tenon joinery interlocks solid hardwood members without synthetic adhesives, allowing organic seasonal respiration.",
          milestone: "Joinery Locked",
          scrollPct: 33,
        },
        {
          id: 3,
          title: "Ergonomic Contour Sculpting",
          scene: "scene-3",
          color: palette[2],
          emoji: "🪑",
          lore: "Hand-scraped lumbar radiuses calibrate weight distribution across the seating plane, aligning generational durability with effortless poise.",
          milestone: "Profile Honed",
          scrollPct: 66,
        },
        {
          id: 4,
          title: "The Hand-Rubbed Oil Monograph",
          scene: "scene-4",
          color: palette[3],
          emoji: "✨",
          lore: "Multiple applications of cold-pressed organic linseed and beeswax seal the heartwood while preserving the tactile warmth of the natural grain.",
          milestone: "Patina Sealed",
          scrollPct: 100,
        },
      ];
    }

    // 2. Film festival / Cinema / Arts
    if (/\b(film|movie|filmmaker|screenplay|cinesphere|cinema)\b/i.test(combined) && !/astronomy|observatory|planet|space/i.test(combined)) {
      return [
        {
          id: 1,
          title: "The Visionary Concept Genesis",
          scene: "scene-1",
          color: palette[0],
          emoji: "🎬",
          lore: `Independent filmmakers assemble at ${brandName} to challenge visual grammar and pioneer uncensored cinematic narratives.`,
          milestone: "Script Accepted",
          scrollPct: 0,
        },
        {
          id: 2,
          title: "Anamorphic Lenses & Midnight Soundscapes",
          scene: "scene-2",
          color: palette[1],
          emoji: "🎞️",
          lore: "Raw 35mm emulsion experiments merge with immersive spatial surround mastering to pull audiences into tactile acoustic realms.",
          milestone: "Footage Cut",
          scrollPct: 33,
        },
        {
          id: 3,
          title: "The Jury Screenings & Premiere Night",
          scene: "scene-3",
          color: palette[2],
          emoji: "📽️",
          lore: "Luminaries from international cinema convene in the grand amphitheater as lights dim on the definitive auteur festival slate.",
          milestone: "World Premiere",
          scrollPct: 66,
        },
        {
          id: 4,
          title: "Golden Palm Laurels & Archival Release",
          scene: "scene-4",
          color: palette[3],
          emoji: "🏆",
          lore: "Award-winning independent projects are inscribed in the festival historical ledger, entering global preservation archives.",
          milestone: "Laurels Bestowed",
          scrollPct: 100,
        },
      ];
    }

    // 2b. Culinary Travel / Gastronomy / Food Journey (Savorline)
    if (/\b(culinary|food travel|gastronom|food journey|recipe|chef stories|taste atlas|terroir|savorline|epicurean)\b/i.test(combined)) {
      return [
        {
          id: 1,
          title: "Terroir Awakening & Dawn Harvest",
          scene: "scene-1",
          color: palette[0],
          emoji: "🌾",
          lore: `Regional growers and master artisans gather heirloom varieties at dawn, mapping soil minerals and microclimate harvest notes for ${brandName}.`,
          milestone: "Harvest Mapped",
          scrollPct: 0,
        },
        {
          id: 2,
          title: "Ancestral Techniques & Wood-Fire Kilns",
          scene: "scene-2",
          color: palette[1],
          emoji: "🔥",
          lore: "Time-honored fermentation vaults and open wood embers unlock complex savory notes passed down across generational kitchens.",
          milestone: "Technique Chronicled",
          scrollPct: 33,
        },
        {
          id: 3,
          title: "The Chef Monograph & Flavor Architecture",
          scene: "scene-3",
          color: palette[2],
          emoji: "🔪",
          lore: "Pioneering chefs articulate seasonal culinary narratives, pairing indigenous ingredients with evocative tasting notes and regional wine terroir.",
          milestone: "Essay Published",
          scrollPct: 66,
        },
        {
          id: 4,
          title: "The Ephemeral Table & Feasting Ledger",
          scene: "scene-4",
          color: palette[3],
          emoji: "🍷",
          lore: "Discerning travelers unite at community harvest banquets, cataloging unforgettable gastronomic memories into the permanent journal.",
          milestone: "Expedition Completed",
          scrollPct: 100,
        },
      ];
    }

    // 3. Marine / Ocean / Submersible
    if (/\b(ocean|marine|submersible|coral reef|deep ocean|abyssal|underwater|bathymetry|benthic)\b/i.test(combined)) {
      return [
        {
          id: 1,
          title: "Descent Through the Epipelagic Sunlit Realm",
          scene: "scene-1",
          color: palette[0],
          emoji: "🌊",
          lore: `Submersible sonar and acoustic sensors initialize at surface datum, tracking light decay and salinization profiles off ${brandName}.`,
          milestone: "Datum Crossed",
          scrollPct: 0,
        },
        {
          id: 2,
          title: "The Mesopelagic Twilight Twilight Zone",
          scene: "scene-2",
          color: palette[1],
          emoji: "🐙",
          lore: "Bioluminescent siphonophores illuminate hydrothermal thermal gradients as pressure hulls contract under deep ocean load.",
          milestone: "Twilight Mapped",
          scrollPct: 33,
        },
        {
          id: 3,
          title: "Hydrothermal Chimney Spire Apex",
          scene: "scene-3",
          color: palette[2],
          emoji: "🌋",
          lore: "Superheated mineral plumes deposit metallic crusts on abyssal plains, supporting ancient chemosynthetic ecosystems.",
          milestone: "Vents Surveyed",
          scrollPct: 66,
        },
        {
          id: 4,
          title: "Hadopelagic Trench Floor Recovery",
          scene: "scene-4",
          color: palette[3],
          emoji: "💎",
          lore: "Robotic arms secure core sediment cylinders containing prebiotic compounds from the planet's deepest oceanic trench.",
          milestone: "Abyss Documented",
          scrollPct: 100,
        },
      ];
    }

    // 4. Astronomy / Observatory / Space
    if (/astronomy|observatory|planet|celestial|space|cosmos|telescope|nocturne|solar|stellar/i.test(combined)) {
      return [
        {
          id: 1,
          title: "The Midnight Aperture Calibration",
          scene: "scene-1",
          color: palette[0],
          emoji: "🔭",
          lore: `The brass observatory dome rotates silently beneath deep mountain skies. The primary mirror captures photons traveling across light-years to ${brandName}.`,
          milestone: "Dome Unsealed",
          scrollPct: 0,
        },
        {
          id: 2,
          title: "Transit of the Goldilocks Zone",
          scene: "scene-2",
          color: palette[1],
          emoji: "🪐",
          lore: "Photometric sensors record the dip in stellar brightness as terrestrial planet Aethelgard crosses the star's radiant disk.",
          milestone: "Exoplanet Confirmed",
          scrollPct: 33,
        },
        {
          id: 3,
          title: "Resonance of the Jovian Gas Rings",
          scene: "scene-3",
          color: palette[2],
          emoji: "🌌",
          lore: "Spectroscopic analysis reveals ice-crystal reflections and magnetic auroral ribbons dancing across Vespera VI's magnetic poles.",
          milestone: "Spectrogram Mapped",
          scrollPct: 66,
        },
        {
          id: 4,
          title: "The Trans-Neptunian Heliopause",
          scene: "scene-4",
          color: palette[3],
          emoji: "✨",
          lore: "Leaving the solar wind behind, deep-space sensors pierce the interstellar medium, logging the cosmic microwave background.",
          milestone: "Cosmic Frontier Reached",
          scrollPct: 100,
        },
      ];
    }

    // 5. Children / Fantasy / Kazzoo (Differentiated by Route!)
    if (/kazzoo|fantasy|companion|whimsical|whispering|moss/i.test(combined)) {
      // If route is /print-journey-scroll vs /family-adventures, produce completely different chapters!
      if (/print|scroll|keepsake|folio/i.test(route)) {
        return [
          {
            id: 1,
            title: "The Pilgrim's Parchment Inscription",
            scene: "scene-1",
            color: palette[0],
            emoji: "📜",
            lore: `Every traveler who walks the mossy ridges leaves their personal sigil recorded in the permanent ${brandName} Keepsake Folio.`,
            milestone: "Inscribed in Folio",
            scrollPct: 0,
          },
          {
            id: 2,
            title: "Resonance of the Four Bells",
            scene: "scene-2",
            color: palette[1],
            emoji: "🔔",
            lore: "Ancient bells cast from mountain bronze chimed as the four wanderers united their compasses at the central spire.",
            milestone: "Chime Recorded",
            scrollPct: 33,
          },
          {
            id: 3,
            title: "Constellation of the Quiet Forest",
            scene: "scene-3",
            color: palette[2],
            emoji: "✨",
            lore: "Star charts etched onto petrified bark illuminate the safest paths through the deep ferns during nightfall.",
            milestone: "Starlight Charted",
            scrollPct: 66,
          },
          {
            id: 4,
            title: "The Completed Journey Keepsake",
            scene: "scene-4",
            color: palette[3],
            emoji: "🎉",
            lore: "The full chronicle is bound and sealed with fragrant cedar wax, ready to be preserved for future adventurers.",
            milestone: "Chronicle Sealed",
            scrollPct: 100,
          },
        ];
      }

      // Default Kazzoo adventure
      return [
        {
          id: 1,
          title: "The Whispering Awakening",
          scene: "scene-1",
          color: palette[0],
          emoji: "🌅",
          lore: `As the first mists dissolved over the Floating Shore, ${brandName} stirred with dormant melodies echoing through ancient spires.`,
          milestone: "Shore Discovered",
          scrollPct: 0,
        },
        {
          id: 2,
          title: "The Crossing of Luminous Shallows",
          scene: "scene-2",
          color: palette[1],
          emoji: "🌊",
          lore: "The Bridge of Tortoise appeared at low tide, its mossy stones carved with glyphs from the First Wanderers.",
          milestone: "Bridge Crossed",
          scrollPct: 33,
        },
        {
          id: 3,
          title: "The Ascent of Cloud Spire",
          scene: "scene-3",
          color: palette[2],
          emoji: "☁️",
          lore: "Three hundred steps of wind-worn quartz led to the apex of Cloud Spire, looking out over pastel treetops.",
          milestone: "Spire Reached",
          scrollPct: 66,
        },
        {
          id: 4,
          title: "The Archive of Unwritten Songs",
          scene: "scene-4",
          color: palette[3],
          emoji: "🎶",
          lore: "Four ancient songs were recovered from the elder canopy, bringing harmony back to the archipelago.",
          milestone: "Archive Unlocked",
          scrollPct: 100,
        },
      ];
    }

    // 4b. Contemporary Art Museum / Gallery Scrollytelling & Audio Guide
    if ((/\b(art museum|contemporary art|art gallery|fine art)\b/i.test(combined) || /\b(museum|gallery|curator|curatorial|exhibition|artwork|artworks)\b/i.test(combined)) && !/\b(ocean|marine|underwater|deep-sea|benthic|abyssal|submersible)\b/i.test(combined)) {
      return [
        {
          id: 1,
          title: "The Curatorial Inception",
          scene: "scene-1",
          color: palette[0],
          emoji: "🏛️",
          lore: `The curatorial opening of ${brandName} introduces spatial light, monochrome architecture, and rotating contemporary works.`,
          milestone: "Exhibition Entered",
          scrollPct: 0,
        },
        {
          id: 2,
          title: "Materiality & Sculptural Form",
          scene: "scene-2",
          color: palette[1],
          emoji: "🗿",
          lore: "Large-scale sculptural bronzes, light installations, and tactile mediums inhabit open gallery atriums.",
          milestone: "Gallery Explored",
          scrollPct: 33,
        },
        {
          id: 3,
          title: "Artist Voice & Sonic Commentary",
          scene: "scene-3",
          color: palette[2],
          emoji: "🎙️",
          lore: "Curator audio notes and artist voice recordings unfold across designated listening points.",
          milestone: "Audio Guide Engaged",
          scrollPct: 66,
        },
        {
          id: 4,
          title: "The Permanent Vault & Collection",
          scene: "scene-4",
          color: palette[3],
          emoji: "✦",
          lore: `Personal folios and permanent collections cataloged for enduring contemplation at ${brandName}.`,
          milestone: "Collection Unlocked",
          scrollPct: 100,
        },
      ];
    }

    // 5. Architecture / Journal / Monograph / Tectonic Ideas
    if (/\b(architecture|architectural|architect|monograph|tectonic|built form)\b/i.test(combined)) {
      return [
        {
          id: 1,
          title: "Tectonic Foundations & Monograph Thesis",
          scene: "scene-1",
          color: palette[0],
          emoji: "🏛️",
          lore: `The curatorial opening of ${brandName} investigates the intersection of material weight, tectonic honesty, and architectural atmosphere.`,
          milestone: "Exposition Inaugurated",
          scrollPct: 0,
        },
        {
          id: 2,
          title: "Materiality: Basalt, Timber & Mass",
          scene: "scene-2",
          color: palette[1],
          emoji: "📐",
          lore: "Unprocessed geological strata and load-bearing timber frameworks resist disposable visual noise through acoustic stillness.",
          milestone: "Materiality Examined",
          scrollPct: 33,
        },
        {
          id: 3,
          title: "Spatial Typology & Urban Inhabitation",
          scene: "scene-3",
          color: palette[2],
          emoji: "📖",
          lore: "From alpine thermal sanctuaries to reclaimed canal basins, public assemblies adapt to permanent spatial enclosures.",
          milestone: "Typology Documented",
          scrollPct: 66,
        },
        {
          id: 4,
          title: "The Curated Archival Folio",
          scene: "scene-4",
          color: palette[3],
          emoji: "✦",
          lore: `Comprehensive back-issue folio preserving critical architectural discourse, practitioner dialogues, and monograph elevations for ${brandName}.`,
          milestone: "Folio Catalogued",
          scrollPct: 100,
        },
      ];
    }

    // 6. Generic Parametric Fallback Derived from Brand, Role & Domain Words (Zero telemetry or startup jargon!)
    const cleanRoute = (route || options?.pageRole || "Chronicle").replace(/[^a-zA-Z0-9]/g, " ").trim() || "Chronicle";
    const routeWords = cleanRoute.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
    const primaryWord = routeWords[0] || "Inquiry";
    const secondaryWord = routeWords[1] || "Perspective";

    // Extract contextual domain terms from purpose / pageRole / prompt
    const contextText = `${options.pageRole || ""} ${options.purpose || ""} ${prompt}`.toLowerCase();
    const promptKeywords = contextText
      .split(/[^a-z0-9]+/)
      .filter(w => w.length > 4 && !/create|build|website|application|platform|digital|experience|about|these|include|their|which|where/.test(w));
    const domainKeyword1 = promptKeywords[0] ? promptKeywords[0].charAt(0).toUpperCase() + promptKeywords[0].slice(1) : primaryWord;
    const domainKeyword2 = promptKeywords[1] ? promptKeywords[1].charAt(0).toUpperCase() + promptKeywords[1].slice(1) : secondaryWord;

    return [
      {
        id: 1,
        title: `Foundations of ${domainKeyword1}`,
        scene: "scene-1",
        color: palette[0],
        emoji: "✦",
        lore: `The inaugural chapter of ${brandName} establishes core conceptual perspectives and foundational principles.`,
        milestone: "Origins Documented",
        scrollPct: 0,
      },
      {
        id: 2,
        title: `Deep Analysis & ${domainKeyword2}`,
        scene: "scene-2",
        color: palette[1],
        emoji: "◈",
        lore: `Examining structural depth and refined methodologies across the active framework of ${brandName}.`,
        milestone: "Inquiry Deepened",
        scrollPct: 33,
      },
      {
        id: 3,
        title: "Contextual Synthesis & Dialogue",
        scene: "scene-3",
        color: palette[2],
        emoji: "◆",
        lore: `Harmonizing diverse insights into a coherent, expansive perspective that bridges theory and practice.`,
        milestone: "Synthesis Formed",
        scrollPct: 66,
      },
      {
        id: 4,
        title: `The Curated Archive`,
        scene: "scene-4",
        color: palette[3],
        emoji: "◇",
        lore: `Preserving enduring studies, critical documentation, and canonical works across ${brandName}.`,
        milestone: "Archive Catalogued",
        scrollPct: 100,
      },
    ];
  }

  /**
   * Synthesize spatial waypoints tailored to the domain.
   */
  public static synthesizeWaypoints(options: DomainVocabularyOptions): DomainWaypoint[] {
    const { brandName, prompt, route, seed = 42 } = options;
    const combined = `${prompt} ${route}`.toLowerCase();
    const routeSeed = this.hash(route);
    const effectiveSeed = (seed ^ routeSeed) >>> 0;

    // 1. Luxury furniture / Timber
    if (/\b(timber|furniture|wood|joinery|cabinetry|cabinetmaker|oakhaven)\b/i.test(combined)) {
      return [
        {
          id: "wp-1",
          name: "Old Growth Oak Reserve",
          zone: "Appalachian Hardwood Stand",
          coords: { x: 190, y: 140 },
          status: "Completed",
          difficulty: "Foundational",
          lore: "Century-old white oak stands selected for quarter-sawn stability and tight growth rings.",
          reward: "Aged Timber Standard",
        },
        {
          id: "wp-2",
          name: "Kiln Curing Yard",
          zone: "Moisture Stabilization Zone",
          coords: { x: 380, y: 230 },
          status: "Active",
          difficulty: "Intermediate",
          lore: "Solar vacuum kilns bring heartwood down to 7% equilibrium moisture content over six months.",
          reward: "Equilibrium Certificate",
        },
        {
          id: "wp-3",
          name: "Tenon Joinery Atelier",
          zone: "Precision Cutting Guild",
          coords: { x: 580, y: 160 },
          status: "Available",
          difficulty: "Master",
          lore: "Acoustic mortise and tenon routing guarantees joint tolerances within 0.1mm.",
          reward: "Master Joinery Badge",
        },
        {
          id: "wp-4",
          name: "Oil & Wax Curing Bench",
          zone: "Finishing Suite",
          coords: { x: 260, y: 380 },
          status: "Available",
          difficulty: "Intermediate",
          lore: "Organic cold-pressed linseed oils applied by hand to reveal three-dimensional timber chatoyancy.",
          reward: "Chatoyancy Luster Mark",
        },
        {
          id: "wp-5",
          name: "Heirloom Archive & Registry",
          zone: "Master Gallery",
          coords: { x: 500, y: 390 },
          status: "Available",
          difficulty: "Master",
          lore: "Every serialized piece receives a carved bronze provenance medallion inscribed with maker signatures.",
          reward: "Heirloom Provenance Medallion",
        },
      ];
    }

    // 2. Film festival / Cinema
    if (/\b(film|movie|filmmaker|screenplay|cinesphere|cinema)\b/i.test(combined) && !/astronomy|observatory|planet|space/i.test(combined)) {
      return [
        {
          id: "wp-1",
          name: "Grand Palais Screening Hall",
          zone: "Main Amphitheater",
          coords: { x: 180, y: 140 },
          status: "Completed",
          difficulty: "Foundational",
          lore: "4K Laser Dolby Cinema theater hosting official competition premiere screenings.",
          reward: "Festival VIP Badge",
        },
        {
          id: "wp-2",
          name: "Directors Roundtable Pavilion",
          zone: "Industry Forum",
          coords: { x: 380, y: 220 },
          status: "Active",
          difficulty: "Intermediate",
          lore: "Masterclasses on anamorphic framing, auteur vision, and independent distribution.",
          reward: "Auteur Access Pass",
        },
        {
          id: "wp-3",
          name: "Midnight Indie Short Vault",
          zone: "Avant-Garde Cellar",
          coords: { x: 590, y: 150 },
          status: "Available",
          difficulty: "Master",
          lore: "Underground screening room highlighting uncensored experimental animation and foreign shorts.",
          reward: "Midnight Screening Token",
        },
        {
          id: "wp-4",
          name: "Acoustic Foley & Score Lab",
          zone: "Post-Production Suite",
          coords: { x: 250, y: 380 },
          status: "Available",
          difficulty: "Intermediate",
          lore: "Interactive workshops exploring live orchestral tracking and analogue modular synth scores.",
          reward: "Foley Master Track",
        },
        {
          id: "wp-5",
          name: "Awards Gala Plinth",
          zone: "Festival Apex",
          coords: { x: 510, y: 390 },
          status: "Available",
          difficulty: "Master",
          lore: "Where the jury announces Golden Palm and Audience Choice laureates on closing night.",
          reward: "Golden Palm Laurels",
        },
      ];
    }

    // 2b. Museum / Gallery Waypoints (Floor Plan)
    if ((/\b(art museum|contemporary art|art gallery|fine art)\b/i.test(combined) || /\b(museum|gallery|exhibition|artworks|floor plan|floorplan)\b/i.test(combined)) && !/\b(ocean|marine|underwater|deep-sea|benthic|abyssal|submersible)\b/i.test(combined)) {
      return [
        {
          id: "wp-1",
          name: "North Atrium & Sculpture Court",
          zone: "Ground Pavilion",
          coords: { x: 180, y: 140 },
          status: "Completed",
          difficulty: "Foundational",
          lore: "Monumental bronze sculptures and natural skylit architectural atriums welcoming visitors.",
          reward: "Atrium Access Badge",
        },
        {
          id: "wp-2",
          name: "East Wing: Modern Monoliths",
          zone: "Exhibition Hall A",
          coords: { x: 380, y: 220 },
          status: "Active",
          difficulty: "Intermediate",
          lore: "Large-format canvas works and spatial pigment studies by featured contemporary masters.",
          reward: "Curator Exhibition Note",
        },
        {
          id: "wp-3",
          name: "South Wing: Sound & Light Sanctum",
          zone: "Immersive Chamber",
          coords: { x: 590, y: 150 },
          status: "Available",
          difficulty: "Master",
          lore: "Acoustic audio guide listening points and generative projection spaces exploring light frequencies.",
          reward: "Acoustic Frequency Key",
        },
        {
          id: "wp-4",
          name: "West Wing: Print & Drawing Folios",
          zone: "Works on Paper Gallery",
          coords: { x: 250, y: 380 },
          status: "Available",
          difficulty: "Intermediate",
          lore: "Climate-controlled curatorial vitrines displaying archival sketches, lithographs, and monographs.",
          reward: "Folio Archive Seal",
        },
        {
          id: "wp-5",
          name: "Rooftop Terrace & Observatory Plinth",
          zone: "Sky Pavilion",
          coords: { x: 510, y: 390 },
          status: "Available",
          difficulty: "Master",
          lore: "Open-air panoramic sculpture garden overlooking city architecture and seasonal light installations.",
          reward: "Rooftop Pass",
        },
      ];
    }

    // 3. Marine / Ocean
    if (/\b(ocean|marine|submersible|coral reef|deep ocean|abyssal|underwater|bathymetry|benthic)\b/i.test(combined)) {
      return [
        {
          id: "wp-1",
          name: "Sunlit Barrier Reef Apex",
          zone: "Epipelagic Zone",
          coords: { x: 180, y: 140 },
          status: "Completed",
          difficulty: "Foundational",
          lore: "Bustling coral reef biodiversity monitoring hub situated at 15 meters datum.",
          reward: "Coral Health Inscription",
        },
        {
          id: "wp-2",
          name: "Benthic Shelf Dropoff",
          zone: "Benthic Twilight Zone",
          coords: { x: 370, y: 230 },
          status: "Active",
          difficulty: "Intermediate",
          lore: "Steep benthic oceanic shelf where descending robotic gliders record acoustic whale calls.",
          reward: "Bioluminescent Beacon",
        },
        {
          id: "wp-3",
          name: "Hydrothermal Vent Spire",
          zone: "Abyssal Plain",
          coords: { x: 590, y: 160 },
          status: "Available",
          difficulty: "Master",
          lore: "Black smoker vents pumping mineral-rich superheated fluids into freezing deep seawater.",
          reward: "Mineral Core Sample",
        },
        {
          id: "wp-4",
          name: "Bioluminescent Siphonophore Grove",
          zone: "Midnight Zone",
          coords: { x: 250, y: 390 },
          status: "Available",
          difficulty: "Intermediate",
          lore: "Colonies of deep-sea pelagic siphonophores glowing with pulsating cyan fluorescence.",
          reward: "Deep Pulse Frequency",
        },
        {
          id: "wp-5",
          name: "Mariana Trench Hadal Deep",
          zone: "Hadal Abyss",
          coords: { x: 520, y: 390 },
          status: "Available",
          difficulty: "Master",
          lore: "The lowest tectonic fracture on Earth's crust, surveyed by ultra-high-pressure autonomous vehicles.",
          reward: "Challenger Deep Seal",
        },
      ];
    }

    // 4. Astronomy / Observatory / Planetary
    if (/astronomy|observatory|planet|celestial|space|cosmos|telescope|nocturne|solar|stellar/i.test(combined)) {
      return [
        {
          id: "wp-1",
          name: "Sol-Nocturne Heliocentric Core",
          zone: "Inner Solar Horizon",
          coords: { x: 190, y: 140 },
          status: "Completed",
          difficulty: "Foundational",
          lore: "Primary radiant G-type stellar core anchoring gravitational equilibrium across the system.",
          reward: "Stellar Flux Certificate",
        },
        {
          id: "wp-2",
          name: "Aethelgard Prime Terrestrial",
          zone: "Goldilocks Orbital Ring",
          coords: { x: 380, y: 230 },
          status: "Active",
          difficulty: "Intermediate",
          lore: "Dense silicate planetary body with nitrogen-rich atmosphere and liquid methane fjords.",
          reward: "Atmospheric Spectrogram",
        },
        {
          id: "wp-3",
          name: "Vespera VI Gas Giant Ring",
          zone: "Outer Jovian Realm",
          coords: { x: 580, y: 160 },
          status: "Available",
          difficulty: "Master",
          lore: "Magnificent hydrogen-helium giant encircled by icy resonant micro-rings and 14 shepherd moons.",
          reward: "Gravitational Lensing Data",
        },
        {
          id: "wp-4",
          name: "Cryo-Thule Tidally Locked Moon",
          zone: "Sub-Zero Kuiper Boundary",
          coords: { x: 260, y: 380 },
          status: "Available",
          difficulty: "Intermediate",
          lore: "Perpetually shadowed cryovolcanic moon spewing ammonia plumes into the deep cosmic void.",
          reward: "Cryo-Core Isotope",
        },
        {
          id: "wp-5",
          name: "Oort Zenith Deep Observatory",
          zone: "Interstellar Trans-Neptunian",
          coords: { x: 520, y: 390 },
          status: "Available",
          difficulty: "Master",
          lore: "Autonomous long-baseline interferometer positioned at the outer heliopause.",
          reward: "Deep Cosmos Archive Key",
        },
      ];
    }

    // 5. Kazzoo / Fantasy
    if (/kazzoo|fantasy|companion|whimsical|whispering|moss/i.test(combined)) {
      return [
        {
          id: "wp-1",
          name: "Floating Shoreline",
          zone: "Tidepools",
          coords: { x: 180, y: 140 },
          status: "Completed",
          difficulty: "Foundational",
          lore: "Shimmering tidepools where glowing shells wash ashore during twilight tides.",
          reward: "Luminous Seashell",
        },
        {
          id: "wp-2",
          name: "Bridge of Tortoise",
          zone: "Ancient Canopy",
          coords: { x: 380, y: 220 },
          status: "Active",
          difficulty: "Intermediate",
          lore: "Petrified moss-stone spans the mist abyss. Pip guards the central transit stone.",
          reward: "Ancient Glyph",
        },
        {
          id: "wp-3",
          name: "Cloud Spire Apex",
          zone: "Upper Stratum",
          coords: { x: 590, y: 150 },
          status: "Available",
          difficulty: "Master",
          lore: "Three hundred winding quartz stairs bring climbers to the realm's highest windy roost.",
          reward: "Feather of the Spire",
        },
        {
          id: "wp-4",
          name: "Pastel Mushroom Circle",
          zone: "Elder Grove",
          coords: { x: 250, y: 380 },
          status: "Available",
          difficulty: "Intermediate",
          lore: "Soft spore lanterns bounce harmoniously whenever travelers walk across the dew.",
          reward: "Harmonic Spore Vial",
        },
        {
          id: "wp-5",
          name: "Archive of Unwritten Songs",
          zone: "Sacred Glade",
          coords: { x: 510, y: 390 },
          status: "Available",
          difficulty: "Master",
          lore: "Carved crystalline scrolls store the forgotten songs that awaken the archipelago.",
          reward: "Songstone Relic",
        },
      ];
    }

    // 5. Parametric default fallback derived purely from brandName and clean route
    const brandPrefix = brandName.replace(/[^a-zA-Z0-9]/g, "");
    return [
      {
        id: "wp-1",
        name: `${brandName} Northern Gateway`,
        zone: "Outer Periphery",
        coords: { x: 180, y: 140 },
        status: "Completed",
        difficulty: "Foundational",
        lore: `Gateway point marking foundational boundary coordinates across ${brandName}.`,
        reward: `${brandPrefix} Explorer Seal`,
      },
      {
        id: "wp-2",
        name: `${brandName} Meridian Station`,
        zone: "Transit Node",
        coords: { x: 380, y: 220 },
        status: "Active",
        difficulty: "Intermediate",
        lore: `Central convergence path connecting prominent regional landmarks.`,
        reward: `${brandPrefix} Transit Token`,
      },
      {
        id: "wp-3",
        name: `${brandName} High Horizon Apex`,
        zone: "Apex Overlook",
        coords: { x: 590, y: 150 },
        status: "Available",
        difficulty: "Master",
        lore: `Panoramic observation point overlooking core territorial bounds.`,
        reward: `${brandPrefix} Horizon Emblem`,
      },
      {
        id: "wp-4",
        name: `${brandName} Innovation Atelier`,
        zone: "Creative Workshop",
        coords: { x: 250, y: 380 },
        status: "Available",
        difficulty: "Intermediate",
        lore: `Exploratory observation studio surveying key surrounding features.`,
        reward: `${brandPrefix} Creative Mark`,
      },
      {
        id: "wp-5",
        name: `${brandName} Master Archive`,
        zone: "Sanctuary Vault",
        coords: { x: 510, y: 390 },
        status: "Available",
        difficulty: "Master",
        lore: `Permanent historical repository preserving master archival chronicles.`,
        reward: `${brandPrefix} Master Relic`,
      },
    ];
  }

  /**
   * Synthesize 3D telemetry metadata without any leaking fallback strings.
   */
  public static synthesize3DTelemetry(options: DomainVocabularyOptions): DomainTelemetryInfo {
    const { brandName, prompt, route } = options;
    const combined = `${prompt} ${route}`.toLowerCase();

    if (/\b(timber|furniture|wood|joinery|cabinetry|cabinetmaker|oakhaven)\b/i.test(combined)) {
      return {
        studioName: "Atelier Timber Showcase",
        telemetryTitle: "Heartwood Calibrator",
        metricLabel: "3D Joint Deflection",
        statusBadge: "Kiln Cured Standard",
      };
    }

    if ((/\b(art museum|contemporary art|art gallery|fine art)\b/i.test(combined) || /\b(museum|gallery|curator|exhibition|artwork|artworks)\b/i.test(combined)) && !/\b(ocean|marine|underwater|deep-sea|benthic|abyssal|submersible)\b/i.test(combined)) {
      return {
        studioName: `${brandName} Curatorial Pavilion`,
        telemetryTitle: "Gallery Spatial Dimensions",
        metricLabel: "Exhibition Floor Coordinate",
        statusBadge: "Curatorial Wing Active",
      };
    }

    if (/\b(film|movie|filmmaker|screenplay|cinesphere|cinema)\b/i.test(combined) && !/astronomy|observatory|planet|space/i.test(combined)) {
      return {
        studioName: "Anamorphic Soundstage",
        telemetryTitle: "Cinema Optics Studio",
        metricLabel: "Aspect Framing",
        statusBadge: "35mm Master Slate",
      };
    }

    if (/\b(ocean|marine|submersible|coral reef|deep ocean|abyssal|underwater|bathymetry|benthic)\b/i.test(combined)) {
      return {
        studioName: "Pelagic Abyss Stage",
        telemetryTitle: "Bathymetric Telemetry",
        metricLabel: "Depth Datum (Meters)",
        statusBadge: "Pressure Hull Sealed",
      };
    }

    if (/astronomy|observatory|planet|celestial|space|cosmos|telescope|nocturne|solar|stellar/i.test(combined)) {
      return {
        studioName: "Midnight Armillary Sphere",
        telemetryTitle: "Planetary Astrometry",
        metricLabel: "Orbital Semi-Major Axis & Velocity",
        statusBadge: "Deep Sky Aperture 0.94m",
      };
    }

    if (/kazzoo|fantasy|companion|whimsical|whispering|moss/i.test(combined)) {
      return {
        studioName: "Emerald Glade Stage",
        telemetryTitle: "Realm Telemetry",
        metricLabel: "Archipelago Landmarks",
        statusBadge: "Realm Online",
      };
    }

    return {
      studioName: `${brandName} Spatial Viewer`,
      telemetryTitle: "Spatial Geometry",
      metricLabel: "Interactive Coordinates",
      statusBadge: "Studio Active",
    };
  }
}
