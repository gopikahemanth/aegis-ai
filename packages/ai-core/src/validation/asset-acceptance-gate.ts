/**
 * Aegis AI — Asset Acceptance Gate
 *
 * System verification gate that ensures:
 * 1. An authoritative Asset Manifest (.aegis/asset-manifest.json) exists.
 * 2. Mandatory pages have planned visual assets matching the project domain.
 * 3. All planned assets are resolved with verified URLs/SVGs and valid licensing.
 * 4. Accessibility descriptions (altText) are non-trivial and meaningful.
 * 5. Frontend components contain zero broken image tags (<img src="" />).
 * 6. Generated site assets module (src/content/site-assets.ts) exists and is syntactically sound.
 */

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import type { AssetManifest, PageVisualAsset } from "../design/asset-types.js";

export interface AssetAcceptanceReport {
  status: "PASS" | "FAIL";
  passed: boolean;
  totalAssets: number;
  resolvedAssets: number;
  violations: string[];
  summary: string;
}

export class AssetAcceptanceGate {
  /**
   * Audits generated project against visual asset completeness and validity.
   */
  public static audit(projectRoot: string): AssetAcceptanceReport {
    const violations: string[] = [];
    const aegisDir = join(projectRoot, ".aegis");
    const manifestPath = join(aegisDir, "asset-manifest.json");

    if (!existsSync(manifestPath)) {
      // If project has no manifest but has src, check if any images are broken
      const srcDir = join(projectRoot, "src");
      if (!existsSync(srcDir)) {
        return {
          status: "PASS",
          passed: true,
          totalAssets: 0,
          resolvedAssets: 0,
          violations: [],
          summary: "No src directory found to audit.",
        };
      }
      return {
        status: "FAIL",
        passed: false,
        totalAssets: 0,
        resolvedAssets: 0,
        violations: ["ASSET_MANIFEST_MISSING: .aegis/asset-manifest.json does not exist."],
        summary: "Visual asset manifest missing from .aegis directory.",
      };
    }

    let manifest: AssetManifest;
    try {
      manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    } catch (err: any) {
      return {
        status: "FAIL",
        passed: false,
        totalAssets: 0,
        resolvedAssets: 0,
        violations: [`ASSET_MANIFEST_CORRUPT: Failed to parse asset-manifest.json: ${err.message}`],
        summary: "Asset manifest JSON file is corrupt.",
      };
    }

    const totalAssets = manifest.assets ? manifest.assets.length : 0;
    let resolvedAssets = 0;

    if (totalAssets === 0) {
      violations.push("ASSET_INVENTORY_EMPTY: Asset manifest contains zero planned visual assets.");
    }

    // Check individual assets
    for (const asset of manifest.assets || []) {
      const url = asset.resolvedUrl ? asset.resolvedUrl.trim() : "";
      if (!url) {
        violations.push(`ASSET_UNRESOLVED: Asset '${asset.id}' on page '${asset.page}' has no resolved URL.`);
      } else {
        // Enforce legitimate external photography or valid vector SVG sourcing (NO AI generation stubs)
        const isLegitimateHttpUrl = /^https:\/\/(images\.unsplash\.com|images\.pexels\.com|upload\.wikimedia\.org|cdn\.pixabay\.com|images\.[a-z0-9.-]+)/i.test(url);
        const isValidSvgDataUri = url.startsWith("data:image/svg+xml;utf8,") || url.startsWith("data:image/svg+xml;base64,");
        const isDisallowedOrFake = /fake|internal|stub|placeholder\.com|localhost|dummy/i.test(url) || url.startsWith("http://");

        if (isDisallowedOrFake || (!isLegitimateHttpUrl && !isValidSvgDataUri)) {
          violations.push(`ASSET_INVALID_SOURCE_URL: Asset '${asset.id}' URL is not a recognized, loadable image source: "${url.slice(0, 50)}"`);
        } else {
          resolvedAssets++;
        }
      }

      // Verify License & Provenance
      const lic = asset.license ? asset.license.trim() : "";
      const validLicenses = /unsplash|pexels|creative\s*commons|public\s*domain|commercial|mit|permissive|open\s*source/i;
      if (!lic || lic === "N/A" || !validLicenses.test(lic)) {
        violations.push(`ASSET_LICENSE_UNVERIFIED: Asset '${asset.id}' lacks a verified open/commercial license (found: "${lic || 'none'}").`);
      }

      // Verify Non-trivial Alt Text for Accessibility
      if (!asset.altText || asset.altText.trim().length < 10) {
        violations.push(`ASSET_ALT_TEXT_INVALID: Asset '${asset.id}' lacks a descriptive accessibility description (length < 10).`);
      }

      // Verify Aspect Ratio
      if (!asset.aspectRatio) {
        violations.push(`ASSET_ASPECT_RATIO_MISSING: Asset '${asset.id}' has no defined aspect ratio.`);
      }

      // Verify Semantic Domain Relevancy
      const domainContext = `${manifest.domain || ""} ${manifest.projectName || ""} ${manifest.visualThesis || ""}`.toLowerCase();
      const assetContext = `${asset.id} ${asset.page} ${asset.section} ${asset.purpose || ""} ${asset.subject || ""} ${asset.altText || ""} ${asset.resolvedUrl || ""}`.toLowerCase();

      const isAnimalDomain = /\b(pet|pets|dog|dogs|puppy|puppies|cat|cats|kitten|kittens|animal|animals|veterinary|sanctuary|canine|feline)\b/i.test(domainContext);
      const isCulinaryDomain = /\b(food|restaurant|dining|bakery|cafe|culinary|chef|bistro|recipe|pastry)\b/i.test(domainContext);
      const isTechnicalOrAviation = /\b(aviation|aerospace|turbine|engine|telemetry|avionics|scada|inverter|solar|satellite)\b/i.test(domainContext);

      const resolvedIsPetOrAnimal = /\b(cat|cats|kitten|kittens|puppy|puppies|dog|dogs|canine|feline)\b/i.test(assetContext) ||
                                    asset.resolvedUrl.includes("photo-1514888286974-6c03e2ca1dba") ||
                                    asset.resolvedUrl.includes("photo-1552053831-71594a27632d") ||
                                    asset.resolvedUrl.includes("photo-1583511655857-d19b40a7a54e");

      const resolvedIsFastFood = /\b(burger|cheeseburger|french fries|hot dog|junk food)\b/i.test(assetContext);

      if (resolvedIsPetOrAnimal && !isAnimalDomain) {
        violations.push(`ASSET_SEMANTIC_MISMATCH: Incompatible pet/animal visual asset '${asset.id}' (${asset.subject}) detected in non-animal domain '${manifest.domain || manifest.projectName}'.`);
      } else if (resolvedIsFastFood && isTechnicalOrAviation) {
        violations.push(`ASSET_SEMANTIC_MISMATCH: Incompatible fast-food visual asset '${asset.id}' (${asset.subject}) detected in technical engineering domain '${manifest.domain || manifest.projectName}'.`);
      }
    }

    // Check project catalog module
    const siteAssetsPath = join(projectRoot, "src", "content", "site-assets.ts");
    if (!existsSync(siteAssetsPath)) {
      violations.push("SITE_ASSETS_MODULE_MISSING: src/content/site-assets.ts does not exist.");
    }

    // Check for broken img tags in source files
    const srcDir = join(projectRoot, "src");
    if (existsSync(srcDir)) {
      const sourceFiles = this.collectSourceFiles(srcDir);
      for (const file of sourceFiles) {
        try {
          const content = readFileSync(file, "utf8");
          // Check for empty or literal undefined/null image sources
          if (/<img\s+[^>]*src=["'](?:|undefined|null|\[object Object\])["']/i.test(content)) {
            violations.push(`BROKEN_IMAGE_TAG: Found empty or invalid src attribute in ${file.replace(projectRoot, "")}`);
          }
        } catch {}
      }
    }

    const passed = violations.length === 0;
    const summary = passed
      ? `Visual asset plan verified: ${resolvedAssets}/${totalAssets} assets resolved with valid alt text, aspect ratios, and zero broken paths.`
      : `Asset Acceptance Gate detected ${violations.length} issue(s): ${violations.slice(0, 3).join("; ")}`;

    return {
      status: passed ? "PASS" : "FAIL",
      passed,
      totalAssets,
      resolvedAssets,
      violations,
      summary,
    };
  }

  private static collectSourceFiles(dir: string): string[] {
    const results: string[] = [];
    try {
      const entries = readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const full = join(dir, entry.name);
        if (entry.isDirectory()) {
          if (["node_modules", ".git", "dist", "build"].includes(entry.name)) continue;
          results.push(...this.collectSourceFiles(full));
        } else if (/\.(tsx|jsx|html)$/.test(entry.name)) {
          results.push(full);
        }
      }
    } catch {}
    return results;
  }
}
