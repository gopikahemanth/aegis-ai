import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { TemplateConvergenceGate } from "../template-convergence-gate.js";
import { mkdirSync, writeFileSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

describe("TemplateConvergenceGate", () => {
  let testProjectDir: string;

  beforeEach(() => {
    testProjectDir = join(tmpdir(), `aegis-conv-test-${Date.now()}`);
    mkdirSync(join(testProjectDir, "src", "pages"), { recursive: true });
    mkdirSync(join(testProjectDir, "src", "components"), { recursive: true });
    mkdirSync(join(testProjectDir, ".aegis"), { recursive: true });
  });

  afterEach(() => {
    try {
      if (existsSync(testProjectDir)) {
        rmSync(testProjectDir, { recursive: true, force: true });
      }
    } catch {}
  });

  it("fails when a specialized 3D experience downgrades to 0 canvases and generic card grids", () => {
    const plan = {
      productTitle: "Nebula Odyssey",
      experiencePattern: "immersive-3d",
      experienceCapability: {
        experienceType: "IMMERSIVE_3D",
        renderingMode: "webgl",
        real3dRequired: true,
      },
    };

    // Create a page that has 0 canvases, a generic Hero, and multiple card grids
    writeFileSync(
      join(testProjectDir, "src", "pages", "HomePage.tsx"),
      `import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function HomePage() {
  return (
    <div>
      <Navbar />
      <section className="hero"><h1>Welcome to Nebula</h1><button>Get Started</button></section>
      <section className="grid grid-cols-3">
        <div className="card">Card 1</div>
        <div className="card">Card 2</div>
        <div className="card">Card 3</div>
      </section>
      <section className="grid grid-cols-3">
        <div className="card">Card 4</div>
        <div className="card">Card 5</div>
        <div className="card">Card 6</div>
      </section>
      <section className="cta"><button>Join Now</button></section>
      <Footer />
    </div>
  );
}`
    );

    const report = TemplateConvergenceGate.audit(testProjectDir, plan);
    expect(report.passed).toBe(false);
    expect(report.violations.some(v => v.includes("downgraded to 0 canvases"))).toBe(true);
  });

  it("fails when a specialized experience reproduces the canned Hero -> Cards -> CTA sequence", () => {
    const plan = {
      productTitle: "Artisan Watchmaker",
      experiencePattern: "craft-editorial",
      experienceCapability: {
        experienceType: "EDITORIAL",
        renderingMode: "standard-dom",
        real3dRequired: false,
      },
    };

    writeFileSync(
      join(testProjectDir, "src", "pages", "HomePage.tsx"),
      `export default function HomePage() {
  return (
    <div>
      <header className="hero-banner"><h1>Chronographs</h1></header>
      <div className="features-cards card-grid grid-cols-3">
        <div className="card">Movement</div>
        <div className="card">Escapement</div>
        <div className="card">Case</div>
      </div>
      <div className="product-cards card-grid grid-cols-3">
        <div className="card">Model A</div>
        <div className="card">Model B</div>
      </div>
      <div className="cta-banner"><button>Pre-order</button></div>
    </div>
  );
}`
    );

    const report = TemplateConvergenceGate.audit(testProjectDir, plan);
    expect(report.passed).toBe(false);
    expect(report.violations.some(v => v.includes("GENERIC_CONVERGENCE_DETECTED"))).toBe(true);
  });

  it("passes when a real 3D spatial stage with WebGL canvas and HUD overlays is implemented", () => {
    const plan = {
      productTitle: "Kazzoo World",
      experiencePattern: "immersive-3d",
      experienceCapability: {
        experienceType: "IMMERSIVE_3D",
        renderingMode: "webgl",
        real3dRequired: true,
      },
      compositionGraph: {
        navigationModel: "pill-dock",
        focalElement: "Floating claymation island archipelago",
      },
    };

    writeFileSync(
      join(testProjectDir, "src", "pages", "HomePage.tsx"),
      `import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

export default function HomePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    (window as any).__AEGIS_EXPERIENCE__ = {
      experienceType: 'IMMERSIVE_3D',
      renderingMode: 'webgl',
      ready: true,
      sceneReady: true,
      objectsRendered: 24,
    };
  }, []);

  return (
    <div data-workspace="immersive_3d_stage" className="relative w-screen h-screen overflow-hidden">
      <canvas data-aegis-3d="true" ref={canvasRef} className="w-full h-full absolute inset-0" />
      <header className="pill-dock absolute top-4 inset-x-0 flex justify-center">
        <div className="nav-pill">Kazzoo Realm</div>
      </header>
      <div className="hud-overlay absolute bottom-6 inset-x-0 flex gap-4 justify-center">
        <button className="hud-pill">Overview Orbit</button>
        <button className="hud-pill">Sanctuary View</button>
      </div>
    </div>
  );
}`
    );

    const report = TemplateConvergenceGate.audit(testProjectDir, plan);
    expect(report.passed).toBe(true);
    expect(report.violations.length).toBe(0);
    expect(report.fingerprint.canvasCount).toBeGreaterThan(0);
  });

  it("detects GENERIC_PAGE_STRUCTURE_CONVERGENCE when 3 or more routes repeat search + filter + cards", () => {
    const plan = {
      productTitle: "Atelier Architecture Review",
      experiencePattern: "craft-editorial",
      experienceCapability: {
        experienceType: "EDITORIAL",
        renderingMode: "standard-dom",
        real3dRequired: false,
      },
    };

    // Create 3 pages that all use Search Input + Filter Buttons + Card Grid
    writeFileSync(
      join(testProjectDir, "src", "pages", "ProjectsPage.tsx"),
      `export default function ProjectsPage() {
        return (
          <div>
            <h1>Projects</h1>
            <input type="text" placeholder="Search architectural projects..." />
            <div className="filter-buttons"><button>Residential</button><button>Commercial</button></div>
            <div className="card-grid"><div className="card">Project 1</div><div className="card">Project 2</div></div>
          </div>
        );
      }`
    );

    writeFileSync(
      join(testProjectDir, "src", "pages", "ArchitectsPage.tsx"),
      `export default function ArchitectsPage() {
        return (
          <div>
            <h1>Architects</h1>
            <input type="text" placeholder="Search practitioners..." />
            <div className="filter-buttons"><button>All</button><button>Founders</button></div>
            <div className="card-grid"><div className="card">Architect 1</div><div className="card">Architect 2</div></div>
          </div>
        );
      }`
    );

    writeFileSync(
      join(testProjectDir, "src", "pages", "EssaysPage.tsx"),
      `export default function EssaysPage() {
        return (
          <div>
            <h1>Essays</h1>
            <input type="text" placeholder="Search articles..." />
            <div className="filter-buttons"><button>Theory</button><button>Criticism</button></div>
            <div className="card-grid"><div className="card">Essay 1</div><div className="card">Essay 2</div></div>
          </div>
        );
      }`
    );

    const report = TemplateConvergenceGate.audit(testProjectDir, plan);
    expect(report.passed).toBe(false);
    expect(report.violations.some(v => v.includes("GENERIC_PAGE_STRUCTURE_CONVERGENCE"))).toBe(true);
  });

  it("passes when routes have authentic, bespoke editorial compositions without card convergence", () => {
    const plan = {
      productTitle: "Atelier Architecture Review",
      experiencePattern: "craft-editorial",
      experienceCapability: {
        experienceType: "EDITORIAL",
        renderingMode: "standard-dom",
        real3dRequired: false,
      },
    };

    writeFileSync(
      join(testProjectDir, "src", "pages", "ProjectsPage.tsx"),
      `export default function ProjectsPage() {
        return (
          <article className="monograph-spread">
            <header className="editorial-masthead"><h1>Monograph: High-Alpine Timber Sanctuary</h1></header>
            <section className="asymmetric-layout">
              <div className="drawing-elevation"><img src="/elevation.svg" alt="Technical elevation" /></div>
              <blockquote className="pull-quote">Structure derived from regional topography.</blockquote>
            </section>
          </article>
        );
      }`
    );

    writeFileSync(
      join(testProjectDir, "src", "pages", "EssaysPage.tsx"),
      `export default function EssaysPage() {
        return (
          <main className="critical-essay-flow">
            <h1 className="manifesto-title">The Tectonic Inversion</h1>
            <p className="lead-paragraph">An inquiry into post-industrial timber systems.</p>
            <div className="marginalia-aside">Note 01: Sourced from Val Surses larch forests.</div>
          </main>
        );
      }`
    );

    writeFileSync(
      join(testProjectDir, "src", "pages", "DialoguesPage.tsx"),
      `export default function DialoguesPage() {
        return (
          <section className="dialogue-transcript">
            <h1 className="dialogue-head">Dialogue: Peter Zumthor & Kengo Kuma</h1>
            <div className="speaker-exchange"><span className="speaker">PZ:</span> Atmosphere precedes geometry.</div>
          </section>
        );
      }`
    );

    const report = TemplateConvergenceGate.audit(testProjectDir, plan);
    expect(report.passed).toBe(true);
    expect(report.violations.length).toBe(0);
  });
});
