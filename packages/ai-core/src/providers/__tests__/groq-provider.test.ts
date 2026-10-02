import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { GroqProvider } from "../groq.js";
import { env } from "../../utils/env.js";

describe("GroqProvider Defensive Guards", () => {
  const originalKey = env.GROQ_API_KEY;

  beforeEach(() => {
    (env as any).GROQ_API_KEY = "gsk_test_mock_key_12345";
  });

  afterEach(() => {
    (env as any).GROQ_API_KEY = originalKey;
    vi.restoreAllMocks();
  });

  it("throws GROQ_PROMPT_OVERFLOW_ERROR when assembled prompt exceeds safe limit (>7500 tokens)", async () => {
    const provider = new GroqProvider();

    // 7,500 tokens @ ~3.2 chars/token + 20% margin is approx 20,000 chars of code
    const oversizedContent = "export function doStuff() { return 123; }\n".repeat(800);
    expect(oversizedContent.length).toBeGreaterThan(25000);

    await expect(
      provider.chat([
        { role: "system", content: "You are a coder." },
        { role: "user", content: oversizedContent },
      ])
    ).rejects.toThrow("GROQ_PROMPT_OVERFLOW_ERROR");
  });

  it("throws GROQ_OUTPUT_TRUNCATED when Groq responds with finish_reason: length", async () => {
    const provider = new GroqProvider();

    // Mock client chat completions
    const mockClient = (provider as any).client;
    vi.spyOn(mockClient.chat.completions, "create").mockResolvedValue({
      id: "chatcmpl_mock",
      choices: [
        {
          finish_reason: "length",
          message: {
            content: "export function partialOutput() { const x =",
          },
        },
      ],
      usage: {
        prompt_tokens: 200,
        completion_tokens: 3500,
      },
    } as any);

    await expect(
      provider.chat([
        { role: "system", content: "Write a component." },
        { role: "user", content: "Build a navbar." },
      ])
    ).rejects.toThrow("GROQ_OUTPUT_TRUNCATED");
  });
});
