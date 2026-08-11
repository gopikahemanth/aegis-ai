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

      // Rule 2: Protect canonical prisma/schema.prisma from LLM overwrite
      if (cleanRelativePath === "prisma/schema.prisma" || cleanRelativePath.endsWith("schema.prisma")) {
        const fullSchemaPath = join(outputDir, "prisma/schema.prisma");
        if (existsSync(fullSchemaPath)) {
          console.log(`[PRISMA-SCHEMA-WRITE] 🔒 Blocked unauthorized LLM overwrite of canonical prisma/schema.prisma.`);
          continue;
        }
      }

      // Rule 6: Protect backend files (server/ and prisma/) from .ts -> .tsx mutation
      const isBackendFile = cleanRelativePath.startsWith("server/") || cleanRelativePath.startsWith("prisma/");

      // If a frontend .ts file contains JSX tags, convert extension to .tsx (frontend ONLY)
      if (!isBackendFile && cleanRelativePath.endsWith(".ts") && !cleanRelativePath.endsWith(".d.ts")) {
        const hasJsx = /<[A-Z][A-Za-z0-9]*[\s/>]/.test(file.content) ||
                       /<(div|span|button|form|input|p|h[1-6]|a|ul|li|section|header|footer|main|nav)[\s/>]/.test(file.content) ||
                       /<\/([A-Za-z0-9]+)>/.test(file.content);
        if (hasJsx) {
          cleanRelativePath = cleanRelativePath.replace(/\.ts$/, ".tsx");
        }
      }

      const fullPath = join(outputDir, cleanRelativePath);

      // Clean up conflicting alternate extension files
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
