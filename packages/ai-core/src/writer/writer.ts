import { mkdirSync, writeFileSync, existsSync, unlinkSync } from "node:fs";
import { dirname, join } from "node:path";

export interface GeneratedFile {
  path: string;
  content: string;
}

export class FileWriter {
  write(files: GeneratedFile[], outputDir: string) {
    for (const file of files) {
      // Strip redundant outputDir prefixes or leading slashes from file.path
      let cleanRelativePath = file.path
        .replace(/\\/g, "/")
        .replace(/^(\.\/|\/)+/, "")
        .replace(/^(generated\/project\/|apps\/cli\/generated\/project\/)+/i, "");

      // If a .ts file contains JSX tags, auto-convert extension to .tsx before writing
      if (cleanRelativePath.endsWith(".ts") && !cleanRelativePath.endsWith(".d.ts")) {
        const hasJsx = /<[A-Z][A-Za-z0-9]*[\s/>]/.test(file.content) ||
                       /<(div|span|button|form|input|p|h[1-6]|a|ul|li|section|header|footer|main|nav)[\s/>]/.test(file.content) ||
                       /<\/([A-Za-z0-9]+)>/.test(file.content);
        if (hasJsx) {
          cleanRelativePath = cleanRelativePath.replace(/\.ts$/, ".tsx");
        }
      } else if (cleanRelativePath.endsWith(".ts") && !cleanRelativePath.endsWith(".d.ts")) {
        const altTsxPath = join(outputDir, cleanRelativePath.replace(/\.ts$/, ".tsx"));
        if (existsSync(altTsxPath)) {
          cleanRelativePath = cleanRelativePath.replace(/\.ts$/, ".tsx");
        }
      }

      const fullPath = join(outputDir, cleanRelativePath);

      // Clean up conflicting alternate extension files (e.g. index.ts when writing index.tsx)
      if (fullPath.endsWith(".tsx")) {
        const altPath = fullPath.replace(/\.tsx$/, ".ts");
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
