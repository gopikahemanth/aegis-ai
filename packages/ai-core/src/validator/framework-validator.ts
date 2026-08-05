import type { GeneratedFile } from "../writer/writer.js";
import { isLikelySyntacticallyComplete } from "../utils/syntax-validator.js";

export class FrameworkValidator {
private readonly blocked = {
  "react-vite": new Set([
    // Project configuration
    "package-lock.json",
    "pnpm-lock.yaml",
    "yarn.lock",

    "vite.config.ts",
    "vite.config.js",

    "tsconfig.json",
    "tsconfig.node.json",

    "postcss.config.js",
    "postcss.config.cjs",

    "tailwind.config.js",
    "tailwind.config.cjs",

    "webpack.config.js",
    "next.config.js",

    // Template files
    "index.html",

    "src/main.tsx",
    "src/vite-env.d.ts",

    // Legacy files
    "src/index.tsx",
    "index.js",
    "App.js",
    "script.js",
    "style.css",
  ]),
};
  validate(
    framework: string,
    files: GeneratedFile[],
  ) {
    const blocked =
      this.blocked[framework as keyof typeof this.blocked];

    console.log("Framework:", framework);
    console.log("Files from AI:");
    for (const file of files) {
      console.log("-", file.path);
    }

    return files.filter((file) => {
      if (blocked && blocked.has(file.path)) {
        console.log(`Rejected ${file.path} (blocked template file)`);
        return false;
      }

      if (file.path.endsWith(".ts") || file.path.endsWith(".tsx")) {
        const complete = isLikelySyntacticallyComplete(file.content);
        if (!complete) {
          console.warn(`[FrameworkValidator] ⚠️ Rejected truncated/incomplete TypeScript file: ${file.path}`);
          return false;
        }
      }

      return true;
    });
  }
}
