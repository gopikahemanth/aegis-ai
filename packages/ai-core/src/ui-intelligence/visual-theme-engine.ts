/**
 * VisualThemeEngine
 *
 * Infers and applies tailored visual aesthetics driven by DomainVisualDesignContract
 * while giving absolute priority to explicit user styling constraints.
 */

import { DomainVisualContractGenerator, type DomainVisualDesignContract } from "../design/domain-visual-contract.js";

export type VisualStyleArchetype =
  | "MODERN"
  | "MINIMAL"
  | "CORPORATE"
  | "LUXURY"
  | "PLAYFUL"
  | "TECH"
  | "HEALTHCARE"
  | "FINTECH"
  | "EDUCATION"
  | "ECOMMERCE"
  | "LEGAL"
  | "ENTERTAINMENT"
  | "LOGISTICS"
  | "ASTRONOMY"
  | "CUSTOM";

export interface ThemeConfig {
  style: VisualStyleArchetype;
  baseColor: string;
  accentColor: string;
  themeMode: "DARK" | "LIGHT" | "AUTO";
  vibeSummary: string;
  userOverrideApplied: boolean;
  visualContract?: DomainVisualDesignContract;
}

export class VisualThemeEngine {
  public static determineTheme(
    domain: string,
    userExplicitStyle?: Partial<ThemeConfig>
  ): ThemeConfig {
    if (userExplicitStyle && Object.keys(userExplicitStyle).length > 0) {
      return {
        style: userExplicitStyle.style || "CUSTOM",
        baseColor: userExplicitStyle.baseColor || "#0f172a",
        accentColor: userExplicitStyle.accentColor || "#10b981",
        themeMode: userExplicitStyle.themeMode || "DARK",
        vibeSummary: "User explicit style preferences applied with priority.",
        userOverrideApplied: true,
      };
    }

    const visualContract = DomainVisualContractGenerator.deriveContract(domain);

    let styleArchetype: VisualStyleArchetype = "MODERN";
    const d = domain.toLowerCase();
    if (d.includes("hotel") || d.includes("resort") || d.includes("luxury")) styleArchetype = "LUXURY";
    else if (d.includes("legal") || d.includes("law") || d.includes("chambers")) styleArchetype = "LEGAL";
    else if (d.includes("music") || d.includes("festival") || d.includes("concert")) styleArchetype = "ENTERTAINMENT";
    else if (d.includes("warehouse") || d.includes("logistics") || d.includes("fleet")) styleArchetype = "LOGISTICS";
    else if (d.includes("astro") || d.includes("quantum") || d.includes("space")) styleArchetype = "ASTRONOMY";
    else if (d.includes("health") || d.includes("clinic") || d.includes("hospital")) styleArchetype = "HEALTHCARE";
    else if (d.includes("edu") || d.includes("course") || d.includes("academy")) styleArchetype = "EDUCATION";
    else if (d.includes("ecom") || d.includes("shop") || d.includes("store")) styleArchetype = "ECOMMERCE";

    const colorMap: Record<VisualStyleArchetype, { base: string; accent: string }> = {
      HEALTHCARE: { base: "#0f172a", accent: "#06b6d4" },
      EDUCATION: { base: "#0f172a", accent: "#6366f1" },
      ECOMMERCE: { base: "#020617", accent: "#f59e0b" },
      LUXURY: { base: "#12100e", accent: "#d4af37" },
      LEGAL: { base: "#090a0f", accent: "#c5a059" },
      ENTERTAINMENT: { base: "#0a0518", accent: "#ec4899" },
      LOGISTICS: { base: "#0b0f19", accent: "#f59e0b" },
      ASTRONOMY: { base: "#030712", accent: "#38bdf8" },
      TECH: { base: "#020617", accent: "#3b82f6" },
      FINTECH: { base: "#030712", accent: "#10b981" },
      MINIMAL: { base: "#09090b", accent: "#71717a" },
      CORPORATE: { base: "#0f172a", accent: "#2563eb" },
      PLAYFUL: { base: "#0f172a", accent: "#f43f5e" },
      MODERN: { base: "#020617", accent: "#10b981" },
      CUSTOM: { base: "#0f172a", accent: "#10b981" },
    };

    const colors = colorMap[styleArchetype] || colorMap.MODERN;

    return {
      style: styleArchetype,
      baseColor: colors.base,
      accentColor: colors.accent,
      themeMode: visualContract.colorSystem.mode.includes("light") ? "LIGHT" : "DARK",
      vibeSummary: `${visualContract.visualPersonality.mood} (${visualContract.layoutFamily})`,
      userOverrideApplied: false,
      visualContract,
    };
  }
}
