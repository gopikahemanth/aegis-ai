export const Models = {
  groq: {
    default: "llama-3.3-70b-versatile",
    strong: "llama-3.3-70b-versatile",
    fast: "llama-3.3-70b-versatile",
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
    default: "gemini-2.5-flash",
    strong: "gemini-2.5-flash",
    fast: "gemini-2.5-flash",
    balanced: "gemini-2.5-flash",
  },

  ollama: {
    default: "llama3.1",
    strong: "llama3.1",
    fast: "llama3.1",
    balanced: "llama3.1",
  },

  openrouter: {
    default: "deepseek/deepseek-chat",
    strong: "deepseek/deepseek-chat",
    fast: "deepseek/deepseek-chat",
    balanced: "deepseek/deepseek-chat",
  },
} as const;
