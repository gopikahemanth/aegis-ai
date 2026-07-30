import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import type {
  CodebaseEntry,
} from "./codebase-index.js";

export class FileSelector {
  select(
    request: string,
    files: CodebaseEntry[],
    projectPath: string,
    taskContext: string = "",
  ) {
    const combinedQuery = `${request} ${taskContext}`.toLowerCase();
    
    // Stopwords filter list
    const stopwords = new Set([
      "a", "an", "the", "and", "or", "but", "if", "then", "else", "to", "for", 
      "in", "on", "at", "by", "with", "from", "of", "about", "as", "is", "are", 
      "was", "were", "be", "been", "have", "has", "had", "do", "does", "did",
      "build", "create", "simple", "page", "timer"
    ]);

    const keywords = combinedQuery
      .split(/[^a-zA-Z0-9]/)
      .map(k => k.trim())
      .filter(k => k.length > 1 && !stopwords.has(k));

    if (keywords.length === 0) {
      keywords.push(...combinedQuery.split(/\s+/).filter(k => k.length > 1));
    }

    const ranked = files.map((file) => {
      const fullPath = join(projectPath, file.path);
      let content = "";
      if (existsSync(fullPath)) {
        try {
          content = readFileSync(fullPath, "utf8").toLowerCase();
        } catch (e) {
          // ignore read errors
        }
      }

      return {
        file,
        score: this.scoreKeywords(keywords, file.path.toLowerCase(), content, file.type),
      };
    });

    return ranked
      .filter((item) => item.score > 0)
      .sort(
        (a, b) =>
          b.score - a.score,
      )
      .slice(0, 5)
      .map((item) => item.file);
  }

  private scoreKeywords(
    keywords: string[],
    path: string,
    content: string,
    type: string
  ): number {
    let score = 0;
    
    const parts = path.split("/");
    const filename = parts[parts.length - 1];

    for (const keyword of keywords) {
      if (filename.includes(keyword)) {
        score += 35;
      }
      
      if (path.includes(keyword)) {
        score += 15;
      }

      if (content.length > 0) {
        let count = 0;
        let pos = content.indexOf(keyword);
        while (pos !== -1) {
          count++;
          if (count >= 5) break;
          pos = content.indexOf(keyword, pos + keyword.length);
        }
        score += count * 2.5;
      }
    }

    return score;
  }
}
