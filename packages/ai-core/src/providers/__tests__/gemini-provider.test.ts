import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { GeminiProvider } from "../gemini.js";
import { env } from "../../utils/env.js";

describe("GeminiProvider Rate-Limit Cooldown & Model Purging", () => {
  const originalKey = env.GEMINI_API_KEY;

  beforeEach(() => {
    (env as any).GEMINI_API_KEY = "mock_gemini_key_12345";
    GeminiProvider.resetCooldowns();
  });

  afterEach(() => {
    (env as any).GEMINI_API_KEY = originalKey;
    GeminiProvider.resetCooldowns();
    vi.restoreAllMocks();
  });

  it("purges gemini-3.8-flash by default in invalidModels", () => {
    const invalid = GeminiProvider.getInvalidModels();
    expect(invalid.has("gemini-3.8-flash")).toBe(true);
  });

  it("caches 60s cooldown on 429 and skips cooled-down model on next call", async () => {
    const provider = new GeminiProvider();
    const mockClient = (provider as any).client;

    let callCount = 0;
    const attemptedModels: string[] = [];

    vi.spyOn(mockClient.models, "generateContent").mockImplementation(async (params: any) => {
      callCount++;
      attemptedModels.push(params.model);

      if (params.model === "gemini-3.6-flash") {
        const err: any = new Error("Resource has been exhausted (e.g. check quota) 429");
        throw err;
      }
      return {
        text: "Response from fallback model",
        candidates: [{ finishReason: "STOP" }],
      };
    });

    const res1 = await provider.chat([{ role: "user", content: "hello" }]);
    expect(res1).toBe("Response from fallback model");
    expect(attemptedModels).toContain("gemini-3.6-flash");
    expect(attemptedModels).toContain("gemini-3.7-flash");

    // gemini-3.6-flash should now be on cooldown
    const cooldowns = GeminiProvider.getModelCooldowns();
    expect(cooldowns.has("gemini-3.6-flash")).toBe(true);
    expect(cooldowns.get("gemini-3.6-flash")).toBeGreaterThan(Date.now());

    // Second call: gemini-3.6-flash MUST be skipped immediately without calling generateContent
    attemptedModels.length = 0;
    const res2 = await provider.chat([{ role: "user", content: "hello again" }]);
    expect(res2).toBe("Response from fallback model");
    expect(attemptedModels).not.toContain("gemini-3.6-flash");
    expect(attemptedModels[0]).toBe("gemini-3.7-flash");
  });

  it("marks model permanently invalid on 404 NOT_FOUND", async () => {
    const provider = new GeminiProvider();
    const mockClient = (provider as any).client;

    const attemptedModels: string[] = [];
    vi.spyOn(mockClient.models, "generateContent").mockImplementation(async (params: any) => {
      attemptedModels.push(params.model);

      if (params.model === "gemini-3.6-flash") {
        const err: any = new Error("models/gemini-3.6-flash is not found (404 NOT_FOUND)");
        throw err;
      }
      return {
        text: "OK",
        candidates: [{ finishReason: "STOP" }],
      };
    });

    await provider.chat([{ role: "user", content: "test" }]);
    expect(GeminiProvider.getInvalidModels().has("gemini-3.6-flash")).toBe(true);

    attemptedModels.length = 0;
    await provider.chat([{ role: "user", content: "test2" }]);
    expect(attemptedModels).not.toContain("gemini-3.6-flash");
  });
});
