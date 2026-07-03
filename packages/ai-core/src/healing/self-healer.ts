import type { BuildError } from "./build-error.js";
import type { HealingReport } from "./report.js";

import { Fixer } from "../agent/fixer.js";
import type { AIProvider } from "../providers/base.js";

export class SelfHealer {
  private readonly fixer: Fixer;

  constructor(provider: AIProvider) {
    this.fixer = new Fixer(provider);
  }

  async heal(error: BuildError): Promise<HealingReport> {
    console.log("Analyzing build error...");

    console.log(error.summary);

    return {
      attempts: 1,
      fixed: false,
      message: "Healing pipeline initialized.",
    };
  }
}
