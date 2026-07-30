import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, dirname, relative, resolve, extname } from "node:path";

export interface DependencyNode {
  path: string;
  imports: string[];
  importedBy: string[];
}

export class DependencyGraphEngine {
  private graph: Record<string, DependencyNode> = {};

  // Find all JS/TS/JSX/TSX source files recursively
  private getAllFiles(dir: string, fileList: string[] = []): string[] {
    if (!existsSync(dir)) return fileList;
    const files = readdirSync(dir);
    for (const file of files) {
      if (file === "node_modules" || file === "dist" || file === ".git" || file === ".aegis") {
        continue;
      }
      const fullPath = join(dir, file);
      if (statSync(fullPath).isDirectory()) {
        this.getAllFiles(fullPath, fileList);
      } else {
        const ext = extname(file);
        if ([".ts", ".tsx", ".js", ".jsx"].includes(ext)) {
          fileList.push(fullPath);
        }
      }
    }
    return fileList;
  }

  // Parse import targets from file content
  private parseImports(content: string): string[] {
    const imports: string[] = [];
    // Match standard: import ... from 'target'
    const fromRegex = /import\s+[\s\S]*?\s+from\s+['"](.*?)['"]/g;
    let match: RegExpExecArray | null;
    while ((match = fromRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }

    // Match side-effect: import 'target'
    const sideEffectRegex = /import\s+['"]((?!tailwindcss|postcss|\.|bootstrap).*?)['"]/g;
    while ((match = sideEffectRegex.exec(content)) !== null) {
      const target = match[1];
      if (target.startsWith(".") || target.startsWith("@/")) {
        imports.push(target);
      }
    }

    // Match require: require('target')
    const requireRegex = /require\s*\(\s*['"](.*?)['"]\s*\)/g;
    while ((match = requireRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }

    return [...new Set(imports)];
  }

  // Resolve import paths to relative files in output directory
  private resolveImportPath(currentFile: string, importTarget: string, projectPath: string): string | null {
    if (!importTarget.startsWith(".") && !importTarget.startsWith("@/")) {
      return null; // Ignore third-party packages
    }

    let absoluteTarget = "";
    if (importTarget.startsWith("@/")) {
      absoluteTarget = resolve(projectPath, "src", importTarget.slice(2));
    } else {
      absoluteTarget = resolve(dirname(currentFile), importTarget);
    }

    // Check common extensions to find match on disk
    const extensions = [".ts", ".tsx", ".js", ".jsx", "/index.ts", "/index.tsx", "/index.js", "/index.jsx"];
    if (existsSync(absoluteTarget) && statSync(absoluteTarget).isFile()) {
      return relative(projectPath, absoluteTarget).replace(/\\/g, "/");
    }

    for (const ext of extensions) {
      const targetWithExt = absoluteTarget + ext;
      if (existsSync(targetWithExt) && statSync(targetWithExt).isFile()) {
        return relative(projectPath, targetWithExt).replace(/\\/g, "/");
      }
    }

    return null;
  }

  build(projectPath: string): Record<string, DependencyNode> {
    const absoluteProject = resolve(projectPath);
    const sourceFiles = this.getAllFiles(absoluteProject);
    const resolvedGraph: Record<string, DependencyNode> = {};

    // 1. Initialize nodes
    for (const file of sourceFiles) {
      const relativePath = relative(absoluteProject, file).replace(/\\/g, "/");
      resolvedGraph[relativePath] = {
        path: relativePath,
        imports: [],
        importedBy: []
      };
    }

    // 2. Parse imports & populate connections
    for (const file of sourceFiles) {
      const relativePath = relative(absoluteProject, file).replace(/\\/g, "/");
      try {
        const content = readFileSync(file, "utf8");
        const rawImports = this.parseImports(content);

        for (const rawImport of rawImports) {
          const resolvedPath = this.resolveImportPath(file, rawImport, absoluteProject);
          if (resolvedPath && resolvedGraph[resolvedPath]) {
            resolvedGraph[relativePath].imports.push(resolvedPath);
            resolvedGraph[resolvedPath].importedBy.push(relativePath);
          }
        }
      } catch (err: any) {
        console.warn(`[DependencyGraph] Warning: Failed to parse file ${relativePath} (${err.message})`);
      }
    }

    // Deduplicate
    for (const key of Object.keys(resolvedGraph)) {
      resolvedGraph[key].imports = [...new Set(resolvedGraph[key].imports)];
      resolvedGraph[key].importedBy = [...new Set(resolvedGraph[key].importedBy)];
    }

    this.graph = resolvedGraph;
    return resolvedGraph;
  }

  save(projectPath: string) {
    const aegisDir = join(projectPath, ".aegis");
    const graphPath = join(aegisDir, "dependency-graph.json");

    try {
      writeFileSync(graphPath, JSON.stringify(this.graph, null, 2), "utf8");
      console.log(`[DependencyGraph] Persisted dependency graph of ${Object.keys(this.graph).length} nodes to .aegis/`);
    } catch (err: any) {
      console.warn(`[DependencyGraph] Warning: Failed to save graph config: ${err.message}`);
    }
  }

  load(projectPath: string): Record<string, DependencyNode> | null {
    const graphPath = join(projectPath, ".aegis", "dependency-graph.json");
    if (!existsSync(graphPath)) return null;

    try {
      this.graph = JSON.parse(readFileSync(graphPath, "utf8"));
      return this.graph;
    } catch {
      return null;
    }
  }
}
