import type { GeneratedFile } from "../writer/writer.js";

export function mergeReviewedFiles(
  original: GeneratedFile[],
  reviewed: GeneratedFile[],
): GeneratedFile[] {
  const files = new Map(
    original.map((file) => [file.path, file]),
  );

  for (const file of reviewed) {
    files.set(file.path, file);
  }

  return [...files.values()];
}
