import { existsSync } from "node:fs";
import { join } from "node:path";

import type { ExecutionCommands } from "./commands.js";

export class FrameworkDetector {
  detect(project: string): ExecutionCommands {
    if (existsSync(join(project, "package.json"))) {
      return {
        install: {
          command: "pnpm",
          args: ["install"],
        },
        build: {
          command: "pnpm",
          args: ["build"],
        },
      };
    }

    return {};
  }
}
