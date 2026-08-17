/**
 * DesignSystemEngine
 *
 * Generates an authoritative, machine-readable Design System composed of design tokens
 * for typography, color palettes, spacing, border radii, elevation shadows, and component styles.
 */

export interface ColorTokenScale {
  50: string;
  100: string;
  500: string;
  700: string;
  900: string;
  950: string;
}

export interface DesignSystem {
  systemId: string;
  name: string;
  typography: {
    fontFamilySans: string;
    fontFamilyMono: string;
    scale: { xs: string; sm: string; base: string; lg: string; xl: string; "2xl": string; "3xl": string };
    lineHeights: { tight: number; normal: number; relaxed: number };
  };
  colors: {
    primary: ColorTokenScale;
    slate: ColorTokenScale;
    accent: string;
    background: string;
    surface: string;
    border: string;
    textPrimary: string;
    textMuted: string;
    success: string;
    warning: string;
    danger: string;
  };
  spacing: {
    xs: string; // 4px
    sm: string; // 8px
    md: string; // 16px
    lg: string; // 24px
    xl: string; // 32px
    "2xl": string; // 48px
  };
  radii: {
    sm: string; // 6px
    md: string; // 10px
    lg: string; // 16px
    full: string; // 9999px
  };
  shadows: {
    sm: string;
    md: string;
    xl: string;
  };
  componentTokens: {
    buttonRadius: string;
    cardPadding: string;
    inputHeight: string;
    modalBackdropBlur: string;
  };
  createdAt: string;
}

export class DesignSystemEngine {
  public static generateDesignSystem(themeName: string = "Emerald Slate Pro"): DesignSystem {
    return {
      systemId: `ds_${Date.now()}`,
      name: themeName,
      typography: {
        fontFamilySans: "Inter, system-ui, -apple-system, sans-serif",
        fontFamilyMono: "JetBrains Mono, monospace",
        scale: {
          xs: "0.75rem",
          sm: "0.875rem",
          base: "1rem",
          lg: "1.125rem",
          xl: "1.25rem",
          "2xl": "1.5rem",
          "3xl": "1.875rem",
        },
        lineHeights: { tight: 1.25, normal: 1.5, relaxed: 1.75 },
      },
      colors: {
        primary: {
          50: "#ecfdf5",
          100: "#d1fae5",
          500: "#10b981",
          700: "#047857",
          900: "#064e3b",
          950: "#022c22",
        },
        slate: {
          50: "#f8fafc",
          100: "#f1f5f9",
          500: "#64748b",
          700: "#334155",
          900: "#0f172a",
          950: "#020617",
        },
        accent: "#38bdf8",
        background: "#020617",
        surface: "#0f172a",
        border: "#1e293b",
        textPrimary: "#ffffff",
        textMuted: "#94a3b8",
        success: "#10b981",
        warning: "#f59e0b",
        danger: "#ef4444",
      },
      spacing: {
        xs: "0.25rem",
        sm: "0.5rem",
        md: "1rem",
        lg: "1.5rem",
        xl: "2rem",
        "2xl": "3rem",
      },
      radii: {
        sm: "0.375rem",
        md: "0.625rem",
        lg: "1rem",
        full: "9999px",
      },
      shadows: {
        sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        md: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
        xl: "0 20px 25px -5px rgb(0 0 0 / 0.3)",
      },
      componentTokens: {
        buttonRadius: "0.625rem",
        cardPadding: "1.5rem",
        inputHeight: "2.5rem",
        modalBackdropBlur: "blur(8px)",
      },
      createdAt: new Date().toISOString(),
    };
  }
}
