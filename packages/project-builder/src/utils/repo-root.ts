import { dirname, join } from "node:path";
import { existsSync } from "node:fs";

export function findRepoRoot(
  start: string,
): string {
  let current = start;

  while (true) {
    if (
      existsSync(
        join(current, "pnpm-workspace.yaml"),
      )
    ) {
      return current;
    }

    const parent = dirname(current);

    if (parent === current) {
      throw new Error(
        "Could not find repository root.",
      );
    }

    current = parent;
  }
}
