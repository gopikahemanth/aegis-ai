import type { ProjectStructure } from "./structure.js";

export class TemplateLibrary {
  reactVite(name: string): ProjectStructure {
    return {
      folders: [
        "src",
        "public"
      ],
      files: [
        {
          path: "package.json",
          content: JSON.stringify({
            name,
            private: true,
            version: "0.0.1",
            type: "module",
            scripts: {
              dev: "vite",
              build: "vite build",
              preview: "vite preview"
            },
            dependencies: {
              react: "^19.1.0",
              "react-dom": "^19.1.0"
            },
            devDependencies: {
              vite: "^7.0.0",
              typescript: "^5.8.3",
              "@vitejs/plugin-react": "^5.0.0"
            },
            pnpm: {
              onlyBuiltDependencies: [
                "esbuild",
                "@prisma/client",
                "prisma"
              ]
            }
          }, null, 2)
        },
        {
          path: "src/main.tsx",
          content: `
import React from "react";
import ReactDOM from "react-dom/client";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <h1>Hello Aegis AI 🚀</h1>
);
`
        },
        {
          path: "index.html",
          content: `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>${name}</title>
</head>
<body>
<div id="root"></div>
<script type="module" src="/src/main.tsx"></script>
</body>
</html>
`
        }
      ]
    };
  }
}
