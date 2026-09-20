import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve, join } from "node:path";
import puppeteer, { Browser, Page } from "puppeteer";
import { spawn, ChildProcess } from "node:child_process";
import { DeterministicProjectFixer } from "../../validation/deterministic-project-fixer.js";
import { ArchitectureResolver } from "../architecture-resolver.js";

const VOLT_VELVET_PROMPT = `Volt & Velvet Analog Synthesizers & Acoustic Monograph.
Create a high-end synthesizer lab with modular oscillator inspection, real-time waveform auditioning,
handcrafted wood enclosure comparison, master artisan profiles, and bespoke commission request workflow.`;

describe("Browser Functional Interaction & Reality Certification Suite (Real Chromium)", () => {
  let projectDir: string;
  let viteProcess: ChildProcess | null = null;
  let browser: Browser | null = null;
  let page: Page | null = null;
  const PORT = 5180;
  const APP_URL = `http://localhost:${PORT}`;

  beforeAll(async () => {
    // 1. Target canonical generated project directory
    projectDir = resolve(__dirname, "../../../../../apps/cli/generated/project");

    // Derive fresh Volt & Velvet contract
    const contract = ArchitectureResolver.resolve(VOLT_VELVET_PROMPT);

    // Apply deterministic generation & interactive components
    DeterministicProjectFixer.fixProject(projectDir, contract);

    // 2. Ensure Vite server is responsive on port 5180
    let ready = false;
    try {
      const res = await fetch(APP_URL);
      if (res.ok || res.status === 200) ready = true;
    } catch {}

    if (!ready) {
      const viteBin = join(projectDir, "node_modules", ".bin", process.platform === "win32" ? "vite.cmd" : "vite");
      viteProcess = spawn(viteBin, ["--port", String(PORT), "--strictPort"], {
        cwd: projectDir,
        shell: true,
        stdio: "pipe",
        env: { ...process.env, NODE_ENV: "development" },
      });

      for (let i = 0; i < 30; i++) {
        await new Promise((r) => setTimeout(r, 500));
        try {
          const res = await fetch(APP_URL);
          if (res.ok || res.status === 200) {
            ready = true;
            break;
          }
        } catch {}
      }
    }

    if (!ready) {
      throw new Error(`Vite dev server is not reachable on ${APP_URL}`);
    }

    // 3. Launch real headless Chromium
    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--autoplay-policy=no-user-gesture-required",
      ],
    });

    page = await browser.newPage();
    page.on("console", (msg) => console.log("BROWSER LOG:", msg.text()));
    page.on("pageerror", (err) => console.error("BROWSER ERROR:", err.message));
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(APP_URL, { waitUntil: "domcontentloaded", timeout: 20000 });
    await page.waitForSelector('[data-testid="catalog-grid-workspace"]', { timeout: 10000 });
  }, 45000);

  afterAll(async () => {
    if (page) await page.close().catch(() => {});
    if (browser) await browser.close().catch(() => {});
    if (viteProcess) {
      try {
        viteProcess.kill();
      } catch {}
    }
  });

  it("Requirement 1: Modular Oscillator Selection & Inspection produces visible specification mutation", async () => {
    expect(page).not.toBeNull();
    if (!page) return;

    // Check workspace presence
    const workspace = await page.$('[data-testid="catalog-grid-workspace"]');
    expect(workspace).not.toBeNull();

    // Verify initial inspector state exists
    const initialInspector = await page.$eval(
      '[data-testid="selected-oscillator-inspector"]',
      (el) => el.textContent
    );
    expect(initialInspector).toContain("VCO-1");

    // Click on VCO-2 Sub-Harmonic card
    await page.click('[data-testid="oscillator-card-vco-2"]');
    await new Promise((r) => setTimeout(r, 200));

    // Verify inspector updated with VCO-2 specs
    const updatedInspector = await page.$eval(
      '[data-testid="selected-oscillator-inspector"]',
      (el) => el.textContent
    );
    expect(updatedInspector).toContain("VCO-2 Sub-Harmonic");
    expect(updatedInspector).toContain("Dual Triangle Folding");
  });

  it("Requirement 2: Waveform Audition triggers Web Audio tone synthesis & visualizer state", async () => {
    expect(page).not.toBeNull();
    if (!page) return;

    // Verify audition studio is present
    const studio = await page.$('[data-testid="waveform-audition-studio"]');
    expect(studio).not.toBeNull();

    // Click Sawtooth audition button
    await page.click('[data-testid="audition-button-sawtooth"]');
    await new Promise((r) => setTimeout(r, 100));

    // Verify active audition badge displays state
    const badgeText = await page.$eval(
      '[data-testid="audition-active-badge"]',
      (el) => el.textContent
    );
    expect(badgeText).toContain("AUDITIONING SAWTOOTH");

    // Click Triangle audition button
    await page.click('[data-testid="audition-button-triangle"]');
    await new Promise((r) => setTimeout(r, 100));

    const updatedBadge = await page.$eval(
      '[data-testid="audition-active-badge"]',
      (el) => el.textContent
    );
    expect(updatedBadge).toContain("AUDITIONING TRIANGLE");

    // Verify AudioContext is available in window
    const hasAudioApi = await page.evaluate(() => {
      return typeof window.AudioContext !== "undefined" || typeof (window as any).webkitAudioContext !== "undefined";
    });
    expect(hasAudioApi).toBe(true);
  });

  it("Requirement 3: Handcrafted Wood Enclosure comparison matrix updates on selection", async () => {
    expect(page).not.toBeNull();
    if (!page) return;

    // Check comparison matrix element
    const matrix = await page.$('[data-testid="enclosure-comparison-matrix"]');
    expect(matrix).not.toBeNull();

    // Click European Flame Ash selector
    await page.click('[data-testid="wood-selector-ash"]');
    await new Promise((r) => setTimeout(r, 200));

    // Verify comparison matrix displays Ash specs
    const ashContent = await page.$eval(
      '[data-testid="enclosure-comparison-matrix"]',
      (el) => el.textContent
    );
    expect(ashContent).toContain("European Flame Ash");
    expect(ashContent).toContain("710 kg/m³");
    expect(ashContent).toContain("Bavarian Forest");

    // Click Gabon Ebony selector
    await page.click('[data-testid="wood-selector-ebony"]');
    await new Promise((r) => setTimeout(r, 200));

    const ebonyContent = await page.$eval(
      '[data-testid="enclosure-comparison-matrix"]',
      (el) => el.textContent
    );
    expect(ebonyContent).toContain("Midnight Gabon Ebony");
    expect(ebonyContent).toContain("1,120 kg/m³");
  });

  it("Requirement 4: Master Artisan Bio modal opens and closes interactively", async () => {
    expect(page).not.toBeNull();
    if (!page) return;

    // Click Alistair Vance artisan card
    await page.click('[data-testid="artisan-card-art-1"]');
    await new Promise((r) => setTimeout(r, 300));

    // Verify modal appeared in DOM
    const modal = await page.$('[data-testid="artisan-bio-modal"]');
    expect(modal).not.toBeNull();

    const modalText = await page.$eval(
      '[data-testid="artisan-bio-modal"]',
      (el) => el.textContent
    );
    expect(modalText).toContain("Alistair Vance");
    expect(modalText).toContain("Master Electronic Luthier");
    expect(modalText).toContain("Discrete Transistor Topologies");

    // Close modal
    await page.click('[data-testid="close-artisan-modal"]');
    await new Promise((r) => setTimeout(r, 200));

    const closedModal = await page.$('[data-testid="artisan-bio-modal"]');
    expect(closedModal).toBeNull();
  });

  it("Requirement 5: Bespoke Commission Request form validates and submits with success feedback", async () => {
    expect(page).not.toBeNull();
    if (!page) return;

    // Open commission inquiry modal
    await page.click('[data-testid="commission-inquiry-button"]');
    await new Promise((r) => setTimeout(r, 300));

    // Verify modal opened
    const modal = await page.$('[data-testid="commission-inquiry-modal"]');
    expect(modal).not.toBeNull();

    // Fill notes input
    await page.type('[data-testid="commission-notes-input"]', "Front panel engraved: Opus 42 Calibrated");

    // Submit form
    await page.click('[data-testid="submit-commission-button"]');
    await new Promise((r) => setTimeout(r, 400));

    // Verify success banner appeared
    const successBanner = await page.$('[data-testid="commission-success-banner"]');
    expect(successBanner).not.toBeNull();

    const bannerText = await page.$eval(
      '[data-testid="commission-success-banner"]',
      (el) => el.textContent
    );
    expect(bannerText).toContain("Commission Request Lodged Successfully");
  });
});
