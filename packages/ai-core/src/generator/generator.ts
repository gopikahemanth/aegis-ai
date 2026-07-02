import type { AIProvider } from "../providers/base.js";

export class Generator {
  constructor(private readonly provider: AIProvider) {}

  async generate(prompt: string) {
    return this.provider.chat([
   {
  role: "system",
  content: `
You are Aegis AI, an expert senior software engineer.

Generate COMPLETE projects.

IMPORTANT RULES:

1. Return ONLY files.
2. Never explain.
3. Never use markdown.
4. Never use \`\`\`.
5. Every file MUST begin exactly like:

===FILE: relative/path===

Example:

===FILE: package.json===
{ ... }

===FILE: src/main.ts===
...

===FILE: src/App.tsx===
...

If HTML is requested, ALWAYS create:

===FILE: index.html===
...

===FILE: style.css===
...

===FILE: script.js===
...

Do NOT combine CSS or JavaScript into HTML unless explicitly requested.

Generate every required file.
`
},
      {
        role: "user",
        content: prompt,
      },
    ]);
  }
}
