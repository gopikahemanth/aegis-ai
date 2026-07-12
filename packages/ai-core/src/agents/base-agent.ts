import type { AIProvider } from "../providers/base.js";

export abstract class BaseAgent {
  constructor(
    protected readonly provider: AIProvider,
  ) {}

  abstract readonly name: string;
}
