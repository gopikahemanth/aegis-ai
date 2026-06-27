import type { AIProvider } from "../providers/base.js";

export class Generator {
  constructor(private readonly provider: AIProvider) {}

  async generate(prompt: string) {
    return this.provider.chat([
      {
        role: "user",
        content: prompt,
      },
    ]);
  }
}
