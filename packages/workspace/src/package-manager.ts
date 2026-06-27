import { existsSync } from "node:fs";
import { join } from "node:path";

export type PackageManager =
  | "pnpm"
  | "npm"
  | "yarn"
  | "bun"
  | "Unknown";

export class PackageManagerDetector {
  detect(root: string): PackageManager {
    if (existsSync(join(root, "pnpm-lock.yaml"))) return "pnpm";
    if (existsSync(join(root, "package-lock.json"))) return "npm";
    if (existsSync(join(root, "yarn.lock"))) return "yarn";
    if (existsSync(join(root, "bun.lockb"))) return "bun";

    return "Unknown";
  }
}
