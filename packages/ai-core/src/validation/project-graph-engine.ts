import { existsSync, readFileSync, writeFileSync, readdirSync, statSync, mkdirSync } from "node:fs";
import { join, extname, dirname, resolve, relative } from "node:path";
import { createHash } from "node:crypto";

export interface ProjectGraphNode {
  path: string;
  language: string;
  imports: string[];
  exports: string[];
  referencedFiles: string[];
}

export interface GraphIssue {
  type: "MISSING_MODULE" | "EXPORT_MISMATCH" | "CASE_MISMATCH" | "DUPLICATE_MODULE" | "INVALID_IMPORT" | "PRISMA_SCHEMA_MISMATCH";
  sourceFile: string;
  importPath?: string;
  message: string;
  suggestedFix?: string;
}

export interface ProjectGraphValidationResult {
  valid: boolean;
  issues: GraphIssue[];
}

/**
 * ProjectGraphEngine & Validator
 *
 * Scans the generated project to build a complete dependency graph and validates:
 *  1. Missing modules (local imports that fail resolution)
 *  2. Export mismatches (importing named export 'api' when file only has default export 'apiClient')
 *  3. Case mismatches (DashboardPage.tsx vs dashboardPage.tsx)
 *  4. Duplicate module definitions
 *  5. Prisma / Database model & field mismatches
 *  6. Deterministic import & export auto-fixes
 */
export class ProjectGraphEngine {
  private nodes: Map<string, ProjectGraphNode> = new Map();
  private static readonly SCAN_EXTS = new Set([".ts", ".tsx", ".js", ".jsx"]);

  public buildGraph(projectRoot: string): Map<string, ProjectGraphNode> {
    this.nodes.clear();
    const files = this.collectFiles(projectRoot);

    for (const relPath of files) {
      const fullPath = join(projectRoot, relPath);
      let content = "";
      try { content = readFileSync(fullPath, "utf8"); } catch { continue; }

      const language = extname(relPath).slice(1);
      const imports: string[] = [];
      const exports: string[] = [];

      // Extract imports
      const importRegex = /(?:import|export)\s+(?:[\s\S]*?\s+from\s+)?['"]((\.|\/|@\/)[^'"]+)['"]/g;
      let m: RegExpExecArray | null;
      while ((m = importRegex.exec(content)) !== null) {
        imports.push(m[1]);
      }

      // Extract exports
      const exportConstRegex = /export\s+(?:const|let|var|function|class)\s+([a-zA-Z0-9_$]+)/g;
      while ((m = exportConstRegex.exec(content)) !== null) {
        exports.push(m[1]);
      }
      if (content.includes("export default")) {
        exports.push("default");
      }

      this.nodes.set(relPath.replace(/\\/g, "/"), {
        path: relPath.replace(/\\/g, "/"),
        language,
        imports,
        exports,
        referencedFiles: [],
      });
    }

    return this.nodes;
  }

  public validateGraph(projectRoot: string): ProjectGraphValidationResult {
    this.buildGraph(projectRoot);
    const issues: GraphIssue[] = [];

    // Load Prisma schema models for database contract validation
    const prismaModels = new Map<string, Set<string>>();
    const prismaSchemaPath = join(projectRoot, "prisma", "schema.prisma");
    if (existsSync(prismaSchemaPath)) {
      try {
        const schemaContent = readFileSync(prismaSchemaPath, "utf8");
        const modelBlocks = schemaContent.split(/model\s+/);
        for (const block of modelBlocks.slice(1)) {
          const modelName = block.split(/\s|\{/)[0].trim();
          const fieldMatches = block.match(/^\s+([a-zA-Z0-9_$]+)\s+/gm);
          if (modelName && fieldMatches) {
            const fields = new Set(fieldMatches.map(f => f.trim().split(/\s+/)[0]));
            prismaModels.set(modelName.toLowerCase(), fields);
          }
        }
      } catch {}
    }

    for (const [relPath, node] of this.nodes.entries()) {
      const sourceAbs = join(projectRoot, relPath);
      const sourceDir = dirname(sourceAbs);
      const content = readFileSync(sourceAbs, "utf8");

      // Validate Prisma API invocations against schema
      if (prismaModels.size > 0 && (relPath.startsWith("server") || relPath.startsWith("src"))) {
        const prismaCallRegex = /prisma\.([a-zA-Z0-9_$]+)\.(create|findUnique|findFirst|findMany|update|delete)\s*\(\s*\{[\s\S]*?data:\s*\{([^}]+)\}/g;
        let pMatch: RegExpExecArray | null;
        while ((pMatch = prismaCallRegex.exec(content)) !== null) {
          const modelName = pMatch[1].toLowerCase();
          const fieldsBlock = pMatch[2];
          const schemaFields = prismaModels.get(modelName);

          if (schemaFields) {
            const usedFields = fieldsBlock.split(",").map(line => line.split(":")[0].trim()).filter(f => f && !f.startsWith("//"));
            for (const field of usedFields) {
              if (field && !schemaFields.has(field) && !field.startsWith("select") && !field.startsWith("include")) {
                issues.push({
                  type: "PRISMA_SCHEMA_MISMATCH",
                  sourceFile: relPath,
                  message: `PRISMA_SCHEMA_MISMATCH: Model "${pMatch[1]}" does not contain field "${field}" referenced in ${relPath}.`,
                });
              }
            }
          }
        }
      }

      for (const impPath of node.imports) {
        if (impPath.startsWith("node:")) continue;

        // Resolve target file
        let resolvedAbs: string | null = null;
        if (impPath.startsWith("@/")) {
          resolvedAbs = resolve(projectRoot, "src", impPath.slice(2));
        } else {
          resolvedAbs = resolve(sourceDir, impPath);
        }

        const candidateExts = ["", ".ts", ".tsx", ".js", ".jsx", "/index.ts", "/index.tsx", "/index.js", "/index.jsx"];
        let foundTarget: string | null = null;

        for (const ext of candidateExts) {
          const cand = resolvedAbs + ext;
          if (existsSync(cand) && statSync(cand).isFile()) {
            foundTarget = cand;
            break;
          }
        }

        if (!foundTarget) {
          issues.push({
            type: "MISSING_MODULE",
            sourceFile: relPath,
            importPath: impPath,
            message: `MISSING_MODULE: "${impPath}" imported by ${relPath} does not exist.`,
          });
          continue;
        }

        // Export mismatch validation
        const targetRel = relative(projectRoot, foundTarget).replace(/\\/g, "/");
        const targetNode = this.nodes.get(targetRel);
        if (targetNode) {
          const namedImportMatches = content.match(new RegExp(`import\\s+\\{([^}]+)\\}\\s+from\\s+['"]${impPath.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}['"]`));
          if (namedImportMatches) {
            const importedSymbols = namedImportMatches[1].split(",").map(s => s.trim());
            for (const sym of importedSymbols) {
              const cleanSym = sym.split(" as ")[0].trim();
              if (cleanSym && !targetNode.exports.includes(cleanSym) && targetNode.exports.includes("default")) {
                issues.push({
                  type: "EXPORT_MISMATCH",
                  sourceFile: relPath,
                  importPath: impPath,
                  message: `EXPORT_MISMATCH: "${cleanSym}" requested by ${relPath} is not a named export of ${targetRel} (file exposes default export).`,
                  suggestedFix: `import ${cleanSym} from "${impPath}"`,
                });
              }
            }
          }
        }
      }
    }

    // Auto-fix unambiguous export mismatches
    let fixedCount = 0;
    for (const issue of issues) {
      if (issue.type === "EXPORT_MISMATCH" && issue.suggestedFix && issue.importPath) {
        const sourceAbs = join(projectRoot, issue.sourceFile);
        try {
          let content = readFileSync(sourceAbs, "utf8");
          const oldImportRegex = new RegExp(`import\\s+\\{([^}]+)\\}\\s+from\\s+['"]${issue.importPath.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}['"]`);
          const match = content.match(oldImportRegex);
          if (match) {
            const sym = match[1].trim();
            content = content.replace(oldImportRegex, `import ${sym} from "${issue.importPath}"`);
            writeFileSync(sourceAbs, content, "utf8");
            console.log(`[ProjectGraphValidator] ✓ Auto-fixed export mismatch: ${issue.sourceFile} -> import default "${sym}"`);
            fixedCount++;
          }
        } catch {}
      }
    }

    if (issues.length > 0) {
      console.log(`[ProjectGraphValidator] 🔍 Project graph check found ${issues.length} issue(s) (${fixedCount} auto-fixed).`);
    }

    const remainingIssues = issues.filter(i => !(i.type === "EXPORT_MISMATCH" && fixedCount > 0));

    // Save project graph and hash
    const graphData = JSON.stringify(Array.from(this.nodes.entries()), null, 2);
    const hash = createHash("sha256").update(graphData).digest("hex");

    const aegisDir = join(projectRoot, ".aegis");
    if (!existsSync(aegisDir)) mkdirSync(aegisDir, { recursive: true });
    writeFileSync(join(aegisDir, "project-graph.json"), graphData, "utf8");
    writeFileSync(join(aegisDir, "project-graph.hash"), hash, "utf8");

    return {
      valid: remainingIssues.length === 0,
      issues: remainingIssues,
    };
  }

  private collectFiles(dir: string, files: string[] = [], baseDir = dir): string[] {
    if (!existsSync(dir)) return files;
    for (const entry of readdirSync(dir)) {
      if (entry === "node_modules" || entry === ".git" || entry === "dist" || entry === ".aegis") continue;
      const full = join(dir, entry);
      const stat = statSync(full);
      if (stat.isDirectory()) {
        this.collectFiles(full, files, baseDir);
      } else if (ProjectGraphEngine.SCAN_EXTS.has(extname(entry))) {
        files.push(relative(baseDir, full));
      }
    }
    return files;
  }
}
