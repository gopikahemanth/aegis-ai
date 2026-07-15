import { BuildHealer } from "./build-healer.js";

import type { AIProvider } from "../providers/base.js";

export class RepairCoordinator {
  private readonly healer: BuildHealer;

  constructor(
    provider: AIProvider,
  ) {
    this.healer =
      new BuildHealer(
        provider,
      );
  }

  async repair(
    request: string,
    buildError: string,
    projectSummary: string,
  ) {
    console.log();
    console.log(
      "Analyzing build failure...",
    );

    return this.healer.heal(
      request,
      buildError,
      projectSummary,
    );
  }
}
