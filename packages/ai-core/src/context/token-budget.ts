/**
 * TokenBudgetManager
 *
 * Provides conservative, dense-code token estimation, provider-scoped budget profiles,
 * and 3-tier graceful context degradation (Full Content -> Type Signatures -> Withheld List).
 */

export interface ProviderTokenProfile {
  name: string;
  maxPromptTokens: number;
  maxCompletionTokens: number;
  maxFileTokens: number;
  tpmLimit: number;
}

export interface DegradedFileContext {
  tier1FullFiles: Array<{ path: string; content: string }>;
  tier2SignatureFiles: Array<{ path: string; signatures: string }>;
  tier3WithheldPaths: string[];
  totalFileTokens: number;
}

export class TokenBudgetManager {
  // Conservative profiles: Groq defaults to safe 6,000 TPM limit unless overridden by GROQ_TPM_LIMIT
  public static getProfile(providerName: string): ProviderTokenProfile {
    const norm = (providerName || "").toLowerCase();
    if (norm.includes("groq")) {
      const envTpm = process.env.GROQ_TPM_LIMIT ? parseInt(process.env.GROQ_TPM_LIMIT, 10) : 6000;
      const tpmLimit = Number.isFinite(envTpm) && envTpm > 0 ? envTpm : 6000;
      return {
        name: "groq",
        maxPromptTokens: 4500,
        maxCompletionTokens: 3500,
        maxFileTokens: 1800,
        tpmLimit,
      };
    }

    if (norm.includes("cerebras")) {
      return {
        name: "cerebras",
        maxPromptTokens: 8000,
        maxCompletionTokens: 4096,
        maxFileTokens: 3500,
        tpmLimit: 60000,
      };
    }

    if (norm.includes("gemini") || norm.includes("failover") || norm === "default" || !norm) {
      return {
        name: norm || "failover",
        maxPromptTokens: 32000,
        maxCompletionTokens: 16384,
        maxFileTokens: 18000,
        tpmLimit: 1000000,
      };
    }

    // Default high-capacity profile (Anthropic, OpenAI)
    return {
      name: norm,
      maxPromptTokens: 24000,
      maxCompletionTokens: 16384,
      maxFileTokens: 14000,
      tpmLimit: 500000,
    };
  }

  /**
   * Estimates tokens for code or prose.
   * Code, JSX, and Tailwind strings tokenize denser (~3.0-3.3 chars/token).
   * We apply 3.2 chars/token + 20% safety margin (effective ~2.67 chars/token).
   */
  public static estimateTokens(text: string, isCode = true): number {
    if (!text || text.length === 0) return 0;
    if (isCode) {
      // 3.2 chars/token with 20% safety margin (multiply by 1.2 / 3.2 = / 2.666)
      return Math.ceil((text.length / 3.2) * 1.2);
    }
    // General prose: ~4.0 chars/token with 10% safety margin
    return Math.ceil((text.length / 4.0) * 1.1);
  }

  /**
   * Extracts interface and type declaration signatures from TypeScript/JavaScript files.
   * Fails closed: if extraction yields implausibly small output (< 25 chars for > 300 char file),
   * returns null so the file is demoted to Tier 3 (withheld) instead of sending garbled signatures.
   */
  public static extractTypeSignatures(code: string): string | null {
    if (!code || code.trim().length === 0) return null;
    if (code.length < 150) return code.trim(); // Very small files can stay verbatim

    const lines = code.split(/\r?\n/);
    const signatureLines: string[] = [];
    let inInterfaceOrTypeBlock = false;
    let blockBraceDepth = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Skip imports in signature view to keep tokens minimal
      if (trimmed.startsWith("import ") || trimmed.startsWith("import{")) {
        continue;
      }

      // Track multi-line type / interface declarations
      if (!inInterfaceOrTypeBlock) {
        if (
          trimmed.startsWith("export type ") ||
          trimmed.startsWith("export interface ") ||
          trimmed.startsWith("type ") ||
          trimmed.startsWith("interface ")
        ) {
          inInterfaceOrTypeBlock = true;
          blockBraceDepth = (line.match(/{/g) || []).length - (line.match(/}/g) || []).length;
          signatureLines.push(line);
          if (blockBraceDepth <= 0 && trimmed.includes(";")) {
            inInterfaceOrTypeBlock = false;
          }
          continue;
        }

        // Exported function signature (without body)
        if (trimmed.startsWith("export function ") || trimmed.startsWith("export async function ")) {
          const fnHeader = trimmed.split("{")[0].trim();
          signatureLines.push(`${fnHeader};`);
          continue;
        }

        // Exported const (arrow function, store, or hook signature)
        if (trimmed.startsWith("export const ") || trimmed.startsWith("export let ")) {
          // If it's a typed const: e.g. export const useStore: UseStore<T> = ...
          const constHeader = trimmed.split("=")[0].trim();
          if (constHeader.includes(":")) {
            signatureLines.push(`${constHeader};`);
          } else {
            // General export declaration
            signatureLines.push(`${constHeader}: unknown;`);
          }
          continue;
        }

        // Export default component declaration
        if (trimmed.startsWith("export default function ") || trimmed.startsWith("export default ")) {
          const defHeader = trimmed.split("{")[0].trim();
          signatureLines.push(`${defHeader};`);
          continue;
        }
      } else {
        // We are inside an interface or type block
        signatureLines.push(line);
        blockBraceDepth += (line.match(/{/g) || []).length - (line.match(/}/g) || []).length;
        if (blockBraceDepth <= 0) {
          inInterfaceOrTypeBlock = false;
        }
      }
    }

    const result = signatureLines.join("\n").trim();

    // Fail closed: if original file was > 300 chars but signatures extracted is < 25 chars,
    // regex extraction missed the structure (e.g. non-standard syntax). Return null to demote to Tier 3.
    if (code.length > 300 && result.length < 25) {
      return null;
    }

    return result;
  }

  /**
   * Partitions ranked files into 3 graceful degradation tiers:
   * Tier 1: Full content
   * Tier 2: Signatures only (implementation hidden)
   * Tier 3: Withheld paths
   */
  public static degradeFilesToBudget(
    files: Array<{ path: string; content: string }>,
    maxAvailableTokens: number
  ): DegradedFileContext {
    const tier1FullFiles: Array<{ path: string; content: string }> = [];
    const tier2SignatureFiles: Array<{ path: string; signatures: string }> = [];
    const tier3WithheldPaths: string[] = [];

    let consumedTokens = 0;

    for (const file of files) {
      const fullTokens = this.estimateTokens(file.content, true);

      // Try Tier 1 (Full file)
      if (consumedTokens + fullTokens <= maxAvailableTokens) {
        tier1FullFiles.push(file);
        consumedTokens += fullTokens;
        continue;
      }

      // Try Tier 2 (Export signatures only)
      const signatures = this.extractTypeSignatures(file.content);
      if (signatures) {
        const sigTokens = this.estimateTokens(signatures, true);
        if (consumedTokens + sigTokens <= maxAvailableTokens) {
          tier2SignatureFiles.push({ path: file.path, signatures });
          consumedTokens += sigTokens;
          continue;
        }
      }

      // Tier 3: Demote to withheld path list
      tier3WithheldPaths.push(file.path);
    }

    return {
      tier1FullFiles,
      tier2SignatureFiles,
      tier3WithheldPaths,
      totalFileTokens: consumedTokens,
    };
  }

  /**
   * Formats the degraded file context into a clean prompt string with explicit instructions.
   */
  public static formatFileContext(degraded: DegradedFileContext): string {
    const sections: string[] = [];

    // Tier 1
    for (const f of degraded.tier1FullFiles) {
      sections.push(`=== FILE: ${f.path} ===\n${f.content}`);
    }

    // Tier 2
    if (degraded.tier2SignatureFiles.length > 0) {
      sections.push(
        `══════════════════════════════════════════════════════════════\n` +
        `TIER 2: MODULE EXPORT SIGNATURES (IMPLEMENTATIONS WITHHELD)\n` +
        `INSTRUCTION: Import from these modules where appropriate.\n` +
        `DO NOT reimplement or duplicate these modules.\n` +
        `DO NOT assume any internal behavior beyond the declared type signatures.\n` +
        `══════════════════════════════════════════════════════════════`
      );
      for (const f of degraded.tier2SignatureFiles) {
        sections.push(`=== FILE SIGNATURES: ${f.path} ===\n${f.signatures}`);
      }
    }

    // Tier 3
    if (degraded.tier3WithheldPaths.length > 0) {
      sections.push(
        `══════════════════════════════════════════════════════════════\n` +
        `TIER 3: ADDITIONAL EXISTING FILES (CONTENTS WITHHELD FOR TOKEN BUDGET)\n` +
        `These files exist in the project. Do NOT reinvent or place duplicate files at these paths:\n` +
        degraded.tier3WithheldPaths.map(p => `- ${p}`).join("\n") +
        `\n══════════════════════════════════════════════════════════════`
      );
    }

    return sections.join("\n\n");
  }
}
