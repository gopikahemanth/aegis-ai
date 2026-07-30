export const Models = {
  groq: {
    default: "llama-3.3-70b-versatile",
    strong: "llama-3.3-70b-versatile",
    fast: "llama-3.1-8b-instant",
    balanced: "llama-3.3-70b-versatile",
  },

  openai: {
    default: "gpt-5.5",
    strong: "gpt-5.5",
    fast: "gpt-5.5-mini",
    balanced: "gpt-5.5",
  },

  anthropic: {
    default: "claude-sonnet-4",
    strong: "claude-sonnet-4",
    fast: "claude-haiku-4",
    balanced: "claude-sonnet-4",
  },

  gemini: {
    default: "gemini-3.5-flash-lite",
    strong: "gemini-3.5-flash-lite",
    fast: "gemini-3.5-flash-lite",
    balanced: "gemini-3.5-flash-lite",
  },

  ollama: {
    default: "llama3.1",
    strong: "llama3.1",
    fast: "llama3.1",
    balanced: "llama3.1",
  },

  openrouter: {
    default: "openrouter/free",
    strong: "openrouter/free",
    fast: "openrouter/free",
    balanced: "openrouter/free",
  },
} as const;
