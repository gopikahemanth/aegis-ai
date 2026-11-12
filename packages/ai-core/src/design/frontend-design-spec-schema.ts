/**
 * Aegis AI — Frontend Design Specification Schema
 *
 * Defines the authoritative TypeScript interfaces and validation contracts
 * for machine-readable frontend design specifications (.aegis/design/frontend-design-spec.json)
 * and structured design briefs (.aegis/design/frontend-design-brief.md).
 */

export interface ProductIdentitySpec {
  productName: string;
  businessDomain: string;
  productCategory: string;
  targetAudience: {
    primaryUser: string;
    techSavviness: "low" | "medium" | "high";
    context: "personal" | "professional" | "consumer" | "enterprise";
  };
  brandPersonality: string[];
  primaryUserObjective: string;
  primaryConversionOrOperationalObjective: string;
  explicitUserRequirements: string[];
  inferredRequirements: string[];
}

export interface VisualDirectionSpec {
  artDirectionName: string;
  artDirectionRationale: string;
  emotionalResponse: string;
  visualPersonality: {
    mood: string;
    formality: "casual" | "balanced" | "formal" | "luxury";
    density: "compact" | "moderate" | "spacious";
  };
  compositionStrategy: string;
  visualDifferentiators: string[];
}

export interface ColorScaleSpec {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
  950: string;
}

export interface ColorStrategySpec {
  paletteMode: "dark" | "light" | "warm_dark" | "obsidian";
  primaryBrandColor: string;
  primaryHover: string;
  primaryActive: string;
  primarySubtle: string;
  secondaryBrandColor: string;
  secondaryHover: string;
  accentColors: string[];
  backgroundColor: string;
  secondaryBackground?: string;
  surfaceColor: string;
  surfaceElevated: string;
  surfaceMuted: string;
  textHeadingColor: string;
  textPrimaryColor: string;
  textSecondaryColor: string;
  textMutedColor: string;
  textOnPrimary: string;
  borderColor: string;
  borderSubtle: string;
  focusRingColor: string;
  semanticColors: {
    success: string;
    warning: string;
    danger: string;
    info: string;
  };
  chartPalette: string[];
  contrastAudit: {
    textOnBackground: { ratio: number; passesAA: boolean };
    textOnSurface: { ratio: number; passesAA: boolean };
    textSecondaryOnSurface: { ratio: number; passesAA: boolean };
    textOnPrimaryButton: { ratio: number; passesAA: boolean };
    focusOnBackground: { ratio: number; passesAA: boolean };
    overallValid: boolean;
  };
  rationale: string;
}

export interface TypographyStrategySpec {
  displayFont: string;
  headingFont: string;
  bodyFont: string;
  uiFont: string;
  monoFont: string;
  fontWeights: {
    normal: number;
    medium: number;
    semibold: number;
    bold: number;
  };
  headingScale: {
    display: string;
    h1: string;
    h2: string;
    h3: string;
  };
  bodyScale: {
    lead: string;
    base: string;
    small: string;
    micro: string;
  };
  lineHeights: {
    headings: number | string;
    body: number | string;
  };
  letterSpacing: {
    headings: string;
    body: string;
    uppercase: string;
  };
  responsiveTypographyRules: string[];
}

export interface SurfaceStrategySpec {
  surfaceTreatment: "flat_ruled" | "subtle_elevation" | "translucent_glass" | "solid_depth" | "paper_tactile";
  cardShadow: string;
  cardBorder: string;
  elevationLevels: {
    base: string;
    raised: string;
    floating: string;
  };
  radii: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
    full: string;
  };
  borders: {
    subtle: string;
    standard: string;
    accent: string;
  };
}

export interface NavigationStrategySpec {
  strategy: "TOPBAR_PILL" | "TOPBAR_EXPANSIVE" | "MINIMAL_STICKY" | "SIDEBAR_COLLAPSIBLE" | "SIDEBAR_EXPANDED" | "FLOATING_ISLAND";
  maxPrimaryItems: number;
  primaryItems: Array<{ label: string; href: string; icon?: string }>;
  secondaryNav?: {
    type: "dropdown" | "sidebar" | "tabs" | "contextual";
    items: Array<{ label: string; href: string }>;
  };
  mobileNavigation: {
    type: "drawer" | "modal" | "bottom_bar";
    breakpoint: string;
  };
}

export interface RouteDesignSpecification {
  route: string;
  pageName: string;
  purpose: string;
  userIntent: string;
  primaryAction: string;
  contentHierarchy: string[];
  sectionOrder: Array<{
    name: string;
    purpose: string;
    focalWeight: "primary" | "secondary" | "supporting";
    structure: string;
  }>;
  layout: {
    desktop: string;
    tablet: string;
    mobile: string;
  };
  visualComposition: string;
  components: string[];
  imageRequirements: {
    needed: boolean;
    type?: "photography" | "illustration" | "chart" | "spectrogram" | "schematic_svg" | "none";
    aspectRatio?: string;
    description?: string;
  };
  interactionRequirements: Array<{
    control: string;
    type: "button" | "input" | "select" | "slider" | "toggle" | "modal" | "tabs";
    trigger: string;
    feedback: string;
  }>;
  states: {
    loading: string;
    empty: string;
    error: string;
    success: string;
  };
  mobileBehavior: string;
}

export interface ResponsiveSystemSpec {
  breakpoints: {
    mobile: string;   // e.g. 360px - 640px
    tablet: string;   // e.g. 768px - 1024px
    desktop: string;  // e.g. 1024px - 1440px
    wide: string;     // e.g. 1920px
  };
  containerMaxWidth: string;
  containerPadding: {
    mobile: string;
    tablet: string;
    desktop: string;
  };
  columnGrids: {
    mobile: number;
    tablet: number;
    desktop: number;
  };
  overflowProtectionRules: string[];
}

export interface AccessibilitySpec {
  wcagTarget: "WCAG_2_1_AA" | "WCAG_2_2_AA";
  minimumContrastNormalText: number; // 4.5
  minimumContrastLargeText: number;  // 3.0
  keyboardFocusRingStyle: string;
  reducedMotionFallback: boolean;
  screenReaderAnnouncements: boolean;
  ariaRequiredAttributes: string[];
}

export interface AssetManifestEntrySpec {
  id: string;
  intendedSection: string;
  subject: string;
  assetType: "photo" | "illustration" | "icon" | "chart" | "diagram" | "schematic_svg";
  source: string;
  altText: string;
  aspectRatio: string;
  localPath: string;
  fallbackStrategy: string;
}

export interface AssetStrategySpec {
  imagesNeeded: boolean;
  artDirection: string;
  manifest: AssetManifestEntrySpec[];
  zeroBrokenImagesGuaranteed: boolean;
}

export interface ResearchRationaleSpec {
  domain: string;
  category: string;
  referencesResearched: Array<{
    name: string;
    urlOrSource: string;
    date: string;
    insight: string;
  }>;
  conventionsObserved: string[];
  principlesDerived: string[];
  researchMode: "LIVE_NETWORK" | "AUTONOMOUS_GROUNDED_CATALOG";
}

/**
 * Root Frontend Design Specification Contract
 */
export interface FrontendDesignSpec {
  version: "1.0.0";
  specId: string;
  createdAt: string;
  projectIdentity: ProductIdentitySpec;
  visualDirection: VisualDirectionSpec;
  colorStrategy: ColorStrategySpec;
  typographyStrategy: TypographyStrategySpec;
  surfaceStrategy: SurfaceStrategySpec;
  navigationStrategy: NavigationStrategySpec;
  pages: RouteDesignSpecification[];
  responsiveSystem: ResponsiveSystemSpec;
  accessibility: AccessibilitySpec;
  assetStrategy: AssetStrategySpec;
  researchRationale: ResearchRationaleSpec;
}

export class FrontendDesignSpecValidator {
  public static validate(spec: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!spec) {
      return { valid: false, errors: ["Specification object is null or undefined"] };
    }

    if (spec.version !== "1.0.0") {
      errors.push(`Invalid spec version: expected "1.0.0", received "${spec.version}"`);
    }

    if (!spec.projectIdentity?.productName) {
      errors.push("Missing projectIdentity.productName");
    }

    if (!spec.colorStrategy?.primaryBrandColor) {
      errors.push("Missing colorStrategy.primaryBrandColor");
    }

    if (!spec.colorStrategy?.backgroundColor || !spec.colorStrategy?.surfaceColor) {
      errors.push("Missing colorStrategy background or surface colors");
    }

    if (spec.colorStrategy?.contrastAudit && !spec.colorStrategy.contrastAudit.overallValid) {
      errors.push("Color strategy failed WCAG AA contrast audit");
    }

    if (!spec.typographyStrategy?.displayFont || !spec.typographyStrategy?.bodyFont) {
      errors.push("Missing typographyStrategy font specifications");
    }

    if (!Array.isArray(spec.pages) || spec.pages.length === 0) {
      errors.push("Specification must contain at least one route specification in pages array");
    } else {
      spec.pages.forEach((p: any, idx: number) => {
        if (!p.route) errors.push(`Page [${idx}] is missing route`);
        if (!p.pageName) errors.push(`Page [${idx}] is missing pageName`);
        if (!p.layout?.desktop || !p.layout?.mobile) {
          errors.push(`Page [${idx}] (${p.route}) missing responsive layout definition`);
        }
      });
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
