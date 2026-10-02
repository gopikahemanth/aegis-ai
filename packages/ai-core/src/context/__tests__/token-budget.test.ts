import { describe, it, expect } from "vitest";
import { TokenBudgetManager } from "../token-budget.js";

describe("TokenBudgetManager", () => {
  it("uses conservative dense-code estimation with safety margin", () => {
    const codeSnippet = `
      export interface User {
        id: string;
        name: string;
        email: string;
        role: "admin" | "customer";
      }
      export function calculateTotal(items: Array<{ price: number }>): number {
        return items.reduce((sum, item) => sum + item.price, 0);
      }
    `;

    const codeTokens = TokenBudgetManager.estimateTokens(codeSnippet, true);
    const proseTokens = TokenBudgetManager.estimateTokens(codeSnippet, false);

    // Code estimation must be higher than prose estimation to account for dense tokens
    expect(codeTokens).toBeGreaterThan(proseTokens);
    expect(codeTokens).toBeGreaterThan(0);
  });

  it("extracts type signatures cleanly from typescript files", () => {
    const code = `
      import React, { useState } from "react";
      import { Button } from "./Button";

      export interface NavigationProps {
        activeRoute: string;
        onNavigate: (route: string) => void;
      }

      export type ThemeMode = "light" | "dark" | "system";

      export function NavigationBar(props: NavigationProps) {
        const [isOpen, setIsOpen] = useState(false);
        return (
          <nav className="p-4 flex gap-4 bg-slate-900 text-white">
            <Button onClick={() => props.onNavigate("/home")}>Home</Button>
          </nav>
        );
      }

      export const useAuthStore = {
        user: null,
        login: () => {},
      };

      export default function MainAppShell() {
        return <div>App</div>;
      }
    `;

    const signatures = TokenBudgetManager.extractTypeSignatures(code);
    expect(signatures).not.toBeNull();
    expect(signatures).toContain("export interface NavigationProps");
    expect(signatures).toContain("export type ThemeMode");
    expect(signatures).toContain("export function NavigationBar(props: NavigationProps);");
    expect(signatures).toContain("export default function MainAppShell();");
    // Body and imports must be omitted
    expect(signatures).not.toContain('import React, { useState } from "react"');
    expect(signatures).not.toContain("const [isOpen, setIsOpen] = useState(false)");
  });

  it("fails closed on malformed or unextractable large code (returns null to demote to Tier 3)", () => {
    // A 400-char file with binary/minified/opaque content that produces zero type signatures
    const minifiedBlob = "var a=1;for(var i=0;i<100;i++){a+=i;}".repeat(12);
    expect(minifiedBlob.length).toBeGreaterThan(300);

    const signatures = TokenBudgetManager.extractTypeSignatures(minifiedBlob);
    // Must return null rather than emitting an empty or garbled snippet
    expect(signatures).toBeNull();
  });

  it("partitions files into 3 graceful tiers according to available tokens", () => {
    const fileA = {
      path: "src/types/user.ts",
      content: `
        export interface User { id: string; name: string; }
        export type Role = "admin" | "user";
      `,
    };

    const fileB = {
      path: "src/components/LargeComponent.tsx",
      content: `
        export interface LargeProps { title: string; count: number; }
        export function LargeComponent(props: LargeProps) {
          // Large implementation body
          ${"const x = 1;\n".repeat(80)}
          return <div>{props.title}</div>;
        }
      `,
    };

    const fileC = {
      path: "src/utils/unextractable.ts",
      content: "const internalSecret = 42;".repeat(50),
    };

    // Give enough budget for fileA full + fileB signatures, but not fileB full
    const maxTokens = 200;
    const degraded = TokenBudgetManager.degradeFilesToBudget([fileA, fileB, fileC], maxTokens);

    expect(degraded.tier1FullFiles.some(f => f.path === fileA.path)).toBe(true);
    expect(degraded.tier2SignatureFiles.some(f => f.path === fileB.path)).toBe(true);
    // fileC cannot fit signatures or has no exports, so it must be Tier 3
    expect(degraded.tier3WithheldPaths).toContain(fileC.path);

    const formatted = TokenBudgetManager.formatFileContext(degraded);
    expect(formatted).toContain("=== FILE: src/types/user.ts ===");
    expect(formatted).toContain("TIER 2: MODULE EXPORT SIGNATURES");
    expect(formatted).toContain("=== FILE SIGNATURES: src/components/LargeComponent.tsx ===");
    expect(formatted).toContain("TIER 3: ADDITIONAL EXISTING FILES");
    expect(formatted).toContain("- src/utils/unextractable.ts");
  });

  it("defaults Groq TPM profile to safe 6,000 limit", () => {
    delete process.env.GROQ_TPM_LIMIT;
    const profile = TokenBudgetManager.getProfile("groq");
    expect(profile.name).toBe("groq");
    expect(profile.tpmLimit).toBe(6000);
    expect(profile.maxPromptTokens).toBe(4500);
    expect(profile.maxCompletionTokens).toBe(3500);
  });

  it("allows overriding Groq TPM limit via environment variable", () => {
    process.env.GROQ_TPM_LIMIT = "30000";
    const profile = TokenBudgetManager.getProfile("groq");
    expect(profile.tpmLimit).toBe(30000);
    delete process.env.GROQ_TPM_LIMIT;
  });
});
