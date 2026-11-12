/**
 * Aegis AI — Phase 3 Dynamic Theme Generator
 *
 * Synthesizes cohesive, domain-adapted color themes, tokens, and component styling.
 * Mathematically validates and auto-tunes contrast against WCAG 2.1 AA requirements
 * (Normal text >= 4.5:1, Large text & UI controls >= 3.0:1).
 *
 * Persists `.aegis/theme.json` and produces CSS custom properties and TypeScript tokens.
 */

import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";

export interface ColorScale {
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

export interface ContrastAuditResult {
  textOnBackground: { ratio: number; passesAA: boolean };
  textOnSurface: { ratio: number; passesAA: boolean };
  textSecondaryOnSurface: { ratio: number; passesAA: boolean };
  textOnPrimaryButton: { ratio: number; passesAA: boolean };
  focusOnBackground: { ratio: number; passesAA: boolean };
  overallValid: boolean;
}

export interface ThemeSpecification {
  version: "2.0";
  themeId: string;
  domain: string;
  mode: "dark" | "light" | "warm_dark" | "obsidian";
  brandHue: number;
  palette: {
    primary: string;
    primaryHover: string;
    primaryActive: string;
    primarySubtle: string;
    primaryScale: ColorScale;

    secondary: string;
    secondaryHover: string;
    secondaryScale: ColorScale;

    accent: string;
    accentScale: ColorScale;

    neutralScale: ColorScale;

    background: string;
    surface: string;
    surfaceRaised: string;
    surfaceMuted: string;

    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    textOnPrimary: string;

    border: string;
    borderSubtle: string;
    focusRing: string;

    semantic: {
      success: string;
      warning: string;
      error: string;
      info: string;
    };
  };
  componentTokens: {
    card: {
      bg: string;
      border: string;
      shadow: string;
      radius: string;
    };
    button: {
      primaryBg: string;
      primaryText: string;
      primaryHoverBg: string;
      secondaryBg: string;
      secondaryText: string;
      secondaryBorder: string;
    };
    input: {
      bg: string;
      border: string;
      focusBorder: string;
      text: string;
      placeholder: string;
    };
    table: {
      headerBg: string;
      rowHoverBg: string;
      borderColor: string;
    };
    tabs: {
      listBg: string;
      activeBg: string;
      activeText: string;
    };
    badge: {
      primaryBg: string;
      primaryText: string;
      primaryBorder: string;
    };
  };
  contrastAudit: ContrastAuditResult;
}

// ─── Color Science & Math Utilities ──────────────────────────────────────────

export function hexToRgb(hex: string): [number, number, number] {
  let c = hex.replace(/^#/, "");
  if (c.length === 3) {
    c = c.split("").map((x) => x + x).join("");
  }
  const num = parseInt(c, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

export function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return (
    "#" +
    [clamp(r), clamp(g), clamp(b)]
      .map((x) => x.toString(16).padStart(2, "0"))
      .join("")
  );
}

export function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h = ((h % 360) + 360) % 360;
  s = Math.max(0, Math.min(100, s)) / 100;
  l = Math.max(0, Math.min(100, l)) / 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;

  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; b = 0; }
  else if (h < 120) { r = x; g = c; b = 0; }
  else if (h < 180) { r = 0; g = c; b = x; }
  else if (h < 240) { r = 0; g = x; b = c; }
  else if (h < 300) { r = x; g = 0; b = c; }
  else { r = c; g = 0; b = x; }

  return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
}

export function hslToHex(h: number, s: number, l: number): string {
  const [r, g, b] = hslToRgb(h, s, l);
  return rgbToHex(r, g, b);
}

export function getRelativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function getContrastRatio(hex1: string, hex2: string): number {
  const l1 = getRelativeLuminance(hex1);
  const l2 = getRelativeLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  const ratio = (lighter + 0.05) / (darker + 0.05);
  return Math.round(ratio * 100) / 100;
}

/**
 * Automatically adjusts color lightness until it satisfies target WCAG contrast ratio.
 */
export function ensureContrast(
  foregroundHex: string,
  backgroundHex: string,
  targetRatio = 4.5,
  direction?: "lighten" | "darken"
): string {
  let ratio = getContrastRatio(foregroundHex, backgroundHex);
  if (ratio >= targetRatio) return foregroundHex;

  const bgLum = getRelativeLuminance(backgroundHex);
  const shouldLighten = direction === "lighten" ? true : direction === "darken" ? false : bgLum < 0.5;

  let [r, g, b] = hexToRgb(foregroundHex);
  for (let i = 0; i < 35; i++) {
    if (shouldLighten) {
      r = Math.min(255, r + 7);
      g = Math.min(255, g + 7);
      b = Math.min(255, b + 7);
    } else {
      r = Math.max(0, r - 7);
      g = Math.max(0, g - 7);
      b = Math.max(0, b - 7);
    }
    const candidate = rgbToHex(r, g, b);
    ratio = getContrastRatio(candidate, backgroundHex);
    if (ratio >= targetRatio) {
      return candidate;
    }
  }

  // Fallback to absolute white or dark
  return shouldLighten ? "#ffffff" : "#0f172a";
}

export function generateScale(hue: number, saturation: number): ColorScale {
  return {
    50: hslToHex(hue, saturation * 0.45, 96),
    100: hslToHex(hue, saturation * 0.55, 91),
    200: hslToHex(hue, saturation * 0.65, 82),
    300: hslToHex(hue, saturation * 0.75, 71),
    400: hslToHex(hue, saturation * 0.85, 60),
    500: hslToHex(hue, saturation, 49),
    600: hslToHex(hue, saturation, 40),
    700: hslToHex(hue, saturation * 0.95, 31),
    800: hslToHex(hue, saturation * 0.9, 23),
    900: hslToHex(hue, saturation * 0.85, 15),
    950: hslToHex(hue, saturation * 0.8, 9),
  };
}

// ─── ThemeGenerator Class ───────────────────────────────────────────────────

export class ThemeGenerator {
  /**
   * Generates a complete, contrast-checked ThemeSpecification.
   */
  public static generateTheme(options: {
    domain?: string;
    brandHue?: number;
    mode?: "dark" | "light" | "warm_dark" | "obsidian";
    prompt?: string;
    seed?: number;
    colorSystem?: any;
    artDirection?: any;
  }): ThemeSpecification {
    const {
      domain = "general",
      prompt = "",
      seed = 42,
    } = options;

    // 1. Derive base mode
    let mode: ThemeSpecification["mode"] = options.mode || "dark";
    if (!options.mode) {
      if (options.artDirection?.colorSystem?.mode) {
        mode = options.artDirection.colorSystem.mode === "light" ? "light" : options.artDirection.colorSystem.mode === "obsidian" ? "obsidian" : options.artDirection.colorSystem.mode === "warm_dark" ? "warm_dark" : "dark";
      } else if (/telemetry|avionics|radar|cyber|security|soc|ops|terminal|command|satellite|spectrogram|cluster|infrastructure|cloudpulse|sre\b/i.test(`${domain} ${prompt}`)) {
        mode = "obsidian";
      } else if (/fashion|clothing|apparel|boutique|restaurant|dining|bistro|culinary|cafe|food|photography|portfolio|gallery|travel|tourism|resort|hotel|hospitality|botanical|plant|garden|nature|ivory|cream|healthcare|clinic|medical|dental|student|education|school|academy|architect|interior|limestone|atelier|editorial|magazine|publishing/i.test(`${domain} ${prompt}`)) {
        mode = "light";
      } else {
        mode = "dark";
      }
    }

    // 2. Derive base brand hue (0..360)
    let brandHue = options.brandHue;
    if (brandHue === undefined || brandHue === null) {
      const text = `${domain} ${prompt}`.toLowerCase();
      let baseHue = 180;
      if (/aerospace|satellite|orbit|space/i.test(text)) {
        baseHue = 215; // Electric Azure
      } else if (/marine|ocean|underwater|habitat|subsea/i.test(text)) {
        baseHue = 185; // Deep Cyan / Aquamarine
      } else if (/hypercar|atelier|luxury|speed|race/i.test(text)) {
        baseHue = 25; // Amber / Burnt Copper
      } else if (/fashion|apparel|boutique|clothing/i.test(text)) {
        baseHue = 345; // Rosewood / Crimson Velvet
      } else if (/photography|monograph|fineart|gallery/i.test(text)) {
        baseHue = 40; // Warm Ochre / Sepia Sand
      } else if (/restaurant|dining|bistro|culinary|cafe/i.test(text)) {
        baseHue = 18; // Terracotta Rust / Sienna
      } else if (/travel|hospitality|resort|hotel/i.test(text)) {
        baseHue = 175; // Caribbean Seafoam / Azure
      } else if (/plant|botanical|garden|bonsai|nature|eco/i.test(text)) {
        baseHue = 145; // Sage / Forest Emerald
      } else if (/health|medical|clinic|pharma|dental/i.test(text)) {
        baseHue = 195; // Clinical Sky
      } else if (/fintech|crypto|bank/i.test(text)) {
        baseHue = 260; // Deep Violet / Indigo
      } else if (/education|school|learning|academy/i.test(text)) {
        baseHue = 225; // Royal Academic Cobalt
      } else if (/creative|agency|design studio|art/i.test(text)) {
        baseHue = 275; // Electric Violet / Mulberry
      } else if (/geothermal|thermal|energy|magma|heat|volcan/i.test(text)) {
        baseHue = 35; // Volcanic Amber / Terracotta
      } else if (/cheese|creamery|dairy|farm|pastoral|harvest|vineyard/i.test(text)) {
        baseHue = 85; // Warm Olive / Meadow Gold
      } else {
        // Deterministic text hash combined with seed across vibrant spectrum
        const textHash = text.split("").reduce((acc, c, i) => acc + c.charCodeAt(0) * (i + 1), 0);
        baseHue = (Math.abs(textHash + seed * 37) + 180) % 360;
      }
      // Apply organic seed-based hue distribution nuance (±15°) so different generations create authentic original palettes
      const jitter = seed !== 0 ? ((Math.abs(seed) % 31) - 15) : 0;
      brandHue = (baseHue + jitter + 360) % 360;
    }

    const secondaryHue = (brandHue + 35) % 360;
    const accentHue = (brandHue + 150) % 360;

    // 3. Generate color scales
    const primaryScale = generateScale(brandHue, 80);
    const secondaryScale = generateScale(secondaryHue, 75);
    const accentScale = generateScale(accentHue, 85);
    const neutralScale = generateScale(brandHue, 12); // subtly brand-tinted neutrals

    const isDark = mode !== "light";

    // 4. Background, Surface, Borders, and Text
    let background = isDark ? (mode === "obsidian" ? "#05070a" : neutralScale[950]) : "#f8fafc";
    let surface = isDark ? (mode === "obsidian" ? "#0c1017" : neutralScale[900]) : "#ffffff";
    let surfaceRaised = isDark ? (mode === "obsidian" ? "#141b24" : neutralScale[800]) : "#f1f5f9";
    let surfaceMuted = isDark ? neutralScale[800] : neutralScale[100];

    let border = isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.10)";
    let borderSubtle = isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.05)";
    let focusRing = primaryScale[500];

    // 5. Initial primary & secondary assignments
    let primary = isDark ? primaryScale[400] : primaryScale[600];
    let primaryHover = isDark ? primaryScale[300] : primaryScale[700];
    let primaryActive = isDark ? primaryScale[500] : primaryScale[800];
    let primarySubtle = isDark ? `rgba(${hexToRgb(primaryScale[500]).join(", ")}, 0.15)` : `rgba(${hexToRgb(primaryScale[500]).join(", ")}, 0.10)`;

    let secondary = isDark ? secondaryScale[400] : secondaryScale[600];
    let secondaryHover = isDark ? secondaryScale[300] : secondaryScale[700];

    let accent = isDark ? accentScale[400] : accentScale[600];

    // 6. Text Tokens with rigorous WCAG AA validation
    let textPrimary = isDark ? "#f8fafc" : "#0f172a";
    let textSecondary = isDark ? "#94a3b8" : "#475569";
    let textMuted = isDark ? "#64748b" : "#64748b";
    let textOnPrimary = getContrastRatio("#ffffff", primary) >= 4.5 ? "#ffffff" : "#0f172a";

    // If explicit color system or art direction provided, honor its locked tokens
    const cs = options.colorSystem || options.artDirection?.colorSystem;
    if (cs) {
      if (cs.background) background = cs.background;
      if (cs.surface) surface = cs.surface;
      if (cs.surfaceRaised || cs.surfaceElevated) surfaceRaised = cs.surfaceRaised || cs.surfaceElevated;
      if (cs.primary || cs.primaryHex) primary = cs.primary || cs.primaryHex;
      if (cs.primaryHover || cs.primaryHoverHex) primaryHover = cs.primaryHover || cs.primaryHoverHex;
      if (cs.secondary || cs.secondaryHex) secondary = cs.secondary || cs.secondaryHex;
      if (cs.textPrimary) textPrimary = cs.textPrimary;
      if (cs.textSecondary) textSecondary = cs.textSecondary;
      if (cs.textMuted) textMuted = cs.textMuted;
      if (cs.border) border = cs.border;
      if (cs.borderSubtle) borderSubtle = cs.borderSubtle;
      if (cs.accent || cs.accentGradient) accent = cs.accent || cs.accentGradient;
    }

    // Auto-tune contrast against WCAG AA requirements
    textPrimary = ensureContrast(textPrimary, background, 4.5);
    textPrimary = ensureContrast(textPrimary, surface, 4.5);
    textSecondary = ensureContrast(textSecondary, surface, 4.5);
    textOnPrimary = ensureContrast(textOnPrimary, primary, 4.5);
    focusRing = ensureContrast(focusRing, background, 3.0);

    // 7. Audit Contrast
    const audit: ContrastAuditResult = {
      textOnBackground: {
        ratio: getContrastRatio(textPrimary, background),
        passesAA: getContrastRatio(textPrimary, background) >= 4.5,
      },
      textOnSurface: {
        ratio: getContrastRatio(textPrimary, surface),
        passesAA: getContrastRatio(textPrimary, surface) >= 4.5,
      },
      textSecondaryOnSurface: {
        ratio: getContrastRatio(textSecondary, surface),
        passesAA: getContrastRatio(textSecondary, surface) >= 4.5,
      },
      textOnPrimaryButton: {
        ratio: getContrastRatio(textOnPrimary, primary),
        passesAA: getContrastRatio(textOnPrimary, primary) >= 4.5,
      },
      focusOnBackground: {
        ratio: getContrastRatio(focusRing, background),
        passesAA: getContrastRatio(focusRing, background) >= 3.0,
      },
      overallValid: true,
    };
    audit.overallValid =
      audit.textOnBackground.passesAA &&
      audit.textOnSurface.passesAA &&
      audit.textSecondaryOnSurface.passesAA &&
      audit.textOnPrimaryButton.passesAA &&
      audit.focusOnBackground.passesAA;

    // 8. Component-level Styling Tokens
    const themeId = `thm_${domain.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_${seed}`;
    const componentTokens: ThemeSpecification["componentTokens"] = {
      card: {
        bg: surface,
        border,
        shadow: isDark ? "0 4px 20px -2px rgba(0, 0, 0, 0.45)" : "0 4px 16px -2px rgba(0, 0, 0, 0.08)",
        radius: "0.75rem",
      },
      button: {
        primaryBg: primary,
        primaryText: textOnPrimary,
        primaryHoverBg: primaryHover,
        secondaryBg: "transparent",
        secondaryText: textPrimary,
        secondaryBorder: border,
      },
      input: {
        bg: surfaceRaised,
        border,
        focusBorder: focusRing,
        text: textPrimary,
        placeholder: textMuted,
      },
      table: {
        headerBg: surfaceMuted,
        rowHoverBg: isDark ? "rgba(255, 255, 255, 0.04)" : "rgba(0, 0, 0, 0.03)",
        borderColor: border,
      },
      tabs: {
        listBg: surfaceMuted,
        activeBg: surface,
        activeText: textPrimary,
      },
      badge: {
        primaryBg: primarySubtle,
        primaryText: primary,
        primaryBorder: isDark ? `rgba(${hexToRgb(primary).join(", ")}, 0.3)` : `rgba(${hexToRgb(primary).join(", ")}, 0.25)`,
      },
    };

    return {
      version: "2.0",
      themeId,
      domain,
      mode,
      brandHue,
      palette: {
        primary,
        primaryHover,
        primaryActive,
        primarySubtle,
        primaryScale,
        secondary,
        secondaryHover,
        secondaryScale,
        accent,
        accentScale,
        neutralScale,
        background,
        surface,
        surfaceRaised,
        surfaceMuted,
        textPrimary,
        textSecondary,
        textMuted,
        textOnPrimary,
        border,
        borderSubtle,
        focusRing,
        semantic: {
          success: isDark ? "#34d399" : "#059669",
          warning: isDark ? "#fbbf24" : "#d97706",
          error: isDark ? "#f87171" : "#dc2626",
          info: isDark ? "#38bdf8" : "#0284c7",
        },
      },
      componentTokens,
      contrastAudit: audit,
    };
  }

  /**
   * Persists the generated ThemeSpecification to `.aegis/theme.json`.
   */
  public static save(outputDirectory: string, theme: ThemeSpecification): string {
    const aegisDir = join(outputDirectory, ".aegis");
    if (!existsSync(aegisDir)) {
      mkdirSync(aegisDir, { recursive: true });
    }
    const themePath = join(aegisDir, "theme.json");
    writeFileSync(themePath, JSON.stringify(theme, null, 2), "utf8");
    return themePath;
  }

  /**
   * Generates the CSS custom properties snippet (:root { ... }) for index.css.
   */
  public static generateCssVariables(theme: ThemeSpecification): string {
    const p = theme.palette;
    return `/* ─── Aegis AI Theme Tokens (${theme.themeId} | ${theme.domain}) ─── */
:root {
  --color-primary: ${p.primary};
  --color-primary-hover: ${p.primaryHover};
  --color-primary-active: ${p.primaryActive};
  --color-primary-subtle: ${p.primarySubtle};

  --color-secondary: ${p.secondary};
  --color-secondary-hover: ${p.secondaryHover};
  --color-accent: ${p.accent};

  --color-background: ${p.background};
  --color-surface: ${p.surface};
  --color-surface-raised: ${p.surfaceRaised};
  --color-surface-muted: ${p.surfaceMuted};

  --color-text-primary: ${p.textPrimary};
  --color-text-secondary: ${p.textSecondary};
  --color-text-muted: ${p.textMuted};
  --color-text-on-primary: ${p.textOnPrimary};

  --color-border: ${p.border};
  --color-border-subtle: ${p.borderSubtle};
  --color-focus: ${p.focusRing};

  --color-success: ${p.semantic.success};
  --color-warning: ${p.semantic.warning};
  --color-error: ${p.semantic.error};
  --color-info: ${p.semantic.info};
}
`;
  }
}
