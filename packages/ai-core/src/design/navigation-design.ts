/**
 * NavigationDesign & NavigationContract
 *
 * First-class design artifact defining product-level navigation identity.
 *
 * SYSTEM INVARIANT:
 * "A navigation component may be implemented using shared primitives (Button, Dropdown, Icon),
 * but its product-level structure, visual treatment, route labels, interaction model, and
 * composition must be independently derived from the active ProductExperiencePlan and NavigationDesign.
 * A website shell/navbar must NEVER be reused or template-converged across projects."
 */

export type NavigationModel =
  | "top_masthead"
  | "floating_pills"
  | "sidebar"
  | "bottom_dock"
  | "contextual"
  | "orbital"
  | "minimal_wordmark"
  | "editorial_index"
  | "immersive_hud"
  | "custom";

export type NavigationPosition =
  | "top"
  | "bottom"
  | "left"
  | "floating_top"
  | "floating_bottom"
  | "orbital"
  | "integrated";

export interface NavigationItem {
  path: string;
  label: string;
  purpose?: string;
  icon?: string;
  isPrimary?: boolean;
}

export interface NavigationBrandTreatment {
  name: string;
  tagline?: string;
  logoType: "wordmark" | "monogram" | "symbol_wordmark" | "editorial_header" | "hud_badge";
  typography: string;
  style: string;
}

export interface NavigationVisualTreatment {
  typography: string;
  geometry: string;
  surface: string;
  activeState: string;
  motion: string;
  containerClass?: string;
  navClass?: string;
  activeItemClass?: string;
  inactiveItemClass?: string;
}

export interface NavigationDesign {
  model: NavigationModel;
  position: NavigationPosition;
  brandTreatment: NavigationBrandTreatment;
  primaryItems: NavigationItem[];
  secondaryItems?: NavigationItem[];
  mobileModel: "drawer" | "bottom_sheet" | "floating_expand" | "minimal_overlay" | "inline";
  visualTreatment: NavigationVisualTreatment;
  interactionModel: string;
  provenance: string;
  fingerprintHash?: string;
}

export interface NavbarFingerprint {
  model: NavigationModel;
  position: NavigationPosition;
  itemCount: number;
  itemsList: string[];
  brandName: string;
  logoType: string;
  hasMoreMenu: boolean;
  surfaceType: string;
  activeStateType: string;
  typographyStyle: string;
  fingerprintHash: string;
}

export class NavigationDesignResolver {
  /**
   * Derives an authoritative, product-specific NavigationDesign
   * from the product's identity, prompt, and experience pattern.
   */
  public static resolve(
    prompt: string,
    experiencePattern: string,
    brandName: string,
    brandTagline: string | undefined,
    plannedRoutes: Array<{ path: string; title: string; category?: string }>,
    emotionalTone?: string,
    generationSeed?: number,
    compositionStrategy?: string,
    authoritativeRequiredRoutes?: string[]
  ): NavigationDesign {
    const lower = prompt.toLowerCase();
    const cleanBrandName = this.sanitizeBrandName(brandName, prompt);

    // 1. Determine Navigation Model & Position
    let model: NavigationModel = "floating_pills";
    let position: NavigationPosition = "floating_top";
    let logoType: NavigationBrandTreatment["logoType"] = "wordmark";
    let mobileModel: NavigationDesign["mobileModel"] = "floating_expand";
    let interactionModel = "hover-active-indicator";

    const is3DWorld =
      /\b(3d|webgl|three\.?js|r3f|claymation|volumetric|fantasy adventure|world explorer|planetarium)\b/i.test(lower);
    const isWatch =
      /\b(watch|watches|horology|timepiece|timepieces|watchmaker|artisan watch)\b/i.test(lower);
    const isPerfume =
      /\b(perfume|flacon|fragrance|scent|eau de|cologne|olfactory|luxury house)\b/i.test(lower);
    const isEditorial =
      !is3DWorld &&
      (/\b(magazine|monograph|photography journal|photo essay|fashion journal|architecture journal)\b/i.test(lower) ||
       (!isWatch && !isPerfume && /\b(editorial|journal)\b/i.test(lower)));
    const isDashboard =
      /\b(dashboard|telemetry|dispatch|fleet|metrics|monitoring|operations|trading|analytics)\b/i.test(lower);
    const isStorefront =
      /\b(storefront|bakery|menu|shop|boutique|order|cart|checkout|patisserie)\b/i.test(lower);
    const isPersonalTracker =
      /\b(diary|journal|habit|wellness|tracker|mood|meditation)\b/i.test(lower);

    if (is3DWorld) {
      if (compositionStrategy === "CHARACTER_STAGE") {
        model = "bottom_dock";
        position = "floating_bottom";
        logoType = "monogram";
        mobileModel = "inline";
        interactionModel = "character-roster-dock";
      } else if (compositionStrategy === "CINEMATIC_JOURNEY") {
        model = "floating_pills";
        position = "floating_top";
        logoType = "wordmark";
        mobileModel = "floating_expand";
        interactionModel = "cinematic-vignette-pill";
      } else if (compositionStrategy === "SPATIAL_ATLAS") {
        model = "floating_pills";
        position = "floating_top";
        logoType = "hud_badge";
        mobileModel = "drawer";
        interactionModel = "cartographic-tab-strip";
      } else if (compositionStrategy === "INTERACTIVE_REALM") {
        model = "bottom_dock";
        position = "floating_bottom";
        logoType = "monogram";
        mobileModel = "inline";
        interactionModel = "realm-compass-dock";
      } else {
        // WORLD_EXPLORATION or default
        model = "immersive_hud";
        position = "floating_top";
        logoType = "hud_badge";
        mobileModel = "floating_expand";
        interactionModel = "tactile-spatial-dock";
      }
    } else if (isWatch) {
      if (compositionStrategy === "CALIBER_ATLAS") {
        model = "top_masthead";
        position = "top";
        logoType = "editorial_header";
        mobileModel = "drawer";
        interactionModel = "horology-caliber-index";
      } else if (compositionStrategy === "CINEMATIC_JOURNEY") {
        model = "floating_pills";
        position = "floating_top";
        logoType = "wordmark";
        mobileModel = "floating_expand";
        interactionModel = "refined-gold-pill";
      } else {
        model = "minimal_wordmark";
        position = "floating_top";
        logoType = "wordmark";
        mobileModel = "minimal_overlay";
        interactionModel = "refined-gold-indicator";
      }
    } else if (isPerfume) {
      model = "minimal_wordmark";
      position = "floating_top";
      logoType = "wordmark";
      mobileModel = "minimal_overlay";
      interactionModel = "serene-glow-reveal";
    } else if (isEditorial) {
      model = "top_masthead";
      position = "top";
      logoType = "editorial_header";
      mobileModel = "drawer";
      interactionModel = "understated-serif-underline";
    } else if (isDashboard) {
      model = "sidebar";
      position = "left";
      logoType = "symbol_wordmark";
      mobileModel = "drawer";
      interactionModel = "compact-indicator-rail";
    } else if (isPersonalTracker) {
      model = "bottom_dock";
      position = "floating_bottom";
      logoType = "monogram";
      mobileModel = "inline";
      interactionModel = "gentle-bounce-dock";
    } else if (isStorefront) {
      model = "top_masthead";
      position = "top";
      logoType = "symbol_wordmark";
      mobileModel = "drawer";
      interactionModel = "warm-cart-peek";
    } else {
      model = "floating_pills";
      position = "floating_top";
      logoType = "wordmark";
      mobileModel = "floating_expand";
      interactionModel = "smooth-pill-highlight";
    }

    // 2. Select Product-Specific Navigation Items (Never generic Home/About/Contact or raw component dump!)
    const items = this.deriveCuratedItems(
      isWatch,
      isPerfume,
      isEditorial,
      is3DWorld,
      isDashboard,
      isPersonalTracker,
      isStorefront,
      plannedRoutes,
      prompt,
      authoritativeRequiredRoutes
    );

    // 3. Derive Visual Treatments tailored to Emotional Tone & Model
    const visualTreatment = this.deriveVisualTreatment(model, emotionalTone, isEditorial, isPerfume, is3DWorld);

    const brandTreatment: NavigationBrandTreatment = {
      name: cleanBrandName,
      tagline: brandTagline,
      logoType,
      typography: isEditorial ? "font-serif tracking-widest uppercase" : isPerfume ? "font-serif tracking-widest text-amber-200" : is3DWorld ? "font-sans font-black tracking-tight" : "font-sans font-bold",
      style: visualTreatment.typography
    };

    const design: NavigationDesign = {
      model,
      position,
      brandTreatment,
      primaryItems: items.primary,
      secondaryItems: items.secondary,
      mobileModel,
      visualTreatment,
      interactionModel,
      provenance: `Derived independently from prompt (${model}) with ${items.primary.length} curated product items.`
    };

    design.fingerprintHash = this.computeFingerprint(design).fingerprintHash;
    return design;
  }

  /**
   * Extracts an authoritative brand name directly from user prompt instructions
   * (e.g. "Create a ... called SAVORLINE", "Kazzoo: An immersive...", "for CHRONOS ATELIER, a...").
   */
  public static extractBrandFromPrompt(prompt: string | undefined): string | undefined {
    if (!prompt || typeof prompt !== "string") return undefined;
    const cleanPrompt = prompt.trim();

    // 1. Prefix: e.g. "Kazzoo: An immersive...", "SAVORLINE: A culinary..."
    const prefixMatch = cleanPrompt.match(/^([A-Za-z0-9\s&'-]{2,24}):\s+/);
    if (prefixMatch && !/^(create|build|make|design|generate|develop|an?|the)\b/i.test(prefixMatch[1])) {
      return prefixMatch[1].trim().toUpperCase();
    }

    // 2. Leading command with explicit product name: e.g. "Build GREENPULSE ENERGY, a ...", "Create ORBITALIS, a ..."
    const verbLeadMatch = cleanPrompt.match(/^(?:build|create|make|design|generate|develop)\s+["']?([A-Za-z0-9&'’\-]+(?:\s+[A-Za-z0-9&'’\-]+){0,3})["']?(?:,\s+|\s+-\s+|\s+a\b|\s+an\b|\s+the\b|\s+for\b)/i);
    if (verbLeadMatch) {
      const candidate = verbLeadMatch[1].trim();
      if (!/^(a|an|the|this|that|an?y|our|my|one|new|modern|production|full-stack|full\s+stack|web|application|platform)\b/i.test(candidate)) {
        return candidate.toUpperCase();
      }
    }

    // 3. "called <Name>" or "named <Name>" or "titled <Name>" or "known as <Name>"
    const quotedCalledMatch = cleanPrompt.match(/\b(?:called|named|titled|known as)\s+["']([^"']{2,36})["']/i);
    if (quotedCalledMatch) {
      const candidate = quotedCalledMatch[1].trim();
      if (!/^(a|an|the|this|that|an?y|our|my|one)\b/i.test(candidate)) {
        return candidate.toUpperCase();
      }
    }

    const unquotedCalledMatch = cleanPrompt.match(/\b(?:called|named|titled|known as)\s+([A-Z0-9][A-Za-z0-9&'’\-]*(?:\s+[A-Z0-9][A-Za-z0-9&'’\-]*){0,3})(?=[\s.,;:!?\n]|$)/i);
    if (unquotedCalledMatch) {
      let candidate = unquotedCalledMatch[1].trim();
      candidate = candidate.replace(/\s+(?:with|and|featuring|showcasing|for|in|that|where|by)\b[\s\S]*$/i, "").trim();
      if (candidate && !/^(a|an|the|this|that|an?y|our|my|one)\b/i.test(candidate)) {
        return candidate.toUpperCase();
      }
    }

    const simpleCalledMatch = cleanPrompt.match(/\b(?:called|named|titled|known as)\s+([A-Za-z0-9&'-]{2,30})/i);
    if (simpleCalledMatch) {
      const candidate = simpleCalledMatch[1].trim();
      if (!/^(a|an|the|this|that|an?y|our|my|one)\b/i.test(candidate)) {
        return candidate.toUpperCase();
      }
    }

    // 4. "for <Name>, a/an ..."
    const forMatch = cleanPrompt.match(/\bfor\s+["']?([A-Za-z0-9&'-]{2,24})["']?,\s+(?:a|an)\b/i);
    if (forMatch && !/^(the|a|an|all|each|every)\b/i.test(forMatch[1])) {
      return forMatch[1].trim().toUpperCase();
    }

    // 5. "brand <Name>" or "branded <Name>"
    const brandMatch = cleanPrompt.match(/\bbrand(?:ed)?\s+["']?([A-Za-z0-9&'-]{2,24})["']?/i);
    if (brandMatch && !/^(identity|guidelines|colors|assets|voice|tone|strategy|book)\b/i.test(brandMatch[1])) {
      return brandMatch[1].trim().toUpperCase();
    }

    return undefined;
  }

  /**
   * Sanitizes a brand name so raw user instructions like "Create a luxury perfume..."
   * or truncated strings like "Create an independent fa..." never leak into navigation.
   * Priority: Authoritative brand extracted from prompt > Clean candidateName > Domain fallback.
   */
  public static sanitizeBrandName(candidateName: string | undefined, prompt: string): string {
    const extractedBrand = this.extractBrandFromPrompt(prompt);
    if (extractedBrand) {
      return extractedBrand;
    }

    if (!candidateName || !candidateName.trim()) {
      return this.fallbackBrandName(prompt);
    }

    const raw = candidateName.trim();

    // Check if the candidate name looks like a prompt instruction or is truncated
    const isInstruction =
      /^(create|build|make|design|generate|an?|the)\b/i.test(raw) ||
      raw.includes("...") ||
      raw.length > 28;

    if (isInstruction) {
      return this.fallbackBrandName(prompt);
    }

    return raw;
  }

  private static fallbackBrandName(prompt: string): string {
    const extractedBrand = this.extractBrandFromPrompt(prompt);
    if (extractedBrand) {
      return extractedBrand;
    }

    const lower = prompt.toLowerCase();
    const isCleanEnergy = /\b(renewable|solar|wind|clean energy|greenpulse|energy operations|power grid|microgrid|photovoltaic|inverter|turbine)\b/i.test(lower);
    if (isCleanEnergy) {
      return "GREENPULSE ENERGY";
    }
    const isObservatory = /\b(observatory|orbitalis|astronomy|celestial|telescope|deep sky)\b/i.test(lower);
    if (isObservatory) {
      return "ORBITALIS";
    }
    if (lower.includes("culinary") || lower.includes("food journey") || lower.includes("recipe") || lower.includes("gastronom")) {
      return "SAVORLINE";
    }
    if (lower.includes("perfume") || lower.includes("flacon") || lower.includes("fragrance")) {
      return "MAISON ÉTHER";
    }
    if (lower.includes("magazine") || lower.includes("editorial") || lower.includes("fashion")) {
      return "REVUE NOIR";
    }
    if (lower.includes("watch") || lower.includes("horology") || lower.includes("timepiece")) {
      return "CHRONOS ATELIER";
    }
    if (lower.includes("museum") || lower.includes("contemporary art") || lower.includes("gallery") || lower.includes("curatorial") || lower.includes("exhibition")) {
      return "LUMEN HOUSE";
    }
    const isAviation = /\b(avionics|aerospace|aircraft|flight|aviation|cockpit|airframe|airspace|transponder|squawk)\b/i.test(lower);
    if (!isAviation && /\b(architectural\s+(?:monograph|journal|review|digest|firm|studio|practice|portfolio)|architecture\s+(?:firm|studio|monograph|journal|magazine|exhibition)|building\s+typolog(?:y|ies))\b/i.test(lower)) {
      return "TECTONIC JOURNAL";
    }
    if (lower.includes("kazzoo") || lower.includes("claymation") || lower.includes("fantasy")) {
      return "KAZZOO";
    }
    if (isAviation) {
      return lower.includes("stratos") ? "STRATOS AVIONICS" : "AERO TELEMETRY";
    }
    if (lower.includes("plant") || lower.includes("botanical")) {
      return "LEAF SANCTUARY";
    }

    // Extract significant nouns from prompt
    const cleaned = prompt.replace(/^(create|build|make|design|generate)\s+(?:an?|the)?\s+/i, "");
    const words = cleaned.split(/[\s,.-]+/).filter(w => w.length > 3 && !/website|app|application|platform|centered|around|with/i.test(w));
    if (words.length > 0) {
      return words.slice(0, 2).map(w => w.toUpperCase()).join(" ");
    }
    return "EXPERIENCE";
  }

  private static deriveCuratedItems(
    isWatch: boolean,
    isPerfume: boolean,
    isEditorial: boolean,
    is3DWorld: boolean,
    isDashboard: boolean,
    isPersonalTracker: boolean,
    isStorefront: boolean,
    plannedRoutes: Array<{ path: string; title: string; category?: string }>,
    prompt: string,
    authoritativeRequiredRoutes?: string[]
  ): { primary: NavigationItem[]; secondary: NavigationItem[] } {
    const lower = prompt.toLowerCase();
    const primary: NavigationItem[] = [];

    // Helper: detect section-layer semantic IDs that should NEVER become navigation routes
    const isSectionSlug = (path: string): boolean => {
      const p = path.toLowerCase().replace(/^\//, "");
      return /(pull-quote|marginalia|split|overview-split|hero-|section-|stat-grid|grid-facet|facet-browser|visual-photo-essay|in-depth-analytical)/i.test(p);
    };

    const hasAuthoritative = Boolean(authoritativeRequiredRoutes && authoritativeRequiredRoutes.length > 0);
    const authoritativeSet = new Set(
      (authoritativeRequiredRoutes || []).map(r => r.startsWith("/") ? r : `/${r}`)
    );
    // Always include root "/" in authoritative if any routes exist
    if (hasAuthoritative) {
      authoritativeSet.add("/");
    }

    const formatCleanLabel = (cleanPath: string, rawTitle?: string): string => {
      if (cleanPath === "/") {
        return is3DWorld ? "3D Stage" : isEditorial ? "Monograph" : isWatch ? "Collection" : isPerfume ? "The Flacon" : "Overview";
      }

      // Domain-specific clean route overrides
      const cleanPathLower = cleanPath.toLowerCase();
      if (cleanPathLower.includes("explore-longform") || cleanPathLower.includes("read-longform")) return "Longform";
      if (cleanPathLower.includes("city-map")) return "City Map";
      if (cleanPathLower.includes("portfolios") || cleanPathLower.includes("dialogues")) return "Portfolios";
      if (cleanPathLower.includes("archive") || cleanPathLower.includes("typology")) return "Archive";
      if (cleanPathLower.includes("soundboard") || cleanPathLower.includes("hydrophone")) return "Hydrophone";

      let clean = (rawTitle || "")
        .replace(/Page$/, "")
        .replace(/View$/, "")
        .replace(/([A-Z])/g, " $1")
        .trim();

      if (!clean || /^(home|dashboard|profile|settings|more|bookmark|portfolioitem|primaryworkspace|curatedarchivalfolio|editorialmonographcover|admincontent)$/i.test(clean.replace(/\s+/g, ""))) {
        clean = cleanPath
          .replace(/^\//, "")
          .split(/[-_]+/)
          .map(w => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ");
      }
      return clean;
    };

    // 1. If planned routes exist, prioritize curating them into clean domain labels
    if (plannedRoutes && plannedRoutes.length > 0) {
      const forbiddenLabels = /^(home|dashboard|profile|settings|more|bookmark|portfolioitem|primaryworkspace|curatedarchivalfolio|editorialmonographcover|admincontent)$/i;
      const seenPaths = new Set<string>();

      for (const r of plannedRoutes) {
        const cleanPath = r.path.startsWith("/") ? r.path : `/${r.path}`;
        if (seenPaths.has(cleanPath)) continue;

        // Never permit section-layer IDs to leak into navigation
        if (isSectionSlug(cleanPath)) continue;

        // If authoritative routes are locked, every nav link MUST be in that authoritative set
        if (hasAuthoritative && !authoritativeSet.has(cleanPath)) continue;

        seenPaths.add(cleanPath);

        const cleanLabel = formatCleanLabel(cleanPath, r.title);
        if (!forbiddenLabels.test(cleanLabel.replace(/\s+/g, ""))) {
          primary.push({
            path: cleanPath,
            label: cleanLabel,
            isPrimary: cleanPath === "/"
          });
        }

        if (primary.length >= 6) break;
      }

      // If authoritative routes exist and some were not in plannedRoutes, ensure they are represented
      if (hasAuthoritative) {
        for (const reqRoute of authoritativeSet) {
          if (seenPaths.has(reqRoute) || isSectionSlug(reqRoute)) continue;
          seenPaths.add(reqRoute);
          primary.push({
            path: reqRoute,
            label: formatCleanLabel(reqRoute),
            isPrimary: reqRoute === "/"
          });
          if (primary.length >= 6) break;
        }
      }

      if (primary.length > 0) {
        // Ensure root '/' is always present
        if (!primary.some(p => p.path === "/")) {
          primary.unshift({
            path: "/",
            label: formatCleanLabel("/"),
            isPrimary: true
          });
        }
        return { primary, secondary: [] };
      }
    }

    // 2. If authoritativeRequiredRoutes provided directly without plannedRoutes
    if (hasAuthoritative) {
      const seenPaths = new Set<string>();
      for (const reqRoute of authoritativeSet) {
        if (isSectionSlug(reqRoute) || seenPaths.has(reqRoute)) continue;
        seenPaths.add(reqRoute);
        primary.push({
          path: reqRoute,
          label: formatCleanLabel(reqRoute),
          isPrimary: reqRoute === "/"
        });
        if (primary.length >= 6) break;
      }
      if (primary.length > 0) {
        if (!primary.some(p => p.path === "/")) {
          primary.unshift({
            path: "/",
            label: formatCleanLabel("/"),
            isPrimary: true
          });
        }
        return { primary, secondary: [] };
      }
    }

    // 3. Fallback: Derive navigation items dynamically from prompt capabilities & semantic features
    primary.push({
      path: "/",
      label: is3DWorld ? "3D Stage" : isEditorial ? "Monograph" : isWatch ? "Collection" : isPerfume ? "The Flacon" : "Explore",
      isPrimary: true,
    });

    const candidateLinks: Array<{ path: string; label: string }> = [];
    if (lower.includes("quest") || lower.includes("trial") || lower.includes("mission")) {
      candidateLinks.push({ path: "/quests", label: "Quests" });
    }
    if (lower.includes("character") || lower.includes("companion") || lower.includes("avatar")) {
      candidateLinks.push({ path: "/characters", label: "Companions" });
    } else if (lower.includes("specimen") || lower.includes("creature")) {
      candidateLinks.push({ path: "/specimens", label: "Specimens" });
    } else if (lower.includes("craftsmanship") || lower.includes("caliber")) {
      candidateLinks.push({ path: "/craftsmanship", label: "Craftsmanship" });
    } else if (lower.includes("case-stud") || lower.includes("case stud")) {
      candidateLinks.push({ path: "/case-studies", label: "Case Studies" });
    } else if (lower.includes("essay") || lower.includes("article")) {
      candidateLinks.push({ path: "/read-longform-article", label: "Essays" });
    }

    if (lower.includes("soundboard") || lower.includes("audio") || lower.includes("hydrophone")) {
      candidateLinks.push({ path: "/soundboard", label: lower.includes("hydrophone") ? "Hydrophone" : "Soundboard" });
    } else if (lower.includes("calibers") || lower.includes("complication")) {
      candidateLinks.push({ path: "/calibers", label: "Calibers" });
    } else if (lower.includes("fragrance") || lower.includes("notes") || lower.includes("scent")) {
      candidateLinks.push({ path: "/fragrance-notes", label: "Fragrance Notes" });
    } else if (lower.includes("visual-essays") || lower.includes("visual story")) {
      candidateLinks.push({ path: "/visual-essays", label: "Visual Essays" });
    }

    if (lower.includes("scroll") || lower.includes("journey") || lower.includes("expedition") || lower.includes("logbook")) {
      candidateLinks.push({ path: "/scrolls", label: lower.includes("logbook") ? "Logbook" : "Journey Scroll" });
    } else if (lower.includes("viewing") || lower.includes("salon") || lower.includes("consultation")) {
      candidateLinks.push({ path: "/viewing", label: "Private Viewing" });
    } else if (lower.includes("archive") || lower.includes("typology") || lower.includes("folio")) {
      candidateLinks.push({ path: "/archive", label: "Typology Archive" });
    } else if (lower.includes("story") || lower.includes("atelier")) {
      candidateLinks.push({ path: "/story", label: "The Atelier" });
    }

    for (const link of candidateLinks) {
      if (hasAuthoritative && !authoritativeSet.has(link.path)) continue;
      primary.push(link);
      if (primary.length >= 6) break;
    }

    return { primary, secondary: [] };
  }

  private static deriveVisualTreatment(
    model: NavigationModel,
    tone: string | undefined,
    isEditorial: boolean,
    isPerfume: boolean,
    is3DWorld: boolean
  ): NavigationVisualTreatment {
    if (isPerfume) {
      return {
        typography: "font-serif tracking-widest text-xs uppercase",
        geometry: "rounded-full px-8 py-3.5 border border-amber-500/20 shadow-2xl backdrop-blur-xl",
        surface: "bg-stone-950/70 border border-stone-800/80 shadow-black/80",
        activeState: "text-amber-200 border-b border-amber-400/80 pb-0.5 font-medium",
        motion: "transition-all duration-500 ease-out",
        containerClass: "fixed top-6 left-1/2 -translate-x-1/2 z-50",
        navClass: "flex items-center gap-6",
        activeItemClass: "text-amber-300 font-medium tracking-widest border-b border-amber-400 pb-0.5",
        inactiveItemClass: "text-stone-400 hover:text-stone-200 transition-colors tracking-widest"
      };
    }

    if (isEditorial) {
      return {
        typography: "font-serif tracking-wider text-xs sm:text-sm uppercase",
        geometry: "border-b border-stone-800 px-6 sm:px-12 py-5",
        surface: "bg-stone-950/90 backdrop-blur-md border-b border-white/10",
        activeState: "text-white font-semibold underline underline-offset-8 decoration-1",
        motion: "transition-all duration-300 ease-in-out",
        containerClass: "sticky top-0 z-50 w-full",
        navClass: "max-w-7xl mx-auto flex items-center justify-between",
        activeItemClass: "text-white font-medium underline underline-offset-8 decoration-stone-400",
        inactiveItemClass: "text-stone-400 hover:text-stone-100 transition-colors"
      };
    }

    if (is3DWorld) {
      if (model === "bottom_dock") {
        return {
          typography: "font-sans font-bold tracking-tight text-xs sm:text-sm",
          geometry: "rounded-2xl px-6 py-3 border border-amber-400/40 shadow-2xl backdrop-blur-xl",
          surface: "bg-slate-950/90 border border-amber-400/30 shadow-amber-950/40",
          activeState: "bg-amber-400/25 text-amber-300 shadow-inner rounded-xl px-3 py-1",
          motion: "transition-transform duration-200 hover:-translate-y-1",
          containerClass: "fixed bottom-6 left-1/2 -translate-x-1/2 z-50",
          navClass: "flex items-center gap-3",
          activeItemClass: "bg-amber-500/25 text-amber-300 font-bold px-3 py-1.5 rounded-xl border border-amber-400/40",
          inactiveItemClass: "text-slate-300 hover:text-amber-200 px-3 py-1.5 transition-colors"
        };
      }
      return {
        typography: "font-sans font-bold tracking-tight text-xs sm:text-sm",
        geometry: "rounded-2xl px-6 py-3 border border-cyan-500/30 shadow-2xl backdrop-blur-xl",
        surface: "bg-slate-950/80 border border-cyan-500/20 shadow-cyan-950/40",
        activeState: "bg-cyan-500/20 text-cyan-300 shadow-inner shadow-cyan-500/30 rounded-xl px-3 py-1",
        motion: "transition-transform duration-200 hover:scale-105",
        containerClass: "fixed top-5 left-1/2 -translate-x-1/2 z-50",
        navClass: "flex items-center gap-4",
        activeItemClass: "bg-cyan-500/20 text-cyan-300 font-bold px-3 py-1.5 rounded-xl border border-cyan-400/40",
        inactiveItemClass: "text-slate-400 hover:text-cyan-200 px-3 py-1.5 transition-colors"
      };
    }

    return {
      typography: "font-sans font-medium text-sm",
      geometry: "rounded-full px-6 py-2.5 shadow-lg backdrop-blur-md",
      surface: "bg-stone-900/90 border border-stone-800",
      activeState: "bg-stone-800 text-white rounded-full px-3 py-1",
      motion: "transition-colors duration-200",
      containerClass: "sticky top-4 left-1/2 -translate-x-1/2 z-50 inline-block",
      navClass: "flex items-center gap-3",
      activeItemClass: "bg-white/10 text-white font-semibold px-3 py-1 rounded-full",
      inactiveItemClass: "text-stone-400 hover:text-white px-3 py-1 transition-colors"
    };
  }

  public static computeFingerprint(design: NavigationDesign): NavbarFingerprint {
    const itemsList = design.primaryItems.map(i => i.label);
    const hash = `${design.model}:${design.position}:${itemsList.length}items:${design.brandTreatment.logoType}:${design.brandTreatment.name}:${itemsList.join("-")}`;
    return {
      model: design.model,
      position: design.position,
      itemCount: itemsList.length,
      itemsList,
      brandName: design.brandTreatment.name,
      logoType: design.brandTreatment.logoType,
      hasMoreMenu: Boolean(design.secondaryItems && design.secondaryItems.length > 0),
      surfaceType: design.visualTreatment.surface,
      activeStateType: design.visualTreatment.activeState,
      typographyStyle: design.visualTreatment.typography,
      fingerprintHash: hash
    };
  }

  /**
   * Generates clean, idiomatic React Navbar code matching the specific NavigationDesign model.
   * Eliminates generic shells, truncated names, and arbitrary 'More' menus.
   */
  public static generateNavbarCode(design: NavigationDesign): string {
    const brand = design.brandTreatment.name;
    const itemsCode = design.primaryItems
      .map(item => `    { path: "${item.path}", label: "${item.label}" }`)
      .join(",\n");

    if (design.model === "minimal_wordmark") {
      return `import React from "react";
import { Link, useLocation } from "react-router-dom";

export function Navbar() {
  const location = useLocation();
  const navItems = [
${itemsCode}
  ];

  return (
    <header className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-4xl">
      <div className="bg-stone-950/75 backdrop-blur-xl border border-amber-500/20 rounded-full px-6 sm:px-8 py-3.5 shadow-2xl flex items-center justify-between">
        <Link to="/" className="font-serif tracking-[0.25em] text-sm font-semibold text-amber-100 hover:text-amber-300 transition-colors uppercase">
          ${brand}
        </Link>
        <nav className="flex items-center gap-6 text-xs tracking-widest uppercase font-serif">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={
                  isActive
                    ? "text-amber-200 border-b border-amber-400 pb-0.5 font-medium transition-all"
                    : "text-stone-400 hover:text-stone-200 transition-colors"
                }
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

export default Navbar;
`;
    }

    if (design.model === "top_masthead") {
      const mastheadSubtitle = design.brandTreatment.tagline ? design.brandTreatment.tagline.slice(0, 32) : "Editorial Journal";
      return `import React from "react";
import { Link, useLocation } from "react-router-dom";

export function Navbar() {
  const location = useLocation();
  const navItems = [
${itemsCode}
  ];

  return (
    <header className="sticky top-0 z-50 bg-stone-950/95 backdrop-blur-md border-b border-stone-800/80 px-6 sm:px-12 py-4">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-3">
          <span className="font-serif text-xl sm:text-2xl font-bold tracking-[0.2em] text-stone-100 uppercase">
            ${brand}
          </span>
          <span className="hidden md:inline-block text-[10px] tracking-widest uppercase text-stone-500 border-l border-stone-800 pl-3">
            ${mastheadSubtitle}
          </span>
        </Link>
        <nav className="flex items-center gap-6 sm:gap-8 text-xs tracking-wider uppercase font-serif">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={
                  isActive
                    ? "text-stone-100 font-semibold underline underline-offset-8 decoration-stone-400 transition-all"
                    : "text-stone-400 hover:text-stone-200 transition-colors"
                }
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

export default Navbar;
`;
    }

    if (design.model === "immersive_hud") {
      const badgeInitials = (brand.length >= 2 ? brand.slice(0, 2) : "KZ").toUpperCase();
      return `import React from "react";
import { Link, useLocation } from "react-router-dom";

export function Navbar() {
  const location = useLocation();
  const navItems = [
${itemsCode}
  ];

  return (
    <header className="fixed top-5 left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-5xl">
      <div className="bg-slate-950/85 backdrop-blur-xl border border-cyan-500/30 rounded-2xl px-6 py-3 shadow-2xl shadow-cyan-950/50 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 font-sans font-black tracking-tight text-white hover:text-cyan-300 transition-colors">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-amber-400 flex items-center justify-center text-slate-950 font-black text-xs shadow-md">
            ${badgeInitials}
          </div>
          <span className="text-base tracking-wide font-black uppercase text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-amber-300">
            ${brand}
          </span>
        </Link>
        <nav className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm font-bold">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={
                  isActive
                    ? "bg-cyan-500/20 text-cyan-300 font-bold px-3.5 py-1.5 rounded-xl border border-cyan-400/40 shadow-inner shadow-cyan-500/30 transition-all"
                    : "text-slate-400 hover:text-cyan-200 px-3 py-1.5 transition-colors"
                }
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

export default Navbar;
`;
    }

    if (design.model === "sidebar") {
      return `import React from "react";
import { Link, useLocation } from "react-router-dom";

export function Navbar() {
  const location = useLocation();
  const navItems = [
${itemsCode}
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 p-6 flex flex-col justify-between shrink-0">
      <div>
        <Link to="/" className="flex items-center gap-2.5 mb-8">
          <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center text-slate-950 font-bold text-xs">
            \${badgeInitials}
          </div>
          <span className="font-bold tracking-tight text-white text-base">\${brand}</span>
        </Link>
        <nav className="flex flex-col gap-1.5">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={
                  isActive
                    ? "bg-slate-800 text-emerald-400 font-medium px-3 py-2 rounded-lg text-sm border-l-2 border-emerald-400 transition-all"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 px-3 py-2 rounded-lg text-sm transition-colors"
                }
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}

export default Navbar;
`;
    }

    if (design.model === "bottom_dock") {
      const initials = (brand.length >= 2 ? brand.slice(0, 2) : "KZ").toUpperCase();
      return `import React from "react";
import { Link, useLocation } from "react-router-dom";

export function Navbar() {
  const location = useLocation();
  const navItems = [
${itemsCode}
  ];

  return (
    <header className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-fit max-w-[94%] mx-auto">
      <div className="bg-slate-950/90 backdrop-blur-2xl border border-amber-400/40 rounded-2xl px-6 py-3 shadow-2xl shadow-black/80 flex items-center gap-4 sm:gap-6">
        <Link to="/" className="flex items-center gap-2 font-bold text-xs sm:text-sm tracking-wide text-white hover:text-amber-300 transition-colors">
          <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 font-black text-xs shadow-md">
            ${initials}
          </div>
          <span className="hidden sm:inline-block font-black text-amber-200 uppercase tracking-widest">${brand}</span>
        </Link>
        <nav className="flex items-center gap-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={
                  isActive
                    ? "bg-amber-400/20 text-amber-300 font-bold px-3.5 py-1.5 rounded-xl border border-amber-400/40 shadow-inner transition-all"
                    : "text-slate-300 hover:text-white px-3 py-1.5 text-xs sm:text-sm transition-colors"
                }
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

export default Navbar;
`;
    }

    // Default floating pills
    return `import React from "react";
import { Link, useLocation } from "react-router-dom";

export function Navbar() {
  const location = useLocation();
  const navItems = [
${itemsCode}
  ];

  return (
    <header className="sticky top-4 left-1/2 -translate-x-1/2 z-50 w-fit max-w-[94%] mx-auto">
      <div className="bg-stone-900/90 backdrop-blur-md border border-stone-700/60 rounded-full px-5 py-2 shadow-xl flex items-center gap-4 sm:gap-6">
        <Link to="/" className="font-bold text-sm tracking-tight text-white hover:text-stone-300 transition-colors">
          ${brand}
        </Link>
        <nav className="flex items-center gap-1.5 sm:gap-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={
                  isActive
                    ? "bg-white/15 text-white font-medium px-3 py-1 rounded-full text-xs sm:text-sm transition-all"
                    : "text-stone-400 hover:text-stone-200 px-3 py-1 text-xs sm:text-sm transition-colors"
                }
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

export default Navbar;
`;
  }
}
