/**
 * React & Vite Frontend Generation Adapter
 */

import {
  TechnologyGenerationAdapter,
  ProjectScaffoldOptions,
  ComponentGenerationOptions,
  AdapterGeneratedFile,
  FrameworkFamily,
} from "./technology-adapter.interface.js";
import { ResolvedTechnologyArchitectureContract } from "../stack-selection-intelligence.js";

export class ReactViteAdapter implements TechnologyGenerationAdapter {
  readonly id = "react-vite-adapter";
  readonly name = "React + Vite Adapter";
  readonly frameworkFamily: FrameworkFamily = "react";
  readonly supportsLevel1 = true;
  readonly supportsLevel2 = true;
  readonly supportsLevel3 = true;

  canHandle(architecture: ResolvedTechnologyArchitectureContract): boolean {
    const fw = (architecture.frontend?.framework || "").toLowerCase();
    return fw.includes("react") && !fw.includes("next");
  }

  async scaffoldProject(options: ProjectScaffoldOptions): Promise<AdapterGeneratedFile[]> {
    const { projectName, architecture, designSpec } = options;
    const isTs = (architecture.frontend?.language || "").toLowerCase().includes("typescript");
    const ext = isTs ? "tsx" : "jsx";

    const title = designSpec.projectIdentity?.productName || projectName;
    const colors = designSpec.colorStrategy;
    const typo = designSpec.typographyStrategy;

    const files: AdapterGeneratedFile[] = [
      {
        path: "package.json",
        purpose: "Project dependencies and build scripts",
        content: JSON.stringify(
          {
            name: projectName,
            version: "0.1.0",
            private: true,
            type: "module",
            scripts: {
              dev: "vite",
              build: isTs ? "tsc && vite build" : "vite build",
              preview: "vite preview",
              test: "vitest run",
            },
            dependencies: {
              react: "^18.3.1",
              "react-dom": "^18.3.1",
              "react-router-dom": "^6.26.0",
              "lucide-react": "^0.436.0",
            },
            devDependencies: {
              "@vitejs/plugin-react": "^4.3.1",
              vite: "^5.4.1",
              ...(isTs
                ? {
                    typescript: "^5.5.3",
                    "@types/react": "^18.3.3",
                    "@types/react-dom": "^18.3.0",
                  }
                : {}),
              tailwindcss: "^3.4.10",
              autoprefixer: "^10.4.20",
              postcss: "^8.4.41",
            },
          },
          null,
          2
        ),
      },
      {
        path: "index.html",
        purpose: "HTML entrypoint",
        content: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    <link rel="stylesheet" href="/src/index.css" />
  </head>
  <body class="bg-slate-900 text-slate-100 antialiased min-h-screen">
    <div id="root"></div>
    <script type="module" src="/src/main.${ext}"></script>
  </body>
</html>`,
      },
      {
        path: `src/main.${ext}`,
        purpose: "Application entry point",
        content: `import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);`,
      },
      {
        path: "src/index.css",
        purpose: "Global design tokens and utility styling",
        content: `@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --color-primary: ${colors?.primaryBrandColor || "#38bdf8"};
  --color-secondary: ${colors?.secondaryBrandColor || "#818cf8"};
  --color-background: ${colors?.backgroundColor || "#0f172a"};
  --color-surface: ${colors?.surfaceColor || "#1e293b"};
  --color-text: ${colors?.textPrimaryColor || "#f8fafc"};
  --font-heading: ${typo?.headingFont || "Inter"};
  --font-body: ${typo?.bodyFont || "Inter"};
}

html, body {
  overflow-x: hidden;
  max-width: 100vw;
  font-family: var(--font-body), sans-serif;
  background-color: var(--color-background);
  color: var(--color-text);
}`,
      },
    ];

    return files;
  }

  async generateComponent(options: ComponentGenerationOptions): Promise<AdapterGeneratedFile> {
    const { componentName, role, designTokens } = options;
    const content = `import React from 'react';

export interface ${componentName}Props {
  className?: string;
  children?: React.ReactNode;
}

export const ${componentName}: React.FC<${componentName}Props> = ({ className = '', children }) => {
  return (
    <div
      className={\`${role === "card" ? "rounded-xl border p-6 backdrop-blur-md min-w-0 overflow-hidden" : "w-full"} \${className}\`}
      style={{
        backgroundColor: '${designTokens.palette.surface}',
        borderColor: '${designTokens.palette.border}',
        color: '${designTokens.palette.text}',
      }}
    >
      <h3 className="text-xl font-bold tracking-tight break-words truncate">${componentName}</h3>
      <div className="mt-4 text-sm text-slate-300">
        {children || <p>Component generated by Aegis Autonomous Frontend Intelligence (${this.name})</p>}
      </div>
    </div>
  );
};

export default ${componentName};
`;

    return {
      path: `src/components/${componentName}.tsx`,
      purpose: `React component for ${role}`,
      content,
    };
  }

  async generateRouting(pages: Array<{ path: string; componentName: string; title: string }>): Promise<AdapterGeneratedFile> {
    const imports = pages
      .map((p) => `import ${p.componentName} from './pages/${p.componentName}';`)
      .join("\n");
    const routes = pages
      .map((p) => `        <Route path="${p.path}" element={<${p.componentName} />} />`)
      .join("\n");

    const content = `import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
${imports}

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-text">
      <Navbar />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8">
        <Routes>
${routes}
        </Routes>
      </main>
    </div>
  );
}
`;

    return {
      path: "src/App.tsx",
      purpose: "React Router configuration and root Layout",
      content,
    };
  }

  getToolingCommands() {
    return {
      installCommand: "npm install",
      devCommand: "npm run dev",
      buildCommand: "npm run build",
      testCommand: "npm run test",
    };
  }
}
