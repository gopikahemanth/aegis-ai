import {
  mkdirSync,
  readdirSync,
  statSync,
  copyFileSync,
} from "node:fs";
import { join } from "node:path";

export function copyDirectory(
  source: string,
  destination: string,
) {
  mkdirSync(destination, {
    recursive: true,
  });

  for (const entry of readdirSync(source)) {
    const sourcePath = join(source, entry);
    const destinationPath = join(destination, entry);

    const stats = statSync(sourcePath);

    if (stats.isDirectory()) {
      copyDirectory(
        sourcePath,
        destinationPath,
      );
    } else {
      copyFileSync(
        sourcePath,
        destinationPath,
      );
    }
  }
}
