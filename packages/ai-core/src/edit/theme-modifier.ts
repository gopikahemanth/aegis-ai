/**
 * Aegis AI — Phase 5 Theme Modifier
 *
 * Implements safe visual theme updates:
 * - Updates CSS design tokens in src/index.css (:root { ... })
 * - Updates .aegis/theme.json using ThemeGenerator
 * - Strictly preserves all page components, routes, models, and business logic
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { ThemeGenerator, type ThemeSpecification } from "../design/theme-generator.js";
import { FeatureMatrixManager } from "../contracts/feature-matrix.js";

export interface ThemeModifyResult {
  success: boolean;
  theme: ThemeSpecification;
  modifiedFiles: string[];
  error?: string;
}

export class ThemeModifier {
  /**
   * Directly applies explicit theme tokens to src/index.css (:root { ... }).
   */
  public static applyTheme(
    projectRoot: string,
    theme: { primaryColor: string; backgroundColor: string }
  ): { success: boolean; modifiedFiles: string[] } {
    const cleanRoot = projectRoot.replace(/\\/g, "/");
    const cssPath = join(cleanRoot, "src", "index.css");
    const css = `:root {\n  --color-primary: ${theme.primaryColor};\n  --color-background: ${theme.backgroundColor};\n  --color-surface: #1e293b;\n  --color-text: #f8fafc;\n}\n`;
    writeFileSync(cssPath, css, "utf8");
    return { success: true, modifiedFiles: ["src/index.css"] };
  }
  /**
   * Modifies the visual theme of the project based on natural language instructions.
   */
  public static async modifyTheme(
    projectRoot: string,
    instruction: string
  ): Promise<ThemeModifyResult> {
    const cleanRoot = projectRoot.replace(/\\/g, "/");
    const lower = instruction.toLowerCase();

    // 1. Infer domain from FeatureMatrix if available
    let domain = "general";
    const matrix = FeatureMatrixManager.loadFromProject(cleanRoot);
    if (matrix && matrix.domainName) {
      domain = matrix.domainName;
    }

    // 2. Parse mode & hue hints from instruction
    let mode: "dark" | "light" | "warm_dark" | "obsidian" = "dark";
    if (lower.includes("light") || lower.includes("cream") || lower.includes("ivory") || lower.includes("white")) {
      mode = "light";
    } else if (lower.includes("obsidian")) {
      mode = "obsidian";
    } else if (lower.includes("warm")) {
      mode = "warm_dark";
    }

    let brandHue: number | undefined;
    if (lower.includes("green") || lower.includes("emerald") || lower.includes("forest")) {
      brandHue = 145;
    } else if (lower.includes("blue") || lower.includes("azure") || lower.includes("ocean")) {
      brandHue = 215;
    } else if (lower.includes("purple") || lower.includes("violet") || lower.includes("indigo")) {
      brandHue = 265;
    } else if (lower.includes("amber") || lower.includes("copper") || lower.includes("gold") || lower.includes("cream")) {
      brandHue = 35;
    } else if (lower.includes("rose") || lower.includes("crimson") || lower.includes("red")) {
      brandHue = 350;
    }

    // 3. Generate new theme specification
    const theme = ThemeGenerator.generateTheme({
      domain,
      mode,
      brandHue,
      prompt: instruction,
      seed: Math.floor(Math.random() * 1000) + 1,
    });

    const modifiedFiles: string[] = [];

    // 4. Update .aegis/theme.json
    ThemeGenerator.save(cleanRoot, theme);
    modifiedFiles.push(".aegis/theme.json");

    // 5. Update src/index.css
    const cssPath = join(cleanRoot, "src", "index.css");
    const newCssVars = ThemeGenerator.generateCssVariables(theme);

    if (existsSync(cssPath)) {
      const existingCss = readFileSync(cssPath, "utf8");
      // Replace :root block if it exists
      const rootRegex = /:root\s*\{[^}]*\}/;
      let updatedCss: string;
      if (rootRegex.test(existingCss)) {
        updatedCss = existingCss.replace(rootRegex, newCssVars.trim());
      } else {
        updatedCss = `${newCssVars}\n\n${existingCss}`;
      }
      writeFileSync(cssPath, updatedCss, "utf8");
      modifiedFiles.push("src/index.css");
    } else {
      writeFileSync(cssPath, newCssVars, "utf8");
      modifiedFiles.push("src/index.css");
    }

    return {
      success: true,
      theme,
      modifiedFiles,
    };
  }
}
