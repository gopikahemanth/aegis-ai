/**
 * Angular (Standalone Components) Generation Adapter
 */

import {
  TechnologyGenerationAdapter,
  ProjectScaffoldOptions,
  ComponentGenerationOptions,
  AdapterGeneratedFile,
  FrameworkFamily,
} from "./technology-adapter.interface.js";
import { ResolvedTechnologyArchitectureContract } from "../stack-selection-intelligence.js";

export class AngularAdapter implements TechnologyGenerationAdapter {
  readonly id = "angular-adapter";
  readonly name = "Angular (Standalone) Adapter";
  readonly frameworkFamily: FrameworkFamily = "angular";
  readonly supportsLevel1 = true;
  readonly supportsLevel2 = true;
  readonly supportsLevel3 = true;

  canHandle(architecture: ResolvedTechnologyArchitectureContract): boolean {
    const fw = (architecture.frontend?.framework || "").toLowerCase();
    return fw.includes("angular");
  }

  async scaffoldProject(options: ProjectScaffoldOptions): Promise<AdapterGeneratedFile[]> {
    const { projectName, designSpec } = options;
    const title = designSpec.projectIdentity?.productName || projectName;
    const colors = designSpec.colorStrategy;

    return [
      {
        path: "package.json",
        purpose: "Angular standalone dependencies and scripts",
        content: JSON.stringify(
          {
            name: projectName,
            version: "0.1.0",
            private: true,
            scripts: {
              ng: "ng",
              start: "ng serve",
              build: "ng build",
              watch: "ng build --watch --configuration development",
              test: "ng test",
            },
            dependencies: {
              "@angular/animations": "^17.3.0",
              "@angular/common": "^17.3.0",
              "@angular/compiler": "^17.3.0",
              "@angular/core": "^17.3.0",
              "@angular/forms": "^17.3.0",
              "@angular/platform-browser": "^17.3.0",
              "@angular/platform-browser-dynamic": "^17.3.0",
              "@angular/router": "^17.3.0",
              rxjs: "~7.8.0",
              tslib: "^2.3.0",
              "zone.js": "~0.14.3",
            },
            devDependencies: {
              "@angular-devkit/build-angular": "^17.3.0",
              "@angular/cli": "^17.3.0",
              "@angular/compiler-cli": "^17.3.0",
              typescript: "~5.4.2",
              tailwindcss: "^3.4.10",
              postcss: "^8.4.41",
              autoprefixer: "^10.4.20",
            },
          },
          null,
          2
        ),
      },
      {
        path: "src/index.html",
        purpose: "Angular host HTML",
        content: `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <base href="/">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="styles.css">
</head>
<body class="bg-slate-900 text-slate-100 antialiased min-h-screen">
  <app-root></app-root>
</body>
</html>`,
      },
      {
        path: "src/main.ts",
        purpose: "Angular standalone bootstrap",
        content: `import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes)
  ]
}).catch(err => console.error(err));`,
      },
      {
        path: "src/styles.css",
        purpose: "Global design tokens",
        content: `@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --color-primary: ${colors?.primaryBrandColor || "#38bdf8"};
  --color-secondary: ${colors?.secondaryBrandColor || "#818cf8"};
  --color-background: ${colors?.backgroundColor || "#0f172a"};
  --color-surface: ${colors?.surfaceColor || "#1e293b"};
  --color-text: ${colors?.textPrimaryColor || "#f8fafc"};
}

html, body {
  overflow-x: hidden;
  max-width: 100vw;
  background-color: var(--color-background);
  color: var(--color-text);
}`,
      },
      {
        path: "src/app/app.component.ts",
        purpose: "Angular root component shell",
        content: `import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: \`
    <div class="min-h-screen flex flex-col">
      <main class="flex-1 w-full max-w-7xl mx-auto px-4 py-8">
        <router-outlet></router-outlet>
      </main>
    </div>
  \`
})
export class AppComponent {}`,
      },
    ];
  }

  async generateComponent(options: ComponentGenerationOptions): Promise<AdapterGeneratedFile> {
    const { componentName, role, designTokens } = options;
    const content = `import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-${componentName.toLowerCase()}',
  standalone: true,
  imports: [CommonModule],
  template: \`
    <div
      class="${role === "card" ? "rounded-xl border p-6 backdrop-blur-md min-w-0 overflow-hidden" : "w-full"}"
      [style.background-color]="'${designTokens.palette.surface}'"
      [style.border-color]="'${designTokens.palette.border}'"
      [style.color]="'${designTokens.palette.text}'"
    >
      <h3 class="text-xl font-bold tracking-tight break-words truncate">{{ title }}</h3>
      <div class="mt-4 text-sm text-slate-300">
        <ng-content>Angular Standalone component generated by Aegis (${this.name})</ng-content>
      </div>
    </div>
  \`
})
export class ${componentName}Component {
  @Input() title: string = '${componentName}';
}
`;

    return {
      path: `src/app/components/${componentName.toLowerCase()}.component.ts`,
      purpose: `Angular standalone component for ${role}`,
      content,
    };
  }

  async generateRouting(pages: Array<{ path: string; componentName: string; title: string }>): Promise<AdapterGeneratedFile> {
    const imports = pages
      .map((p) => `import { ${p.componentName}Component } from './pages/${p.componentName.toLowerCase()}.component';`)
      .join("\n");
    const routeDefs = pages
      .map((p) => `  { path: '${p.path.replace(/^\//, "")}', component: ${p.componentName}Component, title: '${p.title}' },`)
      .join("\n");

    const content = `import { Routes } from '@angular/router';
${imports}

export const routes: Routes = [
${routeDefs}
  { path: '', redirectTo: '${pages[0]?.path.replace(/^\//, "") || ""}', pathMatch: 'full' }
];
`;

    return {
      path: "src/app/app.routes.ts",
      purpose: "Angular standalone route definitions",
      content,
    };
  }

  getToolingCommands() {
    return {
      installCommand: "npm install",
      devCommand: "ng serve",
      buildCommand: "ng build",
      testCommand: "ng test",
    };
  }
}
