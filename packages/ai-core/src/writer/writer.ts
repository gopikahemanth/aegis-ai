import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

export interface GeneratedFile {
  path: string;
  content: string;
}

export class FileWriter {
  write(files: GeneratedFile[], outputDir: string) {
    for (const file of files) {
      const fullPath = join(outputDir, file.path);

      mkdirSync(dirname(fullPath), {
        recursive: true,
      });

      writeFileSync(fullPath, file.content, "utf8");
    }
  }
}
