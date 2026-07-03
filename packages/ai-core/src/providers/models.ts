export const Models = {
  groq: {
    default: "llama-3.3-70b-versatile",
  },

  openai: {
    default: "gpt-5.5",
  },

  anthropic: {
    default: "claude-sonnet-4",
  },

  gemini: {
    default: "gemini-2.5-pro",
  },

  ollama: {
    default: "llama3.1",
  },
} as const;
