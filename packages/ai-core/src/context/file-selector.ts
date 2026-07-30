import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import type {
  CodebaseEntry,
} from "./codebase-index.js";
import { DependencyGraphEngine } from "../dependency/dependency-graph.js";

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

    const selectedFiles = ranked
      .filter((item) => item.score > 0)
      .sort(
        (a, b) =>
          b.score - a.score,
      )
      .slice(0, 5)
      .map((item) => item.file);

    // Expand selection using dependency graph if available
    try {
      const graphEngine = new DependencyGraphEngine();
      const graph = graphEngine.load(projectPath);
      if (graph) {
        const expandedFiles = new Set(selectedFiles.map(f => f.path));

        for (const file of selectedFiles) {
          const node = graph[file.path];
          if (node) {
            // Include up to 2 direct imports & dependents to prevent context overflow
            const relations = [...node.imports.slice(0, 2), ...node.importedBy.slice(0, 2)];
            for (const relPath of relations) {
              expandedFiles.add(relPath);
            }
          }
        }

        // Map relative paths back to CodebaseEntry objects
        const expandedEntries = [...expandedFiles].map(path => {
          const found = files.find(f => f.path === path);
          if (found) return found;
          return {
            path,
            type: path.endsWith(".ts") || path.endsWith(".tsx") ? "code" : "asset",
            size: 0
          };
        });

        return expandedEntries.slice(0, 8); // cap total context files to 8
      }
    } catch (graphError: any) {
      // ignore graph loading errors gracefully
    }

    return selectedFiles;
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
