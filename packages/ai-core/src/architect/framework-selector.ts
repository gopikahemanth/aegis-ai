import type { ProjectSpecification } from "./specification.js";

export class FrameworkSelector {
  private readonly supported = new Set([
    "react-vite",
    "express",
    "next",
    "html",
  ]);

  select(spec: ProjectSpecification): string {
    const frontend = (spec.frontend ?? "").toLowerCase().trim();
    const backend  = (spec.backend  ?? "").toLowerCase().trim();
    const type     = (spec.type     ?? "").toLowerCase().trim();
    const lang     = (spec.language ?? "").toLowerCase().trim();

    // ── Frontend detection (fuzzy) ────────────────────────────────────────────
    if (this.matchesReact(frontend)) return "react-vite";
    if (this.matchesNext(frontend))  return "next";
    if (frontend.includes("vue"))    return "html"; // vue not yet in template set
    if (frontend.includes("svelte")) return "html";
    if (frontend.includes("angular"))return "html";

    // ── Backend detection (when no frontend matched) ──────────────────────────
    if (backend.includes("express") || backend.includes("node"))  return "express";
    if (backend.includes("nest"))    return "express";

    // ── Smart fallback — if TypeScript + app/saas/website → react-vite ────────
    // This catches cases where the AI didn't populate spec.frontend clearly
    // but clearly intends a React app (generated .tsx files, SaaS type, etc.)
    if (lang === "typescript" && (
      type === "saas" ||
      type === "app" ||
      type === "website" ||
      type === "other"
    )) {
      return "react-vite";
    }

    return "html";
  }

  private matchesReact(s: string): boolean {
    return (
      s === "react" ||
      s === "react-vite" ||
      s === "reactjs" ||
      s.startsWith("react") ||   // "react + vite", "react.js", "react 18"
      s.includes("react") ||
      s === "vite"               // plain "vite" implies react-vite in our templates
    );
  }

  private matchesNext(s: string): boolean {
    return s.includes("next") || s === "nextjs";
  }
}
