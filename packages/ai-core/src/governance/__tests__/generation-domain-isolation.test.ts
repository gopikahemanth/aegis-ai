import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { existsSync, mkdirSync, writeFileSync, rmSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { ArchitectureResolver, type ArchitectureContractV1 } from "../architecture-resolver.js";
import { ProjectMemoryEngine } from "../../memory/memory-engine.js";
import { DomainVisualDesignContractDeriver } from "../../design/domain-visual-contract.js";
import { DesignSystemGenerator } from "../../design/design-system-generator.js";

describe("Aegis Project Generation Isolation & Domain Contamination Regression Suite", () => {
  let testProjectDir: string;

  beforeEach(() => {
    testProjectDir = join(tmpdir(), `aegis-isolation-test-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`);
    mkdirSync(testProjectDir, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(testProjectDir)) {
      try {
        rmSync(testProjectDir, { recursive: true, force: true });
      } catch { /* ignore */ }
    }
  });

  it("TEST 1: ArchitectureResolver rejects stale contracts from previous unrelated domains", () => {
    // 1. Simulate an old art-gallery project contract written to .aegis/
    const aegisDir = join(testProjectDir, ".aegis");
    mkdirSync(aegisDir, { recursive: true });

    const staleContract: ArchitectureContractV1 = {
      version: 1,
      status: "locked",
      prompt: "Build an art gallery catalog with artworks and curated exhibitions",
      applicationType: "FULLSTACK_WEB_APPLICATION",
      architectureProfile: "React-Vite + Express + PostgreSQL",
      source: "user_prompt",
      confidence: 1.0,
      reason: "Art gallery spec",
      userSpecified: true,
      inferred: false,
      overridden: false,
      frontend: { framework: "React-Vite", provenance: "user" },
      backend: { framework: "Express", provenance: "user" },
      database: { provider: "PostgreSQL", orm: "Prisma", provenance: "user", ormProvenance: "user" },
      language: "TypeScript",
      styling: "TailwindCSS",
      packageManager: "pnpm",
      authentication: "JWT",
      requiredLibraries: ["prisma", "@prisma/client"],
      requiredFeatures: ["artworks", "exhibitions"],
      requiredRoutes: ["/api/artworks", "/api/exhibitions"],
      requiredModels: ["Artwork", "Exhibition"],
      projectStructure: { src: "Frontend", server: "Backend" },
    };

    writeFileSync(join(aegisDir, "architecture-contract.json"), JSON.stringify(staleContract, null, 2), "utf8");

    // 2. Resolve architecture for a fresh, unrelated prompt: Volt & Velvet Synthesizer Lab
    const freshPrompt = "Build a product monograph website for Volt & Velvet, an artisanal analog synthesizer lab.";
    const resolved = ArchitectureResolver.resolve(freshPrompt, undefined, undefined, testProjectDir);

    // 3. Verify that the resolved contract does NOT inherit the stale art-gallery models or routes
    expect(resolved.prompt).toBe(freshPrompt);
    expect(resolved.requiredModels).not.toContain("Artwork");
    expect(resolved.requiredModels).not.toContain("Exhibition");
    expect(resolved.requiredRoutes).not.toContain("/api/artworks");
    expect(resolved.requiredRoutes).not.toContain("/api/exhibitions");
  });

  it("TEST 2: ProjectMemoryEngine.wipeAllStaleState cleanly purges legacy .aegis artifacts", () => {
    const memEngine = new ProjectMemoryEngine(testProjectDir);
    memEngine.initDefaults("old-gallery", "Old Art Gallery Prompt");

    const aegisDir = join(testProjectDir, ".aegis");
    writeFileSync(join(aegisDir, "file-graph.json"), JSON.stringify({ domain: "ArtGallery" }), "utf8");
    writeFileSync(join(aegisDir, "domain-contract.json"), JSON.stringify({ entities: ["Artwork"] }), "utf8");

    expect(existsSync(join(aegisDir, "file-graph.json"))).toBe(true);
    expect(existsSync(join(aegisDir, "domain-contract.json"))).toBe(true);

    // Wipe stale state for new prompt
    ProjectMemoryEngine.wipeAllStaleState(testProjectDir);

    expect(existsSync(join(aegisDir, "file-graph.json"))).toBe(false);
    expect(existsSync(join(aegisDir, "domain-contract.json"))).toBe(false);
  });

  it("TEST 3: DomainVisualDesignContractDeriver identifies Synthesizer / Sound Lab without Kerala Craft Atelier leaks", () => {
    const prompt = "Build a product monograph website for Volt & Velvet, an artisanal analog synthesizer lab. Visitors should inspect custom modular oscillators, listen to sound waveform auditions, compare custom wood finish enclosures, view workshop master artisan profiles, and submit bespoke commission build requests.";

    const contract = DomainVisualDesignContractDeriver.derive(prompt);

    expect(contract.domain).toContain("Synthesizer");
    expect(contract.dashboardComposition.headline).toContain("Volt & Velvet");
    expect(contract.dashboardComposition.headline).not.toContain("Kerala Heritage Craft Atelier");
    expect(contract.dashboardComposition.alerts[0]).not.toContain("Mannar Lost-Wax");
    expect(contract.dashboardComposition.primaryMetric.label).toContain("Oscillator");
  });

  it("TEST 4: DesignSystemGenerator omits KanbanBoard for synthesizer monographs and e-commerce apps", () => {
    const dsGen = new DesignSystemGenerator();
    const synthSpec: any = {
      name: "Volt & Velvet",
      description: "Artisanal analog synthesizer lab",
      frontend: "react-vite",
      styling: "tailwind",
      features: ["Modular Oscillators", "Waveform Audition", "Wood Enclosures", "Bespoke Commissions"],
    };

    const files = dsGen.generate(synthSpec);
    const filePaths = files.map(f => f.path);
    const indexTs = files.find(f => f.path === "src/design-system/index.ts")?.content || "";

    expect(filePaths).not.toContain("src/design-system/components/KanbanBoard.tsx");
    expect(indexTs).not.toContain("KanbanBoard");
  });

  it("TEST 5: DesignSystemGenerator includes KanbanBoard only when explicitly required by project management features", () => {
    const dsGen = new DesignSystemGenerator();
    const pmSpec: any = {
      name: "SprintFlow",
      description: "Agile task and project management app",
      frontend: "react-vite",
      styling: "tailwind",
      features: ["Kanban Board", "Sprint Backlog", "Issue Tracking"],
    };

    const files = dsGen.generate(pmSpec);
    const filePaths = files.map(f => f.path);
    const indexTs = files.find(f => f.path === "src/design-system/index.ts")?.content || "";

    expect(filePaths).toContain("src/design-system/components/KanbanBoard.tsx");
    expect(indexTs).toContain("KanbanBoard");
  });
});
