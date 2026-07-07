export class PromptSections {
  executionPlan(plan: { title: string }[]) {
    return `Execution Plan

${plan.map(step => `- ${step.title}`).join("\n")}`;
  }

  architecture(text: string) {
    return `Architecture

${text}`;
  }
projectContext(files: string[]) {
  return `Existing Project Files

${files.map(file => `- ${file}`).join("\n")}

These files already exist.

Do not recreate them.

Modify existing files whenever possible.
`;
}
  frameworkRules() {
    return `Framework Rules

This project ALREADY EXISTS.

Framework:
React 19 + Vite + TypeScript.

The following files ALREADY EXIST:

- package.json
- vite.config.ts
- tsconfig.json
- tsconfig.node.json
- index.html
- src/main.tsx

NEVER generate or replace:

- package.json
- package-lock.json
- pnpm-lock.yaml
- yarn.lock

- vite.config.ts
- vite.config.js

- tsconfig.json
- tsconfig.node.json

- tailwind.config.js
- tailwind.config.cjs

- postcss.config.js
- postcss.config.cjs

- src/index.tsx

React uses createRoot().

Never use ReactDOM.render().

Assume src/main.tsx already mounts the application.

Generate ONLY application code.
`;
  }

  userRequest(request: string) {
    return `User Request

${request}`;
  }

  outputRules() {
    return `
Rules

Return ONLY files.

Every file must begin with:

===FILE: relative/path===

Never use markdown.

Never explain anything.

Never output configuration files.

Only output application source code.
`;
  }
}
