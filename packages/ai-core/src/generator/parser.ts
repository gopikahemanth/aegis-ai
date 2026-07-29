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

    const regex =
      /===FILE:\s*(.*?)===([\s\S]*?)(?=(===FILE:|$))/g;

    let match: RegExpExecArray | null;

    while ((match = regex.exec(response)) !== null) {
      const path = match[1].trim();

      if (this.blockedFiles.has(path)) {
        console.log(
          `Skipping protected file: ${path}`,
        );
        continue;
      }

      files.push({
        path,
        content: match[2].trim(),
      });
    }

    return files;
  }
}
