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
  public static getProfile(providerOrModelName: string): ProviderTokenProfile {
    const norm = (providerOrModelName || "").toLowerCase().trim();

    // Model-specific profiles
    if (norm.includes("gemini-1.5-pro") || norm.includes("gemini-2.5-pro")) {
      return {
        name: norm,
        maxPromptTokens: 64000,
        maxCompletionTokens: 32768,
        maxFileTokens: 40000,
        tpmLimit: 1000000,
      };
    }

    if (norm.includes("claude-sonnet") || norm.includes("claude-3-5-sonnet")) {
      return {
        name: norm,
        maxPromptTokens: 48000,
        maxCompletionTokens: 8192,
        maxFileTokens: 28000,
        tpmLimit: 500000,
      };
    }

    if (norm.includes("claude-haiku") || norm.includes("claude-3-5-haiku") || norm.includes("haiku")) {
      return {
        name: norm,
        maxPromptTokens: 32000,
        maxCompletionTokens: 8192,
        maxFileTokens: 18000,
        tpmLimit: 500000,
      };
    }

    if (norm.includes("gpt-4o-mini") || norm.includes("gpt-5.5-mini")) {
      return {
        name: norm,
        maxPromptTokens: 24000,
        maxCompletionTokens: 16384,
        maxFileTokens: 14000,
        tpmLimit: 500000,
      };
    }

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

    if (norm.includes("cerebras") || norm.includes("gpt-oss-120b") || norm.includes("qwen")) {
      return {
        name: "cerebras",
        maxPromptTokens: 8000,
        maxCompletionTokens: 4096,
        maxFileTokens: 3500,
        tpmLimit: 60000,
      };
    }

    if (norm.includes("gemini") && (norm.includes("flash") || norm.includes("flash-lite"))) {
      return {
        name: norm,
        maxPromptTokens: 250000,
        maxCompletionTokens: 8192,
        maxFileTokens: 32000,
        tpmLimit: 1000000,
      };
    }

    if (norm.includes("deepseek")) {
      return {
        name: norm,
        maxPromptTokens: 64000,
        maxCompletionTokens: 16384,
        maxFileTokens: 24000,
        tpmLimit: 500000,
      };
    }

    if (norm.includes("gemini") || norm.includes("failover") || norm === "default" || !norm) {
      return {
        name: norm || "failover",
        maxPromptTokens: 250000,
        maxCompletionTokens: 32768,
        maxFileTokens: 32000,
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
   * Calculates safe per-request execution budget, strictly decoupling cumulative
   * generation limits from individual model physical capacity.
   *
   * @param modelOrProvider Actual model or provider name resolved for this request
   * @param estimatedPromptTokens Pre-dispatch estimate of prompt tokens
   * @param requestedMaxTokens Optional maxTokens requested by caller/agent
   * @param remainingCumulativeBudget Remaining tokens in overall generation budget
   */
  public static calculatePerRequestBudget(
    modelOrProvider: string,
    estimatedPromptTokens: number,
    requestedMaxTokens?: number,
    remainingCumulativeBudget?: number
  ): {
    perRequestCap: number;
    effectiveMaxTokens: number;
    modelMaxOutput: number;
    contextHeadroom: number;
  } {
    const profile = TokenBudgetManager.getProfile(modelOrProvider);
    const modelMaxOutput = profile.maxCompletionTokens;
    const modelMaxContext = profile.maxPromptTokens;

    // Remaining capacity in model context window after prompt
    const contextHeadroom = Math.max(256, modelMaxContext - estimatedPromptTokens);

    // Per-request physical model cap
    const perRequestCap = Math.min(modelMaxOutput, contextHeadroom);

    // Clamp caller's requested output to the model's per-request cap
    const desired = requestedMaxTokens !== undefined && requestedMaxTokens > 0
      ? Math.min(requestedMaxTokens, perRequestCap)
      : perRequestCap;

    // Clamp to remaining cumulative generation budget (if provided)
    const effectiveMaxTokens = remainingCumulativeBudget !== undefined
      ? Math.max(0, Math.min(desired, remainingCumulativeBudget))
      : desired;

    return {
      perRequestCap,
      effectiveMaxTokens,
      modelMaxOutput,
      contextHeadroom,
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
   * Tier 1: Full content (direct dependencies or within budget)
   * Tier 2: Signatures only (indirect dependencies or token constrained)
   * Tier 3: Withheld paths
   */
  public static degradeFilesToBudget(
    files: Array<{ path: string; content: string; isDirect?: boolean }>,
    maxAvailableTokens: number
  ): DegradedFileContext {
    const tier1FullFiles: Array<{ path: string; content: string }> = [];
    const tier2SignatureFiles: Array<{ path: string; signatures: string }> = [];
    const tier3WithheldPaths: string[] = [];

    let consumedTokens = 0;
    const seenPaths = new Set<string>();

    for (const file of files) {
      if (!file || !file.path) continue;
      // Stable file identity & deterministic deduplication
      if (seenPaths.has(file.path)) continue;
      seenPaths.add(file.path);

      // If file is explicitly marked as indirect dependency, prioritize Tier 2 (signatures only)
      if (file.isDirect === false) {
        const signatures = this.extractTypeSignatures(file.content);
        if (signatures) {
          const sigTokens = this.estimateTokens(signatures, true);
          if (consumedTokens + sigTokens <= maxAvailableTokens) {
            tier2SignatureFiles.push({ path: file.path, signatures });
            consumedTokens += sigTokens;
            continue;
          }
        }
      }

      const fullTokens = this.estimateTokens(file.content, true);

      // Try Tier 1 (Full file for direct dependencies)
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
