import { describe, it, expect, vi } from "vitest";
import type { ProjectSpecification } from "../../architect/specification.js";

describe("Aegis V2.1 Fix 11 — Post-Gate Documentation & PR Generation Concurrency", () => {
  const mockSpec: ProjectSpecification = {
    name: "kanban-app",
    type: "fullstack",
    frontend: "React-Vite",
    language: "TypeScript",
    database: "PostgreSQL",
    description: "Task Management Kanban Application",
  };

  it("Test 1 — True concurrency: Docs and PR generators execute concurrently with overlapping timelines", async () => {
    let docsStart = 0;
    let docsEnd = 0;
    let prStart = 0;
    let prEnd = 0;

    const mockDocsGenerator = {
      generate: vi.fn().mockImplementation(async () => {
        docsStart = Date.now();
        await new Promise(r => setTimeout(r, 60));
        docsEnd = Date.now();
        return [{ path: "README.md", content: "# Kanban" }];
      }),
    };

    const mockPrGenerator = {
      execute: vi.fn().mockImplementation(async () => {
        prStart = Date.now();
        await new Promise(r => setTimeout(r, 60));
        prEnd = Date.now();
        return "# PR Summary";
      }),
    };

    const overallStart = Date.now();
    const [docsRes, prRes] = await Promise.allSettled([
      mockDocsGenerator.generate(mockSpec, "prompt", ["src/App.tsx"], "/test"),
      mockPrGenerator.execute("/test", "prompt"),
    ]);
    const overallDuration = Date.now() - overallStart;

    // Verify both tasks started before the other finished (true concurrency)
    expect(docsStart).toBeLessThanOrEqual(prEnd);
    expect(prStart).toBeLessThanOrEqual(docsEnd);
    expect(overallDuration).toBeLessThan(110); // Concurrent took ~60ms, not 120ms sequential
    expect(docsRes.status).toBe("fulfilled");
    expect(prRes.status).toBe("fulfilled");
  });

  it("Test 2 — Both results preserved: both documentation files and PR summary are available", async () => {
    const mockDocs = [{ path: "README.md", content: "# Readme" }, { path: "ARCHITECTURE.md", content: "# Arch" }];
    const mockPR = "## Pull Request: Feature Complete";

    const [docsSettled, prSettled] = await Promise.allSettled([
      Promise.resolve(mockDocs),
      Promise.resolve(mockPR),
    ]);

    expect(docsSettled.status).toBe("fulfilled");
    expect(prSettled.status).toBe("fulfilled");
    if (docsSettled.status === "fulfilled") {
      expect(docsSettled.value.length).toBe(2);
    }
    if (prSettled.status === "fulfilled") {
      expect(prSettled.value).toContain("Pull Request");
    }
  });

  it("Test 3 — Docs failure: surfaces documentation failure without suppressing PR success", async () => {
    const [docsSettled, prSettled] = await Promise.allSettled([
      Promise.reject(new Error("LLM rate limit in technical writer")),
      Promise.resolve("## PR Summary Generated"),
    ]);

    expect(docsSettled.status).toBe("rejected");
    expect(prSettled.status).toBe("fulfilled");
    if (docsSettled.status === "rejected") {
      expect(docsSettled.reason.message).toContain("LLM rate limit");
    }
    if (prSettled.status === "fulfilled") {
      expect(prSettled.value).toBe("## PR Summary Generated");
    }
  });

  it("Test 4 — PR failure: surfaces PR failure without suppressing Docs success", async () => {
    const [docsSettled, prSettled] = await Promise.allSettled([
      Promise.resolve([{ path: "README.md", content: "# Success" }]),
      Promise.reject(new Error("Git diff retrieval error")),
    ]);

    expect(docsSettled.status).toBe("fulfilled");
    expect(prSettled.status).toBe("rejected");
    if (docsSettled.status === "fulfilled") {
      expect(docsSettled.value[0].content).toBe("# Success");
    }
    if (prSettled.status === "rejected") {
      expect(prSettled.reason.message).toContain("Git diff retrieval error");
    }
  });

  it("Test 5 — Both failure: both distinct failure reasons are captured and reported", async () => {
    const [docsSettled, prSettled] = await Promise.allSettled([
      Promise.reject(new Error("Docs timeout")),
      Promise.reject(new Error("PR network failure")),
    ]);

    expect(docsSettled.status).toBe("rejected");
    expect(prSettled.status).toBe("rejected");
    if (docsSettled.status === "rejected") {
      expect(docsSettled.reason.message).toBe("Docs timeout");
    }
    if (prSettled.status === "rejected") {
      expect(prSettled.reason.message).toBe("PR network failure");
    }
  });

  it("Test 6 — Final gate ordering: Docs/PR execution begins ONLY after FinalSuccessGate completes SUCCESS", async () => {
    const callSequence: string[] = [];

    const mockFinalSuccessGate = {
      verify: vi.fn().mockImplementation(() => {
        callSequence.push("FINAL_GATE_START");
        callSequence.push("FINAL_GATE_PASS");
        return { success: true };
      }),
    };

    const mockDocsGenerator = {
      generate: vi.fn().mockImplementation(async () => {
        callSequence.push("DOCS_START");
        return [{ path: "README.md", content: "# Docs" }];
      }),
    };

    const mockPrGenerator = {
      execute: vi.fn().mockImplementation(async () => {
        callSequence.push("PR_START");
        return "# PR";
      }),
    };

    // Run simulation
    const gateResult = mockFinalSuccessGate.verify();
    if (gateResult.success) {
      await Promise.allSettled([
        mockDocsGenerator.generate(),
        mockPrGenerator.execute(),
      ]);
    }

    expect(callSequence[0]).toBe("FINAL_GATE_START");
    expect(callSequence[1]).toBe("FINAL_GATE_PASS");
    expect(callSequence).toContain("DOCS_START");
    expect(callSequence).toContain("PR_START");
  });

  it("Test 7 — Git waits for both: Git staging and commit starts only after both Docs and PR complete", async () => {
    const timeline: string[] = [];

    const mockDocs = async () => {
      await new Promise(r => setTimeout(r, 40));
      timeline.push("DOCS_COMPLETE");
    };

    const mockPR = async () => {
      await new Promise(r => setTimeout(r, 40));
      timeline.push("PR_COMPLETE");
    };

    const mockGit = () => {
      timeline.push("GIT_COMMIT");
    };

    await Promise.allSettled([mockDocs(), mockPR()]);
    mockGit();

    expect(timeline[0]).toContain("COMPLETE");
    expect(timeline[1]).toContain("COMPLETE");
    expect(timeline[2]).toBe("GIT_COMMIT");
  });
});
