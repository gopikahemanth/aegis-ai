/**
 * ExperienceCapabilityPlan & ExperienceCapabilityResolver
 *
 * Deterministically resolves the overarching visual experience capability,
 * rendering technology, interaction model, and runtime contracts from the prompt.
 *
 * Prevents generic convergence (e.g., turning rich 3D worlds into flat 2D cards).
 */

export type ExperienceType =
  | "IMMERSIVE_3D"
  | "WEBGL_EXPERIENCE"
  | "SCROLL_STORY"
  | "INTERACTIVE_MAP"
  | "DATA_VISUALIZATION"
  | "CINEMATIC"
  | "GAME_LIKE"
  | "PRODUCT_CONFIGURATOR"
  | "EDITORIAL"
  | "DASHBOARD"
  | "COMMERCE"
  | "PORTFOLIO"
  | "STANDARD_WEB";

export type RenderingMode =
  | "webgl"
  | "canvas2d"
  | "svg-interactive"
  | "css-motion"
  | "standard-dom";

export type InteractionMode =
  | "scroll-driven-storytelling"
  | "spatial-navigation"
  | "direct-manipulation"
  | "dashboard-monitoring"
  | "standard-web";

export type CompositionMode =
  | "cinematic-world"
  | "spatial-stage"
  | "split-narrative"
  | "immersive-canvas"
  | "modular-dashboard"
  | "standard-flow";

export type MotionMode =
  | "continuous-scroll-linked"
  | "ambient-physics"
  | "event-driven"
  | "minimal-transitions";

export type DepthModel =
  | "foreground-midground-background-3d"
  | "layered-parallax"
  | "flat-surface";

export type NavigationModel =
  | "floating-overlay"
  | "spatial-compass"
  | "bottom-tab"
  | "top-nav"
  | "minimal-hud";

export type ResponsiveStrategy =
  | "adaptive-3d"
  | "spatial-to-vertical"
  | "standard-responsive";

export interface ExperienceCapabilityPlan {
  experienceType: ExperienceType;
  renderingMode: RenderingMode;
  interactionMode: InteractionMode;
  compositionMode: CompositionMode;
  motionMode: MotionMode;
  depthModel: DepthModel;
  mediaModel: string;
  mediaRequirements: string[];
  assetRequirements: string[];
  navigationModel: NavigationModel;
  responsiveStrategy: ResponsiveStrategy;
  performanceStrategy: string;
  accessibilityStrategy: string;
  requiredRuntimeCapabilities: string[];
  requiredVisualSignals: string[];
  forbiddenSubstitutions: string[];
  real3dRequired: boolean;
}

export class ExperienceCapabilityResolver {
  /**
   * Deterministically resolves the ExperienceCapabilityPlan from user prompt,
   * product characteristics, and optional specification.
   */
  public static resolve(
    prompt: string,
    characteristics?: any,
    specification?: any
  ): ExperienceCapabilityPlan {
    const rawPrompt = (prompt || specification?.userPrompt || "").toLowerCase();

    const isWatchStudio = Boolean(
      /\b(watch|watches|horology|timepiece|timepieces|watchmaker|artisan watch)\b/i.test(rawPrompt) &&
      /\b(rotate|showcase|studio|craftsmanship|loupe|complication|movement|dial)\b/i.test(rawPrompt)
    );

    // 1. Detect Real 3D / WebGL requirements
    const is3DExplicit = Boolean(
      isWatchStudio ||
      /\b(3d|webgl|three\.?js|react three fiber|r3f|claymation|volumetric|spatial world|virtual world|3d animated|3d scene|3d model|3d viewer|camera-driven|spatial environment|3d claymation|planetarium|solar orrery|orrery|rotate watches|rotat\w+ (?:watch|product|timepiece)|interactive 3d)\b/i.test(rawPrompt)
    );

    // 2. Detect Scrollytelling requirements
    const isScrollytelling = Boolean(
      /\b(scrollytelling|scroll-driven|journey scroll|narrative scroll|pinned scenes|story chapters|scroll narrative)\b/i.test(rawPrompt)
    );

    // 3. Detect Interactive Map requirements
    const isInteractiveMap = Boolean(
      /\b(interactive map|world explorer|quest map|geographic|atlas|cartography|map explorer|map pins|selectable regions)\b/i.test(rawPrompt)
    );

    // 4. Detect Product Configurator requirements
    const isProductConfigurator = Boolean(
      /\b(product configurator|3d customizer|fixture configurator|customizer|configurator)\b/i.test(rawPrompt)
    );

    // 5. Detect Data-dense Dashboard requirements
    const isDashboard = Boolean(
      characteristics?.experiencePattern === "operations-dashboard" ||
      characteristics?.experiencePattern === "realtime-console" ||
      /\b(dashboard|telemetry|kpi|analytics|monitoring|ops console|data metrics)\b/i.test(rawPrompt)
    );

    // 6. Detect Commerce requirements
    const isCommerce = Boolean(
      characteristics?.experiencePattern === "storefront-commerce" ||
      /\b(storefront|marketplace|e-commerce|ecommerce|shopping cart)\b/i.test(rawPrompt)
    );

    // 7. Detect Editorial requirements
    const isEditorial = Boolean(
      !is3DExplicit &&
      !isWatchStudio &&
      (characteristics?.emotionalTone?.primary === "editorial" ||
       /\b(magazine|longform journalism|case study spread|architecture journal|monograph|journal)\b/i.test(rawPrompt))
    );

    // 8. Detect Portfolio requirements
    const isPortfolio = Boolean(
      characteristics?.experiencePattern === "showcase-landing" ||
      /\b(portfolio|design studio|curated works|artist showcase)\b/i.test(rawPrompt)
    );

    if (is3DExplicit) {
      return {
        experienceType: "IMMERSIVE_3D",
        renderingMode: "webgl",
        interactionMode: isScrollytelling ? "scroll-driven-storytelling" : "spatial-navigation",
        compositionMode: "cinematic-world",
        motionMode: "continuous-scroll-linked",
        depthModel: "foreground-midground-background-3d",
        mediaModel: "procedural-3d-geometry + ambient-audio",
        mediaRequirements: [
          "WebGL canvas with active context",
          "PerspectiveCamera with animated or user-orbit controls",
          "Directional & ambient lighting with materials",
          "Three.js mesh geometry (cubes, spheres, terrain, characters, or clouds)",
          "requestAnimationFrame continuous render loop",
        ],
        assetRequirements: [
          "Procedural 3D meshes (claymation primitives: grouped spheres, cylinders, rounded terrain)",
          "Material shaders or MeshStandardMaterial with tactile finish",
          "Audio synthesis or sound effect triggers",
        ],
        navigationModel: "floating-overlay",
        responsiveStrategy: "adaptive-3d",
        performanceStrategy: "dynamic-dpr + frustum-culling",
        accessibilityStrategy: "aria-landmarks + dom-overlay-accessibility",
        requiredRuntimeCapabilities: [
          "webgl-canvas",
          "scene-ready",
          "camera-controller",
          "continuous-render-loop",
          "interactive-raycasting-or-pointers",
        ],
        requiredVisualSignals: [
          "canvas[data-aegis-3d]",
          "perspective-camera",
          "mesh-objects",
          "animation-loop",
        ],
        forbiddenSubstitutions: [
          "cards-for-world",
          "css-transforms-for-3d",
          "static-images-for-3d-scene",
          "generic-hero-grid",
        ],
        real3dRequired: true,
      };
    }

    if (isScrollytelling) {
      return {
        experienceType: "SCROLL_STORY",
        renderingMode: "canvas2d",
        interactionMode: "scroll-driven-storytelling",
        compositionMode: "split-narrative",
        motionMode: "continuous-scroll-linked",
        depthModel: "layered-parallax",
        mediaModel: "scene-illustrations + scroll-linked-audio",
        mediaRequirements: [
          "Pinned viewport scenes",
          "Scroll progress listener updating narrative chapter state",
          "Layered foreground/midground/background parallax",
        ],
        assetRequirements: ["SVG scene vectors", "Chapter badges", "Illustrations"],
        navigationModel: "floating-overlay",
        responsiveStrategy: "spatial-to-vertical",
        performanceStrategy: "requestAnimationFrame scroll throttling",
        accessibilityStrategy: "accessible-reduced-motion-fallback",
        requiredRuntimeCapabilities: ["scroll-progress-controller", "chapter-transitions"],
        requiredVisualSignals: ["pinned-scene-container", "narrative-progress-indicator"],
        forbiddenSubstitutions: ["ordinary-stacked-sections-for-story"],
        real3dRequired: false,
      };
    }

    if (isInteractiveMap) {
      return {
        experienceType: "INTERACTIVE_MAP",
        renderingMode: "svg-interactive",
        interactionMode: "spatial-navigation",
        compositionMode: "spatial-stage",
        motionMode: "event-driven",
        depthModel: "flat-surface",
        mediaModel: "interactive-map-coordinates",
        mediaRequirements: [
          "Interactive SVG / Canvas map with selectable nodes/regions",
          "Tooltip or detail inspector on hover/click",
        ],
        assetRequirements: ["Map coordinate paths", "Pin markers", "Region textures"],
        navigationModel: "spatial-compass",
        responsiveStrategy: "standard-responsive",
        performanceStrategy: "vector-caching",
        accessibilityStrategy: "accessible-list-view-alternative",
        requiredRuntimeCapabilities: ["map-selection-state", "zoom-pan-controls"],
        requiredVisualSignals: ["map-container", "selectable-landmarks"],
        forbiddenSubstitutions: ["static-image-for-map"],
        real3dRequired: false,
      };
    }

    if (isProductConfigurator) {
      return {
        experienceType: "PRODUCT_CONFIGURATOR",
        renderingMode: "canvas2d",
        interactionMode: "direct-manipulation",
        compositionMode: "spatial-stage",
        motionMode: "event-driven",
        depthModel: "flat-surface",
        mediaModel: "parametric-canvas-visualizer",
        mediaRequirements: [
          "Interactive live preview updating on dimension/material changes",
          "Control sliders and parameter selectors",
        ],
        assetRequirements: ["Color finishes", "Material textures", "Dimension specs"],
        navigationModel: "top-nav",
        responsiveStrategy: "standard-responsive",
        performanceStrategy: "canvas-dirty-rect-render",
        accessibilityStrategy: "standard-form-labels",
        requiredRuntimeCapabilities: ["live-spec-calculation", "instant-visual-refresh"],
        requiredVisualSignals: ["interactive-canvas-preview", "parameter-controls"],
        forbiddenSubstitutions: ["static-product-photo-for-configurator"],
        real3dRequired: false,
      };
    }

    if (isDashboard) {
      return {
        experienceType: "DASHBOARD",
        renderingMode: "standard-dom",
        interactionMode: "dashboard-monitoring",
        compositionMode: "modular-dashboard",
        motionMode: "event-driven",
        depthModel: "flat-surface",
        mediaModel: "data-charts + metrics",
        mediaRequirements: ["Metric indicators", "Time-series charts", "Filter controls"],
        assetRequirements: ["Lucide icons", "Chart palettes"],
        navigationModel: "top-nav",
        responsiveStrategy: "standard-responsive",
        performanceStrategy: "virtualized-tables",
        accessibilityStrategy: "aria-tables + high-contrast",
        requiredRuntimeCapabilities: ["data-filtering", "metric-calculations"],
        requiredVisualSignals: ["kpi-metrics", "data-charts"],
        forbiddenSubstitutions: [],
        real3dRequired: false,
      };
    }

    if (isCommerce) {
      return {
        experienceType: "COMMERCE",
        renderingMode: "standard-dom",
        interactionMode: "standard-web",
        compositionMode: "standard-flow",
        motionMode: "event-driven",
        depthModel: "flat-surface",
        mediaModel: "product-imagery + cart",
        mediaRequirements: ["Product catalog", "Cart drawer", "Category filters"],
        assetRequirements: ["Product images", "Badge tokens"],
        navigationModel: "top-nav",
        responsiveStrategy: "standard-responsive",
        performanceStrategy: "lazy-loaded-images",
        accessibilityStrategy: "aria-live-cart",
        requiredRuntimeCapabilities: ["cart-state", "filter-state"],
        requiredVisualSignals: ["product-cards", "cart-button"],
        forbiddenSubstitutions: [],
        real3dRequired: false,
      };
    }

    if (isEditorial) {
      return {
        experienceType: "EDITORIAL",
        renderingMode: "standard-dom",
        interactionMode: "standard-web",
        compositionMode: "split-narrative",
        motionMode: "minimal-transitions",
        depthModel: "flat-surface",
        mediaModel: "typography + hero-photography",
        mediaRequirements: ["Serif typography", "Asymmetric article layouts", "Drop caps"],
        assetRequirements: ["Editorial photography", "Pull quotes"],
        navigationModel: "top-nav",
        responsiveStrategy: "standard-responsive",
        performanceStrategy: "system-fonts-optimized",
        accessibilityStrategy: "semantic-article-landmarks",
        requiredRuntimeCapabilities: ["reading-progress"],
        requiredVisualSignals: ["editorial-typography", "pull-quotes"],
        forbiddenSubstitutions: [],
        real3dRequired: false,
      };
    }

    if (isPortfolio) {
      return {
        experienceType: "PORTFOLIO",
        renderingMode: "css-motion",
        interactionMode: "standard-web",
        compositionMode: "cinematic-world",
        motionMode: "continuous-scroll-linked",
        depthModel: "layered-parallax",
        mediaModel: "case-study-visuals",
        mediaRequirements: ["Case study showcases", "Project galleries", "Interactive modal previews"],
        assetRequirements: ["High-res screenshots", "Design artifacts"],
        navigationModel: "top-nav",
        responsiveStrategy: "standard-responsive",
        performanceStrategy: "image-srcset",
        accessibilityStrategy: "alt-text-compliance",
        requiredRuntimeCapabilities: ["project-filtering"],
        requiredVisualSignals: ["curated-work-showcase"],
        forbiddenSubstitutions: [],
        real3dRequired: false,
      };
    }

    // Default fallback
    return {
      experienceType: "STANDARD_WEB",
      renderingMode: "standard-dom",
      interactionMode: "standard-web",
      compositionMode: "standard-flow",
      motionMode: "minimal-transitions",
      depthModel: "flat-surface",
      mediaModel: "standard-ui-assets",
      mediaRequirements: ["Responsive layout", "Standard navigation"],
      assetRequirements: ["Standard icons"],
      navigationModel: "top-nav",
      responsiveStrategy: "standard-responsive",
      performanceStrategy: "standard-bundle-optimization",
      accessibilityStrategy: "wcag-aa",
      requiredRuntimeCapabilities: ["navigation", "interactive-controls"],
      requiredVisualSignals: ["page-headings", "interactive-buttons"],
      forbiddenSubstitutions: [],
      real3dRequired: false,
    };
  }
}
