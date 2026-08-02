import type { AIProvider } from "../providers/base.js";

export class Fixer {
  constructor(private readonly provider: AIProvider) {}

  async fix(
    request: string,
    buildError: string,
    projectContext: string,
    repairHints?: string,
    escalationLevel: "fast" | "balanced" | "strong" = "balanced",
  ) {
    // Map escalation level to complexity score for FailoverProvider routing
    const complexityMap = { fast: 2, balanced: 5, strong: 9 };
    const complexity = complexityMap[escalationLevel];

    return this.provider.chat(
      [
        {
          role: "system",
          content: `You are Aegis AI, an autonomous senior software engineer specialized in surgical TypeScript/React repair.

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

STRICTLY FORBIDDEN — these will make the project worse:
✗ Replacing a file with a stub (e.g. <div>Quiz Page</div>) — this destroys real functionality.
✗ Returning fewer lines than the original file had — always expand, never shrink.
✗ Adding new features or refactoring code unrelated to the error.
✗ Renaming files, imports, or exports that are not causing errors.
✗ Adding new files unless the error explicitly requires a missing module.
✗ Wrapping existing JSX in extra divs or containers.

═══════════════════════════════════════════════════════
ROOT CAUSE RULES — READ BEFORE EDITING
═══════════════════════════════════════════════════════
TypeScript errors appear at the CALL SITE but often the fix belongs in the DECLARATION.

RULE 1 — IntrinsicAttributes Error:
  If the error says: "Property 'onX' does not exist on type 'IntrinsicAttributes'"
  → The component (e.g. RegisterPage.tsx) is missing a props interface.
  → DO NOT modify App.tsx or the caller.
  → ADD the props interface to the component file:
      interface ComponentNameProps { onX: (...) => void; ... }
      export const ComponentName: React.FC<ComponentNameProps> = ({ onX }) => { ... }

RULE 2 — Signature Mismatch (Promise vs non-Promise):
  If the error says: "Type 'X' is missing 'then', 'catch', 'finally'"
  → The callback needs to be wrapped in async:
      onChange={async (...) => { return service.method(...); }}

RULE 3 — Implicit Any (TS7006):
  If "Parameter 'x' implicitly has an 'any' type"
  → Add the type annotation inline: (item: SpecificType) => ...
  → Import the type from entities/ if needed.

RULE 4 — Signature Mismatch on prop:
  If "Type '(a, b) => void' is not assignable to type '(x, y, z) => void'"
  → Align the prop signature in the CALLER to match what the COMPONENT declares.
  → Change only the specific prop assignment line.

═══════════════════════════════════════════════════════
OUTPUT FORMAT
═══════════════════════════════════════════════════════
Return ONLY changed files using exactly this format — no other text:

===FILE: relative/path/to/file.tsx===
<complete corrected file contents>

Include the FULL file content (not just the changed lines) so the patch engine can apply it.
`,
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
}
