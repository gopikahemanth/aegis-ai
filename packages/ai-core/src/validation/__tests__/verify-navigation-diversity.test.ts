import { describe, it, expect } from "vitest";
import { NavigationDesignResolver } from "../../design/navigation-design.js";
import { CopyQualityGate } from "../copy-quality-gate.js";
import { TemplateConvergenceGate } from "../template-convergence-gate.js";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

describe("Cross-Project Navigation Diversity Verification", () => {
  it("proves 4 unrelated projects have 100% distinct bespoke navigation systems", async () => {
    console.log("================================================================================");
    console.log("AEGIS NAVIGATION DIVERGENCE & WEBSITE IDENTITY VERIFICATION");
    console.log("================================================================================\n");

    const projects = [
      {
        name: "Kazzoo 3D Fantasy",
        prompt: "Create a whimsical 3D claymation fantasy adventure world called Kazzoo with floating islands and soundboard.",
        pattern: "immersive-3d",
        brand: "KAZZOO",
        tagline: "Whimsical Realm Explorer",
        routes: [
          { path: "/", title: "WorldStage" },
          { path: "/characters", title: "Characters" },
          { path: "/quest-map", title: "Quests" },
          { path: "/soundboard", title: "Soundboard" },
        ]
      },
      {
        name: "Fashion / Editorial Monograph",
        prompt: "Create an independent fashion magazine and monograph publication with photographer profiles and photo essays.",
        pattern: "craft-editorial",
        brand: "REVUE NOIR",
        tagline: "Autumn / Winter Monograph",
        routes: [
          { path: "/", title: "Monograph" },
          { path: "/essays", title: "Essays" },
          { path: "/photographers", title: "Photographers" },
          { path: "/visual-stories", title: "VisualStories" },
        ]
      },
      {
        name: "Luxury Bespoke Perfume",
        prompt: "Create a luxury bespoke perfume maison website showcasing crystal flacons and olfactory notes.",
        pattern: "bespoke-luxury",
        brand: "MAISON ÉTHER",
        tagline: "Haute Parfumerie",
        routes: [
          { path: "/", title: "TheFlacon" },
          { path: "/notes", title: "FragranceNotes" },
          { path: "/atelier", title: "TheAtelier" },
        ]
      },
      {
        name: "Solar Telemetry Analytics",
        prompt: "Create an industrial solar panel telemetry analytics and dispatch dashboard with live array monitoring.",
        pattern: "operations-dashboard",
        brand: "SOLARPULSE",
        tagline: "Photovoltaic Operations",
        routes: [
          { path: "/", title: "Telemetry" },
          { path: "/arrays", title: "SolarArrays" },
          { path: "/efficiency", title: "EfficiencyCurve" },
          { path: "/alerts", title: "AlertLog" },
        ]
      }
    ];

    const results: any[] = [];

    for (const p of projects) {
      const design = NavigationDesignResolver.resolve(
        p.prompt,
        p.pattern,
        p.brand,
        p.tagline,
        p.routes
      );
      const fingerprint = NavigationDesignResolver.computeFingerprint(design);
      const navbarCode = NavigationDesignResolver.generateNavbarCode(design);

      // Create temp project to audit with TemplateConvergenceGate & CopyQualityGate
      const tmpDir = join(tmpdir(), `aegis-verify-${p.brand.toLowerCase().replace(/[^a-z0-9]/g, "")}-${Date.now()}`);
      mkdirSync(join(tmpDir, "src", "components"), { recursive: true });
      mkdirSync(join(tmpDir, "src", "pages"), { recursive: true });
      writeFileSync(join(tmpDir, "src", "components", "Navbar.tsx"), navbarCode, "utf8");

      // Add sample homepage
      const canvasElement = p.pattern === "immersive-3d" ? '<canvas data-aegis-3d="true" />' : '';
      writeFileSync(
        join(tmpDir, "src", "pages", "HomePage.tsx"),
        `import React from "react";
import Navbar from "../components/Navbar";
export default function HomePage() {
  return (
    <div>
      <Navbar />
      ${canvasElement}
      <h1>${p.brand}</h1>
      <p>${p.tagline}</p>
    </div>
  );
}`
      );

      const convReport = TemplateConvergenceGate.audit(tmpDir, {
        productTitle: p.brand,
        experiencePattern: p.pattern,
        navigationDesign: design,
        experienceCapability: {
          experienceType: p.pattern === "immersive-3d" ? "IMMERSIVE_3D" : p.pattern === "craft-editorial" ? "EDITORIAL" : "CUSTOM",
          renderingMode: p.pattern === "immersive-3d" ? "webgl" : "standard-dom",
          real3dRequired: p.pattern === "immersive-3d"
        }
      } as any);

      const copyReport = CopyQualityGate.audit(tmpDir);

      rmSync(tmpDir, { recursive: true, force: true });

      results.push({
        project: p.name,
        brand: design.brandTreatment.name,
        model: design.model,
        position: design.position,
        items: design.primaryItems.map(i => `${i.label} (${i.path})`).join(", "),
        fingerprintHash: fingerprint.fingerprintHash,
        hasMoreMenu: fingerprint.hasMoreMenu,
        convergencePassed: convReport.passed,
        websiteIdentity: convReport.websiteIdentity,
        copyQualityPassed: copyReport.passed,
        violations: convReport.violations
      });
    }

    console.log("PROJECT NAVIGATION COMPARISON TABLE:");
    console.log("--------------------------------------------------------------------------------");
    for (const r of results) {
      console.log(`[${r.project}]`);
      console.log(`  Brand:             ${r.brand}`);
      console.log(`  Navigation Model:  ${r.model} (Position: ${r.position})`);
      console.log(`  Navigation Items:  ${r.items}`);
      console.log(`  Fingerprint Hash:  ${r.fingerprintHash}`);
      console.log(`  Has 'More' Menu:   ${r.hasMoreMenu ? "YES" : "NO (Clean curated contract)"}`);
      console.log(`  Convergence Gate:  ${r.convergencePassed ? "PASS" : "FAIL"}`);
      console.log(`  Copy Quality Gate: ${r.copyQualityPassed ? "PASS" : "FAIL"}`);
      console.log(`  WEBSITE_IDENTITY:`);
      console.log(`    ├── Navigation        ${r.websiteIdentity.navigation}`);
      console.log(`    ├── Composition       ${r.websiteIdentity.composition}`);
      console.log(`    ├── Visual Language   ${r.websiteIdentity.visualLanguage}`);
      console.log(`    ├── Interaction Model ${r.websiteIdentity.interactionModel}`);
      console.log(`    ├── Content           ${r.websiteIdentity.content}`);
      console.log(`    └── Responsive        ${r.websiteIdentity.responsive}`);
      console.log("--------------------------------------------------------------------------------");
    }

    const hashes = new Set(results.map(r => r.fingerprintHash));
    const models = new Set(results.map(r => r.model));

    console.log(`Total Projects Audited:   ${results.length}`);
    console.log(`Unique Fingerprint Hashes: ${hashes.size} / ${results.length}`);
    console.log(`Unique Navigation Models:  ${models.size} / ${results.length}`);

    expect(hashes.size).toBe(4);
    expect(models.size).toBe(4);
    for (const r of results) {
      expect(r.hasMoreMenu).toBe(false);
      expect(r.convergencePassed).toBe(true);
      expect(r.websiteIdentity.navigation).toBe("PASS");
    }
  });
});
