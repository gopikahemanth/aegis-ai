import type { AIProvider } from "../providers/base.js";

export class Fixer {
  constructor(private readonly provider: AIProvider) {}

  async fix(
    request: string,
    buildError: string,
    projectContext: string,
    repairHints?: string,
    escalationLevel: "fast" | "balanced" | "strong" = "balanced",
    primaryErrorClass?: string,
  ) {
    // Map escalation level to complexity score for FailoverProvider routing
    const complexityMap = { fast: 2, balanced: 5, strong: 9 };
    const complexity = complexityMap[escalationLevel];

    const systemPrompt = this.buildSystemPrompt(primaryErrorClass);

    return this.provider.chat(
      [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: `Original Request:

${request}

Build Errors:

${buildError}
${repairHints ? `\nRoot Cause Analysis (PRIORITIZE THESE HINTS):\n${repairHints}\n` : ""}
Existing Project Files:

${projectContext}
`,
        },
      ],
      { agentType: "healer", complexity },
    );
  }

  private buildSystemPrompt(errorClass?: string): string {
    const baseHeader = `You are Aegis AI, an autonomous senior software engineer specialized in surgical TypeScript/React repair.
Your ONLY job is to make the project build successfully by changing the minimum code possible.

═══════════════════════════════════════════════════════
SURGICAL REPAIR RULES — ALL MANDATORY
═══════════════════════════════════════════════════════
✓ Fix ONLY the exact lines reported in the build errors.
✓ Change a MAXIMUM of 30 lines per file across all files.
✓ Preserve every other line of the original file exactly.
✓ Preserve the existing architecture, folder structure, and coding style.
✓ Never explain, never use markdown, never use triple backticks.
✓ Never return a file that was not changed.

STRICTLY FORBIDDEN:
✗ Replacing a file with a stub (e.g. <div>Quiz Page</div>) — this destroys real functionality.
✗ Returning fewer lines than the original file had — always expand, never shrink.
✗ Adding new features or refactoring code unrelated to the error.
✗ Renaming files, imports, or exports that are not causing errors.
✗ Adding new files unless the error explicitly requires a missing module.
✗ Wrapping existing JSX in extra divs or containers.
`;

    const baseFooter = `
═══════════════════════════════════════════════════════
OUTPUT FORMAT
═══════════════════════════════════════════════════════
Return ONLY changed files using exactly this format — no other text:

===FILE: relative/path/to/file.tsx===
<complete corrected file contents>

Include the FULL file content (not just the changed lines) so the patch engine can apply it.
`;

    if (errorClass === "missing-props-interface") {
      return `${baseHeader}
═══════════════════════════════════════════════════════
SPECIALIZED STRATEGY: COMPONENT PROPS DECLARATION FIX
═══════════════════════════════════════════════════════
The error indicates a component is missing a props interface or has mismatched props declarations (e.g. Property 'X' does not exist on type 'IntrinsicAttributes').

1. Locate the component definition file (usually under src/features/<feature>/components/<name>.tsx or src/design-system/components/<name>.tsx).
2. Declare or update the props interface at the top of that component file:
   interface ComponentNameProps {
     propName: type;
     ...
   }
3. Update the component declaration to accept the props interface:
   export const ComponentName: React.FC<ComponentNameProps> = ({ propName, ... }) => { ... }
4. Do NOT modify the caller file (e.g. App.tsx) — fix the component definition file itself to fit the contract expected by callers.
${baseFooter}`;
    }

    if (errorClass === "missing-module") {
      return `${baseHeader}
═══════════════════════════════════════════════════════
SPECIALIZED STRATEGY: MISSING MODULE / IMPORTS RESOLVE
═══════════════════════════════════════════════════════
The error indicates a module import path could not be resolved or a package is missing.

1. Double check the import paths. React feature imports must use relative syntax (e.g. '../../entities/types' instead of absolute imports like 'src/entities/types').
2. If it is a missing npm dependency, update 'package.json' under dependencies to include the package name with a version.
3. If it is a local type or service, verify the module exports the type correctly, and align the file extensions (.ts, .tsx, .js).
${baseFooter}`;
    }

    if (errorClass === "signature-mismatch" || errorClass === "type-mismatch") {
      return `${baseHeader}
═══════════════════════════════════════════════════════
SPECIALIZED STRATEGY: FUNCTION SIGNATURE & TYPE ALIGNMENT
═══════════════════════════════════════════════════════
The error indicates mismatching parameters or types (e.g. Promise vs synchronous value, missing fields).

1. If the caller passes a callback that must return a Promise, wrap the callback in async or wrap the operation:
   onChange={async (val) => { await service.save(val); }}
2. If a type parameter lacks a field, import the correct type structure from src/entities/ or update the local interface definition to include that optional/required field.
3. Check and align parameter order and types between caller and target definition.
${baseFooter}`;
    }

    // Default generic repair prompt
    return `${baseHeader}
═══════════════════════════════════════════════════════
ROOT CAUSE RULES
═══════════════════════════════════════════════════════
Rule 1 — IntrinsicAttributes: Fix component props interface (not the caller).
Rule 2 — Promise: Wrap callback parameters in async where expected.
Rule 3 — Implicit Any: Add type annotations (e.g. param: string).
Rule 4 — Imports: Fix import paths using correct relative navigation.
${baseFooter}`;
  }
}
