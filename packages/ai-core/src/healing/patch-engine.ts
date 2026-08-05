import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { Parser } from "../generator/parser.js";
import { FileWriter } from "../writer/writer.js";
import { isLikelySyntacticallyComplete } from "../utils/syntax-validator.js";

export class PatchEngine {
  private readonly parser = new Parser();
  private readonly writer = new FileWriter();

  apply(response: string, projectPath: string): number {
    // 1. Parse standard full file blocks (===FILE: path===)
    const rawFiles = this.parser.parse(response);
    const validFiles = rawFiles.filter(f => {
      // Correct path typos if near-match exists on disk (e.g. responsivee-gallery -> responsive-gallery)
      const absPath = join(projectPath, f.path);
      if (!existsSync(absPath)) {
        const parts = f.path.split("/");
        const dirParts = parts.slice(0, -1);
        const fileName = parts[parts.length - 1];
        
        // Correct double-letter typos in path segments
        const normalizedRelPath = f.path
          .replace(/responsivee/g, "responsive")
          .replace(/syystem/g, "system")
          .replace(/routtes/g, "routes");
          
        if (existsSync(join(projectPath, normalizedRelPath))) {
          console.warn(`[PatchEngine] 💡 Corrected typoed path: "${f.path}" -> "${normalizedRelPath}"`);
          f.path = normalizedRelPath;
        }
      }

      if (!f.path.endsWith(".ts") && !f.path.endsWith(".tsx")) return true;
      const complete = isLikelySyntacticallyComplete(f.content);
      if (!complete) {
        console.warn(`[PatchEngine] ⚠️ Refusing to write truncated file to disk: ${f.path}`);
      }
      return complete;
    });

    if (validFiles.length > 0) {
      this.writer.write(validFiles, projectPath);
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

    return validFiles.length + patchedCount;
  }
}
