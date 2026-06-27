import { existsSync } from "node:fs";
import { join } from "node:path";

export class MonorepoDetector {
  detect(root: string): boolean {
    return (
      existsSync(join(root, "turbo.json")) ||
      existsSync(join(root, "pnpm-workspace.yaml")) ||
      existsSync(join(root, "lerna.json"))
    );
  }
}
