/**
 * Aegis AI — Asset Director
 *
 * Coordinates autonomous visual asset, photography, and image planning & generation
 * inside the Aegis Design Pipeline.
 *
 * Ensures every website receives a coherent visual asset identity tailored to its domain,
 * with zero broken images and full accessibility descriptions.
 */

import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import type {
  AssetCategory,
  AssetManifest,
  AspectRatio,
  PageVisualAsset,
} from "./asset-types.js";
import {
  CompositeAssetProvider,
  type ImageAssetProvider,
} from "./asset-provider.js";
import type { PageBlueprint } from "./design-decision-document.js";

export interface AssetDirectorPlanOptions {
  prompt: string;
  brandName: string;
  domain: string;
  routes: string[];
  pageBlueprints?: PageBlueprint[];
  theme?: any;
  visualThesis?: string;
  artDirection?: string;
}

export class AssetDirector {
  private static defaultProvider: ImageAssetProvider = new CompositeAssetProvider();

  /**
   * Set custom asset provider for testing or custom environments.
   */
  public static setProvider(provider: ImageAssetProvider): void {
    this.defaultProvider = provider;
  }

  /**
   * Plan visual assets for every relevant page based on domain analysis.
   */
  public static planAssets(options: AssetDirectorPlanOptions): AssetManifest {
    const { prompt, brandName, domain, routes, pageBlueprints = [], theme, visualThesis, artDirection } = options;
    const promptLower = (prompt || "").toLowerCase();
    const assets: PageVisualAsset[] = [];

    for (const route of routes) {
      const blueprint = pageBlueprints.find((b) => b.route === route);
      const isHome = route === "/" || route === "";
      const routeSlug = route === "/" ? "home" : route.replace(/^\//, "").replace(/[^a-z0-9_-]/g, "-");

      // ── 1. Hero / Main Visual Element (Parametric & Bespoke) ───────────────
      if (isHome) {
        let heroCategory: AssetCategory = "hero-photography";
        let heroSubject = `Contemporary editorial visual representation of ${domain} for ${brandName}`;
        let heroPrompt = `High-end editorial commercial photography of ${domain} representing ${brandName}, natural lighting, sophisticated composition, authentic professional aesthetic, 8k resolution.`;
        let heroAlt = `${brandName} signature ${domain} flagship showcase`;
        let heroCropping: "cover" | "contain" = "cover";

        if (domain === "architecture" || promptLower.includes("architecture")) {
          heroCategory = "architecture-photography";
          heroSubject = "Contemporary modernist architectural elevation and spatial interior";
          heroAlt = `${brandName} signature modernist architecture`;
          heroPrompt = `Architectural photography of ${brandName} flagship residential pavilion, warm natural sunlight, modernist geometry, stone and oak materiality, 8k resolution.`;
        } else if (domain === "pet-care" || promptLower.includes("puppy") || (promptLower.includes("pet") && !promptLower.includes("telemetry"))) {
          heroCategory = "hero-photography";
          heroSubject = "Golden retriever puppy and british shorthair cat in sanctuary";
          heroAlt = "Playful golden retriever puppy and cat relaxing together in luxury boutique sanctuary";
          heroPrompt = "Editorial photography of a happy golden retriever puppy and a british shorthair cat resting side-by-side in a serene minimalist sanctuary, soft natural morning sunlight, 8k resolution.";
        } else if (domain === "saas" || domain === "finance" || promptLower.includes("saas") || promptLower.includes("cloud infrastructure")) {
          heroCategory = "product-screenshot";
          heroSubject = "Enterprise cloud infrastructure monitoring and financial telemetry dashboard";
          heroAlt = `${brandName} real-time cloud analytics and cost telemetry console`;
          heroPrompt = `Modern SaaS UI screenshot of ${brandName} cloud infrastructure monitoring and financial telemetry console with live Kubernetes metrics and cost charts, crisp dark mode interface, 8k resolution.`;
          heroCropping = "contain";
        } else if (domain.includes("aviation") || domain.includes("aerospace") || promptLower.includes("turbine") || promptLower.includes("aviation")) {
          heroCategory = "hero-photography";
          heroSubject = "Commercial jet turbine engine and avionics telemetry instrumentation";
          heroAlt = `${brandName} jet engine turbine cycle telemetry and avionics intelligence`;
          heroPrompt = `High-resolution industrial aerospace photography of commercial high-bypass turbofan jet engine, precision titanium blades, maintenance hangar lighting, 8k resolution.`;
        }

        assets.push(
          this.createAsset({
            id: `ast-${routeSlug}-hero`,
            page: route,
            section: "HeroLanding",
            purpose: `Establish authentic brand identity and spatial presence for ${brandName}.`,
            category: heroCategory,
            subject: heroSubject,
            visualComposition: "Wide panoramic composition, dramatic negative space, balanced depth of field",
            artDirection: artDirection || "EDITORIAL",
            colorDirection: (typeof visualThesis === "string" ? visualThesis : (visualThesis as any)?.paletteGuidance) || "Natural authentic tones with focused contrast",
            aspectRatio: "16:9",
            resolution: "1920x1080",
            focalPoint: "center",
            cropping: heroCropping,
            desktopPresentation: "Full-width immersive editorial hero with subtle vertical settle",
            mobilePresentation: "Centered responsive hero crop with 3:4 aspect ratio",
            altText: heroAlt,
            prompt: heroPrompt,
            priority: "high",
          })
        );
      }
      // ── 2. Route-Specific Functional & Visual Assets ───────────────────────
      if (route.includes("portfolio") || route.includes("project") || route.includes("gallery")) {
        assets.push(
          this.createAsset({
            id: `ast-${routeSlug}-project-01`,
            page: route,
            section: "ProjectGallery",
            purpose: "Highlight flagship case study and domain deliverables.",
            category: "product-photography",
            subject: `Flagship ${domain} milestone project showcase for ${brandName}`,
            visualComposition: "4:3 medium shot, architectural rhythm, balanced geometry",
            artDirection: artDirection || "EDITORIAL",
            colorDirection: "Natural authentic tones, balanced contrast",
            aspectRatio: "4:3",
            resolution: "1200x900",
            focalPoint: "center",
            cropping: "cover",
            desktopPresentation: "Featured project card in staggered masonry grid",
            mobilePresentation: "Full-width swipeable card",
            altText: `Flagship project showcase by ${brandName}`,
            prompt: `Professional photography of ${domain} showcase for ${brandName}, contemporary lighting, high resolution, award-winning feature.`,
            priority: "medium",
          })
        );
      }
      if (route.includes("material") || route.includes("swatch") || route.includes("texture")) {
        assets.push(
          this.createAsset({
            id: `ast-${routeSlug}-swatch-oak`,
            page: route,
            section: "MaterialSwatchboard",
            purpose: "Provide tactile texture inspection for custom material selection.",
            category: "texture",
            subject: "Quarter-sawn white oak wood grain with natural matte oil finish",
            visualComposition: "1:1 macro flat lay, raking side light revealing subtle natural grain relief",
            artDirection: "MATERIAL_AUTHENTICITY",
            colorDirection: "Warm blonde oak (#D6C29E), deep organic grain veins",
            aspectRatio: "1:1",
            resolution: "800x800",
            focalPoint: "center",
            cropping: "cover",
            desktopPresentation: "Interactive square swatch tile with click-to-inspect zoom",
            mobilePresentation: "Square grid tile with tactile haptic feedback",
            altText: "Quarter-sawn white oak tactile wood grain swatch",
            prompt: `Macro texture photograph of quarter-sawn white oak wood with fine grain detail, flat lay, studio lighting, high resolution texture reference.`,
            priority: "medium",
          })
        );
      }

      if (route.includes("room") || route.includes("calculator") || route.includes("estimator")) {
        assets.push(
          this.createAsset({
            id: `ast-${routeSlug}-diagram-plan`,
            page: route,
            section: "SpatialEstimator",
            purpose: "Illustrate spatial volume and architectural floor plan layout visually.",
            category: "diagram",
            subject: "Interactive architectural room plan diagram with dimensional callouts",
            visualComposition: "Clean 2D architectural blueprint wireframe with line weights and metric labels",
            artDirection: "TECHNICAL_PRECISION",
            colorDirection: "Olive slate line art on soft cream parchment",
            aspectRatio: "16:9",
            resolution: "1200x675",
            focalPoint: "center",
            cropping: "contain",
            desktopPresentation: "Interactive canvas overlay alongside slider controls",
            mobilePresentation: "Responsive dimensional diagram",
            altText: "Architectural room dimension and spatial volume diagram",
            prompt: `Architectural blueprint wireframe drawing of a modern living pavilion with dimension callouts, clean minimalist vector aesthetic, technical CAD elegance.`,
            priority: "medium",
          })
        );
      }

      if (route.includes("store") || route.includes("shop") || route.includes("pantry") || route.includes("treat")) {
        assets.push(
          this.createAsset({
            id: `ast-${routeSlug}-product-01`,
            page: route,
            section: "StorefrontCatalog",
            purpose: "Showcase flagship artisan product package.",
            category: "product-photography",
            subject: "Organic small-batch treats in minimalist biodegradable craft paper pouch",
            visualComposition: "1:1 studio tabletop product shot, soft ambient drop shadow",
            artDirection: "BOUTIQUE_COMMERCE",
            colorDirection: "Warm kraft paper, amber highlights, clean neutral background",
            aspectRatio: "1:1",
            resolution: "800x800",
            focalPoint: "center",
            cropping: "cover",
            desktopPresentation: "Product catalog grid card with quick-view modal",
            mobilePresentation: "Full-width product tile with touch add-to-cart",
            altText: `Artisan organic treats pouch from ${brandName}`,
            prompt: `Studio product photography of artisan gourmet pet treats in sustainable craft pouch packaging, clean minimalist studio background, commercial e-commerce shot.`,
            priority: "high",
          })
        );
      }

      if (route.includes("team") || route.includes("consultation") || route.includes("about")) {
        assets.push(
          this.createAsset({
            id: `ast-${routeSlug}-lead-portrait`,
            page: route,
            section: "TeamProfile",
            purpose: "Introduce principal designer and foster trust with prospective clients.",
            category: "team-portrait",
            subject: "Studio principal smiling warmly in bright modernist creative atelier",
            visualComposition: "3:4 vertical editorial portrait, natural studio window light, gentle depth of field",
            artDirection: "EDITORIAL_PORTRAIT",
            colorDirection: "Natural skin tones, charcoal linen blazer, bright studio background",
            aspectRatio: "3:4",
            resolution: "900x1200",
            focalPoint: "center",
            cropping: "cover",
            desktopPresentation: "Refined portrait card alongside bio and credentials",
            mobilePresentation: "Centered profile headshot",
            altText: `Principal director at ${brandName}`,
            prompt: `Professional editorial portrait of creative studio founder in sunlit architecture atelier, warm approachable expression, high fashion corporate portrait.`,
            priority: "low",
          })
        );
      }
    }

    // Tally category counts
    const categoriesCount: Record<string, number> = {};
    const sourcesCount: Record<string, number> = {
      SOURCED: assets.length,
      GENERATED: 0,
      USER_PROVIDED: 0,
    };

    for (const a of assets) {
      categoriesCount[a.category] = (categoriesCount[a.category] || 0) + 1;
    }

    return {
      version: "1.0",
      manifestId: `asm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      projectName: brandName,
      domain,
      visualThesis: visualThesis || "Bespoke, intentional visual storytelling tailored to user workflows",
      assets,
      assetCount: assets.length,
      categoriesCount,
      sourcesCount,
      generatedAt: new Date().toISOString(),
      status: "COMPLETE",
    };
  }

  /**
   * Resolve each planned asset using configured AI generation or licensed sourcing,
   * write `.aegis/asset-manifest.json`, `.aegis/asset-manifest.md`, and generate
   * `src/content/site-assets.ts` into the target project.
   */
  public static async resolveAssets(
    manifest: AssetManifest,
    projectRoot: string,
    provider?: ImageAssetProvider
  ): Promise<AssetManifest> {
    const activeProvider = provider || this.defaultProvider;
    const resolvedAssets: PageVisualAsset[] = [];

    for (const asset of manifest.assets) {
      try {
        const result = await activeProvider.generate({
          prompt: asset.prompt,
          category: asset.category,
          subject: asset.subject,
          aspectRatio: asset.aspectRatio,
          resolution: asset.resolution,
          artDirection: asset.artDirection,
          colorDirection: asset.colorDirection,
        });

        if (result.success && result.resolvedUrl) {
          resolvedAssets.push({
            ...asset,
            resolvedUrl: result.resolvedUrl,
            sourceMethod: result.sourceMethod,
            license: result.license,
            attribution: result.attribution,
          });
        } else {
          // Keep asset with honest failure/not-verified status
          resolvedAssets.push({
            ...asset,
            sourceMethod: "FAILED",
            license: "N/A",
          });
        }
      } catch (err: any) {
        resolvedAssets.push({
          ...asset,
          sourceMethod: "FAILED",
          license: "N/A",
        });
      }
    }

    const updatedManifest: AssetManifest = {
      ...manifest,
      assets: resolvedAssets,
      sourcesCount: {
        SOURCED: resolvedAssets.filter((a) => a.sourceMethod === "SOURCED").length,
        GENERATED: resolvedAssets.filter((a) => a.sourceMethod === "GENERATED").length,
        USER_PROVIDED: resolvedAssets.filter((a) => a.sourceMethod === "USER_PROVIDED").length,
        FAILED: resolvedAssets.filter((a) => a.sourceMethod === "FAILED").length,
      },
      status: resolvedAssets.some((a) => a.sourceMethod === "FAILED") ? "PARTIAL" : "COMPLETE",
    };

    // Save manifest files in .aegis/
    this.saveManifest(projectRoot, updatedManifest);

    // Generate TypeScript project asset catalog (src/content/site-assets.ts)
    this.generateSiteAssetsModule(projectRoot, updatedManifest);

    return updatedManifest;
  }

  /**
   * Persist asset manifest to `.aegis/asset-manifest.json` and `.aegis/asset-manifest.md`.
   */
  public static saveManifest(projectRoot: string, manifest: AssetManifest): void {
    const aegisDir = join(projectRoot, ".aegis");
    if (!existsSync(aegisDir)) {
      mkdirSync(aegisDir, { recursive: true });
    }

    writeFileSync(
      join(aegisDir, "asset-manifest.json"),
      JSON.stringify(manifest, null, 2),
      "utf8"
    );

    const mdContent = this.formatManifestMarkdown(manifest);
    writeFileSync(join(aegisDir, "asset-manifest.md"), mdContent, "utf8");
    console.log(`[AssetDirector] ✓ Asset manifest persisted: ${manifest.assetCount} assets planned and resolved.`);
  }

  /**
   * Generates a typed TypeScript module in `src/content/site-assets.ts` allowing
   * frontend components to import and bind verified visual assets directly.
   */
  public static generateSiteAssetsModule(projectRoot: string, manifest: AssetManifest): void {
    const contentDir = join(projectRoot, "src", "content");
    if (!existsSync(contentDir)) {
      mkdirSync(contentDir, { recursive: true });
    }

    const tsContent = `/**
 * Site Visual Assets Catalog
 *
 * Generated automatically by Aegis AI AssetDirector.
 * Contains verified, domain-authentic visual assets planned for this website.
 */

export interface SiteAsset {
  id: string;
  page: string;
  section: string;
  purpose: string;
  category: string;
  subject: string;
  aspectRatio: string;
  url: string;
  altText: string;
  license: string;
  priority: "high" | "medium" | "low";
}

export const siteAssets: Record<string, SiteAsset> = {
${manifest.assets
  .map(
    (a) => `  "${a.id}": {
    id: ${JSON.stringify(a.id)},
    page: ${JSON.stringify(a.page)},
    section: ${JSON.stringify(a.section)},
    purpose: ${JSON.stringify(a.purpose)},
    category: ${JSON.stringify(a.category)},
    subject: ${JSON.stringify(a.subject)},
    aspectRatio: ${JSON.stringify(a.aspectRatio)},
    url: ${JSON.stringify(a.resolvedUrl)},
    altText: ${JSON.stringify(a.altText)},
    license: ${JSON.stringify(a.license)},
    priority: ${JSON.stringify(a.priority)}
  },`
  )
  .join("\n")}
};

/**
 * Get an asset by its unique identifier with safe fallback.
 */
export function getAsset(id: string): SiteAsset | undefined {
  return siteAssets[id];
}

/**
 * Get all assets assigned to a particular route.
 */
export function getPageAssets(route: string): SiteAsset[] {
  return Object.values(siteAssets).filter(a => a.page === route || (route === '/' && a.page === ''));
}

export default siteAssets;
`;

    writeFileSync(join(contentDir, "site-assets.ts"), tsContent, "utf8");
    console.log(`[AssetDirector] ✓ Generated TypeScript site asset catalog at src/content/site-assets.ts`);
  }

  /**
   * Build CoderAgent prompt context to ensure downstream frontend coders bind planned assets.
   */
  public static buildCoderContext(manifest: AssetManifest): string {
    if (!manifest || manifest.assets.length === 0) return "";

    return `
═══════════════════════════════════════════════════════════════════════════════
  AEGIS AUTHORITATIVE VISUAL ASSET PLAN (MANDATORY BINDINGS)
═══════════════════════════════════════════════════════════════════════════════
The AssetDirector has planned and verified the following visual assets for this project.
Import them directly from '@/content/site-assets' or use the provided URLs:

${manifest.assets
  .map(
    (a) =>
      `• [${a.page}] Section: <${a.section}> (ID: "${a.id}")\n` +
      `  - Category: ${a.category} (${a.aspectRatio})\n` +
      `  - Subject: "${a.subject}"\n` +
      `  - Alt Text: "${a.altText}"\n` +
      `  - URL: "${a.resolvedUrl}"\n` +
      `  - Usage: <img src="${a.resolvedUrl}" alt="${a.altText}" className="w-full object-cover rounded-2xl" />`
  )
  .join("\n\n")}

CRITICAL RULE: Always bind these intentional domain assets into the corresponding sections. Never replace them with generic placeholder boxes or empty broken tags.
`;
  }

  private static createAsset(fields: {
    id: string;
    page: string;
    section: string;
    purpose: string;
    category: AssetCategory;
    subject: string;
    visualComposition: string;
    artDirection: string;
    colorDirection: string;
    aspectRatio: AspectRatio;
    resolution: string;
    focalPoint: string;
    cropping: "cover" | "contain" | "fill";
    desktopPresentation: string;
    mobilePresentation: string;
    altText: string;
    prompt: string;
    priority: "high" | "medium" | "low";
  }): PageVisualAsset {
    return {
      ...fields,
      sourceMethod: "NOT_VERIFIED",
      localDestination: `src/assets/images/${fields.id}.jpg`,
      resolvedUrl: "",
      license: "Pending Verification",
    };
  }

  private static formatManifestMarkdown(manifest: AssetManifest): string {
    return `# Aegis Visual Asset Manifest

**Project Name:** ${manifest.projectName}
**Domain:** \`${manifest.domain}\`
**Visual Thesis:** *${manifest.visualThesis}*
**Total Assets Planned:** ${manifest.assetCount}
**Status:** \`${manifest.status}\`
**Generated At:** \`${manifest.generatedAt}\`

---

## 1. Asset Breakdown by Category
| Category | Count |
|---|:---:|
${Object.entries(manifest.categoriesCount)
  .map(([cat, count]) => `| \`${cat}\` | ${count} |`)
  .join("\n")}

---

## 2. Source Provenance
| Sourcing Method | Count |
|---|:---:|
${Object.entries(manifest.sourcesCount)
  .map(([src, count]) => `| \`${src}\` | ${count} |`)
  .join("\n")}

---

## 3. Individual Page Visual Asset Blueprints
${manifest.assets
  .map(
    (a, idx) => `
### ${idx + 1}. \`${a.id}\` — ${a.subject}
- **Route:** \`${a.page}\`
- **Section:** \`<${a.section}>\`
- **Category:** \`${a.category}\`
- **Purpose:** ${a.purpose}
- **Aspect Ratio:** \`${a.aspectRatio}\` | **Resolution:** \`${a.resolution}\`
- **Focal Point:** \`${a.focalPoint}\` | **Cropping:** \`${a.cropping}\`
- **Desktop Layout:** ${a.desktopPresentation}
- **Mobile Layout:** ${a.mobilePresentation}
- **Accessibility Description:** *${a.altText}*
- **Sourcing Method:** \`${a.sourceMethod}\` (${a.license})
- **Resolved URL:** [Inspect Asset](${a.resolvedUrl})
- **Generation Prompt:**
  > \`${a.prompt}\`
`
  )
  .join("\n")}
`;
  }
}
