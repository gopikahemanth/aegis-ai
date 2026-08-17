import { createHash } from "node:crypto";
import type { ProjectArchitecture } from "./types.js";

export function computeContractHash(content: Record<string, any>): string {
  const normalized = JSON.stringify(content, Object.keys(content).sort());
  return createHash("sha256").update(normalized).digest("hex").slice(0, 16);
}

export function computeArchitectureHash(arch: ProjectArchitecture): string {
  const keyStr = `${arch.frontend}|${arch.backend}|${arch.database}|${arch.orm}|${arch.auth}|${arch.language}|${arch.styling}`;
  return createHash("sha256").update(keyStr).digest("hex").slice(0, 16);
}
