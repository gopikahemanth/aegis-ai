import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { Parser } from "../generator/parser.js";
import { FileWriter } from "../writer/writer.js";

export class PatchEngine {
  private readonly parser = new Parser();
  private readonly writer = new FileWriter();

  apply(response: string, projectPath: string): number {
    // 1. Parse standard full file blocks (===FILE: path===)
    const files = this.parser.parse(response);
    if (files.length > 0) {
      this.writer.write(files, projectPath);
    }

    // 2. Parse search-replace patch blocks (===PATCH: path===)
    const patchRegex = /===PATCH:\s*(.*?)===([\s\S]*?)(?=(===(FILE|PATCH):|$))/g;
    let patchMatch: RegExpExecArray | null;
    let patchedCount = 0;

    while ((patchMatch = patchRegex.exec(response)) !== null) {
      const filePath = patchMatch[1].trim();
      const patchContent = patchMatch[2];
      const fullPath = join(projectPath, filePath);

      if (!existsSync(fullPath)) {
        console.warn(`[PatchEngine] Warning: Cannot apply patch to non-existent file: ${filePath}`);
        continue;
      }

      const fileContent = readFileSync(fullPath, "utf8");
      const blockRegex = /<<<<<<< SEARCH\r?\n([\s\S]*?)\r?\n=======\r?\n([\s\S]*?)\r?\n>>>>>>> REPLACE/g;
      let blockMatch: RegExpExecArray | null;
      let blocksReplaced = 0;
      let tempContent = fileContent;

      while ((blockMatch = blockRegex.exec(patchContent)) !== null) {
        const searchBlock = blockMatch[1];
        const replaceBlock = blockMatch[2];

        if (tempContent.includes(searchBlock)) {
          tempContent = tempContent.replace(searchBlock, replaceBlock);
          blocksReplaced++;
        } else {
          // Fallback to trimmed matching to prevent platform line-ending issues
          const cleanSearch = searchBlock.trim();
          if (tempContent.includes(cleanSearch)) {
            tempContent = tempContent.replace(cleanSearch, replaceBlock.trim());
            blocksReplaced++;
          } else {
            console.warn(`[PatchEngine] Warning: Search block not found in ${filePath}:\n${searchBlock}`);
          }
        }
      }

      if (blocksReplaced > 0) {
        writeFileSync(fullPath, tempContent, "utf8");
        patchedCount++;
        console.log(`[PatchEngine] Successfully applied ${blocksReplaced} patches to ${filePath}`);
      }
    }

    return files.length + patchedCount;
  }
}
