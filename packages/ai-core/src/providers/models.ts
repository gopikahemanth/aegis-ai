export const Models = {
  cerebras: {
    default: "llama-3.3-70b",
    strong: "llama-3.3-70b",
    fast: "llama-3.1-8b",
    balanced: "llama-3.3-70b",
  },

  groq: {
    default: "qwen/qwen3.8-27b",
    strong: "openai/gpt-oss-120b",
    fast: "qwen/qwen3.8-27b",
    balanced: "qwen/qwen3.8-27b",
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
    default: "gemini-3.6-flash",
    strong: "gemini-3.6-flash",
    fast: "gemini-3.6-flash",
    balanced: "gemini-3.6-flash",
  },

  "gemini-2": {
    default: "gemini-3.6-flash",
    strong: "gemini-3.6-flash",
    fast: "gemini-3.6-flash",
    balanced: "gemini-3.6-flash",
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

  github: {
    default: "gpt-4o-mini",
    strong: "gpt-4o",
    fast: "gpt-4o-mini",
    balanced: "gpt-4o-mini",
  },
} as const;
