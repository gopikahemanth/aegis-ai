import { describe, it, expect, vi, beforeEach } from "vitest";
import { FailoverProvider } from "../failover.js";
import { GeminiProvider } from "../gemini.js";
import { ProviderError } from "../provider-error.js";
import type { AIProvider } from "../base.js";

describe("FailoverProvider Sticky Routing & Fast Skip", () => {
  beforeEach(() => {
    FailoverProvider.resetState();
    GeminiProvider.resetCooldowns();
  });

  it("switches to the working provider on failure and stays sticky on subsequent calls without re-probing the failed key", async () => {
    let key1Attempts = 0;
    let key2Attempts = 0;

    const mockKey1: AIProvider = {
      name: "gemini",
      chat: vi.fn().mockImplementation(async () => {
        key1Attempts++;
        throw new ProviderError("429 Resource has been exhausted (quota exceeded)", 120);
      }),
    };

    const mockKey2: AIProvider = {
      name: "gemini-2",
      chat: vi.fn().mockImplementation(async () => {
        key2Attempts++;
        return "Success from Key 2";
      }),
    };

    const failover = new FailoverProvider([mockKey1, mockKey2], 2, 10);

    // Initial state: starts at index 0
    expect(failover.getActiveProviderIndex()).toBe(0);

    // Call 1: Key 1 fails with 429, fails over to Key 2 which succeeds
    const res1 = await failover.chat([{ role: "user", content: "prompt 1" }]);
    expect(res1).toBe("Success from Key 2");
    expect(key1Attempts).toBe(1);
    expect(key2Attempts).toBe(1);
    expect(failover.getActiveProviderIndex()).toBe(1);

    // Call 2: Must directly call Key 2! Key 1 must NOT be probed again!
    const res2 = await failover.chat([{ role: "user", content: "prompt 2" }]);
    expect(res2).toBe("Success from Key 2");
    expect(key1Attempts).toBe(1); // STILL 1! No wasted time on dead key!
    expect(key2Attempts).toBe(2);
    expect(failover.getActiveProviderIndex()).toBe(1);

    // Call 3: Must still stick with Key 2
    const res3 = await failover.chat([{ role: "user", content: "prompt 3" }]);
    expect(res3).toBe("Success from Key 2");
    expect(key1Attempts).toBe(1); // STILL 1!
    expect(key2Attempts).toBe(3);
  });

  it("rotates stickily to Key 3 when Key 2 eventually fails", async () => {
    let key2Calls = 0;
    let key3Calls = 0;

    const mockKey1: AIProvider = {
      name: "gemini",
      chat: vi.fn().mockRejectedValue(new ProviderError("429 Rate limit", 60)),
    };

    const mockKey2: AIProvider = {
      name: "gemini-2",
      chat: vi.fn().mockImplementation(async () => {
        key2Calls++;
        if (key2Calls > 1) {
          throw new ProviderError("429 Quota exhausted", 60);
        }
        return "Key 2 response";
      }),
    };

    const mockKey3: AIProvider = {
      name: "gemini-3",
      chat: vi.fn().mockImplementation(async () => {
        key3Calls++;
        return "Key 3 response";
      }),
    };

    const failover = new FailoverProvider([mockKey1, mockKey2, mockKey3], 2, 10);

    // Call 1: Key 1 fails -> Key 2 succeeds
    const res1 = await failover.chat([{ role: "user", content: "task 1" }]);
    expect(res1).toBe("Key 2 response");
    expect(failover.getActiveProviderIndex()).toBe(1);

    // Call 2: Key 2 fails -> falls over to Key 3 which succeeds
    const res2 = await failover.chat([{ role: "user", content: "task 2" }]);
    expect(res2).toBe("Key 3 response");
    expect(failover.getActiveProviderIndex()).toBe(2);

    // Call 3: Starts directly at Key 3 without probing Key 1 or Key 2
    const res3 = await failover.chat([{ role: "user", content: "task 3" }]);
    expect(res3).toBe("Key 3 response");
    expect(key3Calls).toBe(2);
  });

  it("GeminiProvider fast-skips immediately in 0ms when all candidate models on that key are in cooldown", async () => {
    const provider = new GeminiProvider("mock_key", "gemini-test-fast-skip");
    const mockClient = (provider as any).client;

    vi.spyOn(mockClient.models, "generateContent").mockImplementation(async () => {
      throw new Error("429 Quota exceeded (check quota)");
    });

    // First call will exhaust available models and place them on cooldown
    try {
      await provider.chat([{ role: "user", content: "test" }]);
    } catch (e) {
      // Expected ProviderError
    }

    // Now all models for this key are on cooldown. Next call must throw immediately without generateContent
    const generateSpy = vi.spyOn(mockClient.models, "generateContent");
    generateSpy.mockClear();

    const startTime = Date.now();
    await expect(provider.chat([{ role: "user", content: "second call" }]))
      .rejects.toThrow(/All models in cooldown/);
    const duration = Date.now() - startTime;

    // generateContent was never called!
    expect(generateSpy).not.toHaveBeenCalled();
    // Took less than 50ms
    expect(duration).toBeLessThan(100);
  });
});
