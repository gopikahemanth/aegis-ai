import type { GeneratedFile } from "../writer/writer.js";

export class Parser {
  private readonly blockedFiles = new Set([
    "package-lock.json",
    "pnpm-lock.yaml",
    "yarn.lock",
    "tsconfig.json",
    "tsconfig.node.json",
    "jsconfig.json",
    "vite.config.ts",
    "vite.config.js",
    "webpack.config.js",
    "next.config.js",
    "tailwind.config.js",
    "postcss.config.js",
    ".gitignore",
  ]);

  parse(response: string): GeneratedFile[] {
    const files: GeneratedFile[] = [];

    // Format 1: === FILE: relative/path === or ===FILE: relative/path
    const headerRegex = /={3,}\s*(?:FILE:)?\s*([^\n\r=]+?)\s*={0,3}\r?\n([\s\S]*?)(?=(?:={3,}\s*(?:FILE:)?\s*[^\n\r=]+?)|$)/gi;
    let match: RegExpExecArray | null;

    while ((match = headerRegex.exec(response)) !== null) {
      let rawPath = match[1].trim().replace(/^`+|`+$/g, "").replace(/^FILE:\s*/i, "").trim();
      let content = match[2].trim();

      if (!rawPath || rawPath.length > 250 || rawPath.includes("\n")) continue;

      // Clean markdown code blocks from content
      content = content.replace(/^```[a-zA-Z0-9_-]*\r?\n?/, "").replace(/\r?\n?```$/, "").trim();

      if (rawPath.endsWith("lock.yaml") || rawPath.endsWith("lock.json") || rawPath === "yarn.lock") {
        console.log(`Skipping protected lockfile: ${rawPath}`);
        continue;
      }

      // Check if sub-files are concatenated inside
      if (/={3,}\s*(?:FILE:)?/i.test(content) && content.includes("package.json")) {
        const nestedFiles = this.parse(content);
        if (nestedFiles.length > 0) {
          files.push(...nestedFiles);
          continue;
        }
      }

      files.push({
        path: rawPath,
        content,
      });
    }

    // Format 2 Fallback: ```language file="path" or ```language filename="path"
    if (files.length === 0) {
      const codeBlockRegex = /```[a-zA-Z0-9_-]*\s+(?:file|filename)=["']?([^\s"']+)["']?\r?\n([\s\S]*?)```/gi;
      while ((match = codeBlockRegex.exec(response)) !== null) {
        const rawPath = match[1].trim();
        const content = match[2].trim();
        files.push({ path: rawPath, content });
      }
    }

    return files;
  }
}
