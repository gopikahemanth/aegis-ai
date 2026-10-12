/**
 * GenerationSeed & Provenance Management
 *
 * Implements authoritative generation seed and creative mode semantics:
 * - Deterministic Reproduction: same prompt + same seed -> identical design realization.
 * - Creative Regeneration: same prompt + fresh seed -> new valid design realization.
 *
 * SYSTEM INVARIANT:
 * "The prompt remains authoritative over product requirements and feature scope.
 * The generation seed controls creative design realization without randomizing
 * required features, routes, or domain vocabulary."
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { computeDeterministicHash } from "./visual-art-direction.js";

export type GenerationMode = "creative" | "deterministic";

export interface GenerationProvenance {
  generationId: string;
  generationSeed: number;
  promptHash: string;
  designBriefHash?: string;
  productContractHash?: string;
  createdAt: string;
  mode: GenerationMode;
  experienceType?: string;
  compositionStrategy?: string;
  navigationStrategy?: string;
}

export interface ResolvedGenerationIdentity {
  seed: number;
  mode: GenerationMode;
  generationId: string;
  promptHash: string;
}

export class GenerationSeedManager {
  /**
   * Resolves authoritative generation seed and mode from CLI flags and prompt.
   *
   * Rules:
   * 1. If explicitSeed is provided -> use it (deterministic to that seed).
   * 2. If mode === "deterministic" -> compute deterministic seed from prompt string.
   * 3. If mode === "creative" (default) -> generate a fresh random 31-bit seed.
   */
  public static resolveSeed(options: {
    mode?: string;
    explicitSeed?: string | number;
    prompt: string;
  }): ResolvedGenerationIdentity {
    const rawPrompt = (options.prompt || "").trim();
    const promptHash = createHash("sha256").update(rawPrompt).digest("hex").slice(0, 16);
    const generationId = `gen_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

    const normalizedMode: GenerationMode =
      options.mode?.toLowerCase() === "deterministic" ? "deterministic" : "creative";

    // 1. Explicit seed passed via CLI (--seed 12345)
    if (options.explicitSeed !== undefined && options.explicitSeed !== null && options.explicitSeed !== "") {
      let numericSeed: number;
      if (typeof options.explicitSeed === "number") {
        numericSeed = Math.abs(options.explicitSeed);
      } else {
        const parsed = parseInt(options.explicitSeed, 10);
        numericSeed = isNaN(parsed)
          ? Math.abs(computeDeterministicHash(String(options.explicitSeed)))
          : Math.abs(parsed);
      }
      return {
        seed: numericSeed,
        mode: options.mode?.toLowerCase() === "creative" ? "creative" : "deterministic",
        generationId,
        promptHash,
      };
    }

    // 2. Deterministic mode requested (--generation-mode=deterministic)
    if (normalizedMode === "deterministic") {
      const deterministicSeed = Math.abs(computeDeterministicHash(rawPrompt));
      return {
        seed: deterministicSeed,
        mode: "deterministic",
        generationId,
        promptHash,
      };
    }

    // 3. Creative mode (default: fresh seed each run)
    const randomSeed = Math.floor(Math.random() * 2_147_483_640) + 1;
    return {
      seed: randomSeed,
      mode: "creative",
      generationId,
      promptHash,
    };
  }

  /**
   * Persists authoritative generation provenance to .aegis/generation.json
   */
  public static saveProvenance(projectRoot: string, provenance: GenerationProvenance): void {
    const aegisDir = join(projectRoot, ".aegis");
    if (!existsSync(aegisDir)) {
      try {
        mkdirSync(aegisDir, { recursive: true });
      } catch { /* ignore */ }
    }
    const filePath = join(aegisDir, "generation.json");
    try {
      writeFileSync(filePath, JSON.stringify(provenance, null, 2), "utf8");
    } catch (err: any) {
      console.warn(`[GenerationSeedManager] Warning: Could not persist generation provenance: ${err.message}`);
    }
  }

  /**
   * Loads existing generation provenance from .aegis/generation.json if present
   */
  public static loadProvenance(projectRoot: string): GenerationProvenance | null {
    const filePath = join(projectRoot, ".aegis", "generation.json");
    if (!existsSync(filePath)) return null;
    try {
      const content = readFileSync(filePath, "utf8");
      return JSON.parse(content) as GenerationProvenance;
    } catch {
      return null;
    }
  }
}
