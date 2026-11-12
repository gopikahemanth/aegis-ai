/**
 * Aegis AI — Visual Asset System Types
 *
 * Authoritative types for the Autonomous Visual Asset, Photography,
 * and Image Generation Engine.
 */

export type AssetCategory =
  | "hero-photography"
  | "background-photography"
  | "product-photography"
  | "architecture-photography"
  | "destination-photography"
  | "lifestyle-photography"
  | "food-photography"
  | "team-portrait"
  | "illustration"
  | "3d-render"
  | "diagram"
  | "texture"
  | "pattern"
  | "icon"
  | "map"
  | "chart"
  | "infographic"
  | "product-screenshot";

export type AssetSourceMethod =
  | "GENERATED"
  | "SOURCED"
  | "USER_PROVIDED"
  | "NOT_REQUIRED"
  | "FAILED"
  | "NOT_VERIFIED";

export type AspectRatio =
  | "16:9"
  | "4:3"
  | "1:1"
  | "3:4"
  | "21:9"
  | "9:16"
  | "2:1";

export interface PageVisualAsset {
  /** Unique stable asset ID, e.g. 'ast-arch-hero-01' */
  id: string;
  /** Route / page this asset belongs to, e.g. '/', '/portfolio' */
  page: string;
  /** Section name or component target, e.g. 'HeroLanding', 'MaterialSwatchboard' */
  section: string;
  /** Human-readable purpose and intent */
  purpose: string;
  /** Primary category of asset */
  category: AssetCategory;
  /** Subject of the visual content */
  subject: string;
  /** Visual composition guidelines (framing, perspective, focal point) */
  visualComposition: string;
  /** Art direction style matching the project's visual thesis */
  artDirection: string;
  /** Color direction and harmony requirements */
  colorDirection: string;
  /** Target aspect ratio */
  aspectRatio: AspectRatio;
  /** Resolution descriptor, e.g. '1920x1080', '1200x800' */
  resolution: string;
  /** Focal point position, e.g. 'center', 'top-left' */
  focalPoint: string;
  /** Cropping mode in CSS ('cover' | 'contain' | 'fill') */
  cropping: "cover" | "contain" | "fill";
  /** Desktop layout presentation style */
  desktopPresentation: string;
  /** Mobile layout presentation and stacking style */
  mobilePresentation: string;
  /** Meaningful accessibility description (never generic or blank) */
  altText: string;
  /** Detailed image generation prompt constructed for AI providers */
  prompt: string;
  /** Sourcing or generation method */
  sourceMethod: AssetSourceMethod;
  /** Destination path relative to project root */
  localDestination: string;
  /** Resolved high-res image URL, SVG markup, or data URI */
  resolvedUrl: string;
  /** License descriptor (e.g. 'Unsplash Commercial', 'MIT', 'Original AI') */
  license: string;
  /** Attribution notice where applicable */
  attribution?: string;
  /** Loading priority for web performance */
  priority: "high" | "medium" | "low";
  /** Optional fallback URL if primary fails to load */
  fallbackUrl?: string;
}

export interface AssetManifest {
  version: "1.0";
  manifestId: string;
  projectName: string;
  domain: string;
  visualThesis: string;
  assets: PageVisualAsset[];
  assetCount: number;
  categoriesCount: Record<string, number>;
  sourcesCount: Record<string, number>;
  generatedAt: string;
  status: "COMPLETE" | "PARTIAL" | "FAILED";
}
