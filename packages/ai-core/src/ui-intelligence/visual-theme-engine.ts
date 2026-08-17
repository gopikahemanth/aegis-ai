/**
 * VisualThemeEngine
 *
 * Infers and applies tailored visual aesthetics (MODERN, HEALTHCARE, FINTECH, ECOMMERCE, MINIMAL, TECH, etc.)
 * while giving absolute priority to explicit user styling constraints.
 */

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
  | "CUSTOM";

export interface ThemeConfig {
  style: VisualStyleArchetype;
  baseColor: string;
  accentColor: string;
  themeMode: "DARK" | "LIGHT" | "AUTO";
  vibeSummary: string;
  userOverrideApplied: boolean;
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

    const d = domain.toLowerCase();

    if (d.includes("health") || d.includes("hospital") || d.includes("clinic")) {
      return {
        style: "HEALTHCARE",
        baseColor: "#0f172a",
        accentColor: "#06b6d4", // Cyan
        themeMode: "DARK",
        vibeSummary: "Clean, calm, accessible, trustworthy medical interface with high contrast.",
        userOverrideApplied: false,
      };
    }

    if (d.includes("edu") || d.includes("lms") || d.includes("course")) {
      return {
        style: "EDUCATION",
        baseColor: "#0f172a",
        accentColor: "#6366f1", // Indigo
        themeMode: "DARK",
        vibeSummary: "Structured, academic, focused learning environment with readable typography.",
        userOverrideApplied: false,
      };
    }

    if (d.includes("ecom") || d.includes("shop") || d.includes("store")) {
      return {
        style: "ECOMMERCE",
        baseColor: "#020617",
        accentColor: "#f59e0b", // Amber
        themeMode: "DARK",
        vibeSummary: "Vibrant, conversion-optimized shopping storefront with high-visibility CTAs.",
        userOverrideApplied: false,
      };
    }

    // Default Modern Tech Dark
    return {
      style: "MODERN",
      baseColor: "#020617",
      accentColor: "#10b981", // Emerald
      themeMode: "DARK",
      vibeSummary: "Sleek, modern glassmorphic dashboard with crisp typography and subtle micro-borders.",
      userOverrideApplied: false,
    };
  }
}
