import type { GeneratedFile } from "../writer/writer.js";

export class FrameworkValidator {
private readonly blocked = {
  "react-vite": new Set([
    "package.json",
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

    if (!blocked) {
      return files;
    }
console.log("Framework:", framework);

console.log("Files from AI:");

for (const file of files) {
  console.log("-", file.path);
}
    return files.filter((file) => {
      if (blocked.has(file.path)) {
        console.log(
          `Rejected ${file.path}`,
        );

        return false;
      }

      return true;
    });
  }
}
