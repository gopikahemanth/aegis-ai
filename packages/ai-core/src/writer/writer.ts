import { mkdirSync, writeFileSync, existsSync, unlinkSync } from "node:fs";
import { dirname, join } from "node:path";

export interface GeneratedFile {
  path: string;
  content: string;
}

export class FileWriter {
  write(files: GeneratedFile[], outputDir: string) {
    for (const file of files) {
      const fullPath = join(outputDir, file.path);

      // Clean up conflicting alternate extension files (e.g. index.ts when writing index.tsx)
      if (fullPath.endsWith(".tsx")) {
        const altPath = fullPath.replace(/\.tsx$/, ".ts");
        if (existsSync(altPath)) {
          try { unlinkSync(altPath); } catch {}
        }
      } else if (fullPath.endsWith(".ts")) {
        const altPath = fullPath.replace(/\.ts$/, ".tsx");
        if (existsSync(altPath)) {
          try { unlinkSync(altPath); } catch {}
        }
      } else if (fullPath.endsWith(".jsx")) {
        const altPath = fullPath.replace(/\.jsx$/, ".js");
        if (existsSync(altPath)) {
          try { unlinkSync(altPath); } catch {}
        }
      } else if (fullPath.endsWith(".js")) {
        const altPath = fullPath.replace(/\.js$/, ".jsx");
        if (existsSync(altPath)) {
          try { unlinkSync(altPath); } catch {}
        }
      }

      mkdirSync(dirname(fullPath), {
        recursive: true,
      });

      writeFileSync(fullPath, file.content, "utf8");
    }
  }
}
