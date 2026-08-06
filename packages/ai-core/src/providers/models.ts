export const Models = {
  cerebras: {
    default: "gpt-oss-120b",
    strong: "gpt-oss-120b",
    fast: "gemma-4-31b",
    balanced: "gpt-oss-120b",
  },

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
    default: "gemini-3.1-flash-lite",
    strong: "gemini-3.1-flash-lite",
    fast: "gemini-3.1-flash-lite",
    balanced: "gemini-3.1-flash-lite",
  },

  "gemini-2": {
    default: "gemini-3.1-flash-lite",
    strong: "gemini-3.1-flash-lite",
    fast: "gemini-3.1-flash-lite",
    balanced: "gemini-3.1-flash-lite",
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
