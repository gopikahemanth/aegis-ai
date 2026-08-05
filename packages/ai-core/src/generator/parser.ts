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
    const regex = /===\s*FILE:\s*(.*?)===([\s\S]*?)(?=(===\s*FILE:|$))/gi;

    let match: RegExpExecArray | null;

    while ((match = regex.exec(response)) !== null) {
      const rawPath = match[1].trim().replace(/^`+|`+$/g, "");
      let content = match[2].trim();

      // Strip leading markdown code block syntax if present
      content = content.replace(/^```[a-zA-Z0-9_-]*\n?/, "").replace(/\n?```$/, "").trim();

      // Only skip protected lockfiles
      if (rawPath.endsWith("lock.yaml") || rawPath.endsWith("lock.json") || rawPath === "yarn.lock") {
        console.log(`Skipping protected lockfile: ${rawPath}`);
        continue;
      }

      // If content internally contains sub === FILE: markers, parse them recursively
      if (/===\s*FILE:/i.test(content)) {
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

    return files;
  }
}
