/**
 * Module Usage & Dead Code Audit Script
 * Measures reachable modules from src/index.ts and core execution pathways,
 * identifying candidate dead files, speculative folders, and loose scripts.
 */

import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { resolve, join, relative, dirname } from "node:path";

const CORE_SRC = resolve("packages/ai-core/src");
const REPO_ROOT = resolve(".");

function getAllTsFiles(dir) {
  let results = [];
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== "node_modules" && entry.name !== "__tests__" && entry.name !== "dist") {
        results = results.concat(getAllTsFiles(fullPath));
      }
    } else if (entry.isFile() && entry.name.endsWith(".ts") && !entry.name.endsWith(".d.ts")) {
      results.push(fullPath);
    }
  }
  return results;
}

function countLines(filePath) {
  try {
    const content = readFileSync(filePath, "utf8");
    return content.split("\n").length;
  } catch {
    return 0;
  }
}

// 1. Gather all source files
const allFiles = getAllTsFiles(CORE_SRC);
const fileSet = new Set(allFiles.map((p) => p.replace(/\\/g, "/")));

// 2. Parse import and export references
function extractImportsAndExports(filePath) {
  try {
    const content = readFileSync(filePath, "utf8");
    const targets = [];
    const importRegex = /(?:import|export)\s+(?:(?:(?:\*|{[^}]+}|\w+)\s+from\s+)|)['"](\.[^'"]+)['"]/g;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      targets.push(match[1]);
    }
    return targets;
  } catch {
    return [];
  }
}

function resolveImport(sourceFile, importRel) {
  const sourceDir = dirname(sourceFile);
  let target = resolve(sourceDir, importRel);
  // normalize extension: import .js might map to .ts
  if (target.endsWith(".js")) {
    target = target.slice(0, -3) + ".ts";
  }
  if (existsSync(target) && statSync(target).isFile()) {
    return target;
  }
  if (existsSync(target + ".ts")) {
    return target + ".ts";
  }
  const targetIndex = join(target, "index.ts");
  if (existsSync(targetIndex)) {
    return targetIndex;
  }
  return null;
}

// 3. Build Reachability Graph starting from src/index.ts
const entryPoint = join(CORE_SRC, "index.ts").replace(/\\/g, "/");
const visited = new Set();
const queue = [entryPoint];

while (queue.length > 0) {
  const current = queue.shift();
  if (visited.has(current)) continue;
  visited.add(current);

  const rawImports = extractImportsAndExports(current);
  for (const raw of rawImports) {
    const resolved = resolveImport(current, raw);
    if (resolved) {
      const normalized = resolved.replace(/\\/g, "/");
      if (fileSet.has(normalized) && !visited.has(normalized)) {
        queue.push(normalized);
      }
    }
  }
}

// 4. Identify Unreachable Files
const unreachable = [];
let unreachableLines = 0;
for (const file of fileSet) {
  if (!visited.has(file)) {
    const lines = countLines(file);
    unreachable.push({ file: relative(CORE_SRC, file), lines });
    unreachableLines += lines;
  }
}

// 5. Speculative folders analysis
const speculativeFolders = [
  "product-evolution",
  "security-intelligence",
  "production-operations",
  "production-deployment",
  "knowledge-synthesis",
  "institutional-knowledge",
  "performance-optimization",
];

const speculativeStats = {};
for (const folder of speculativeFolders) {
  const folderPath = join(CORE_SRC, folder);
  if (existsSync(folderPath)) {
    const files = getAllTsFiles(folderPath);
    const lines = files.reduce((acc, f) => acc + countLines(f), 0);
    speculativeStats[folder] = { fileCount: files.length, lines };
  }
}

// 6. Check loose scripts in root and packages/ai-core
const looseScripts = [
  "output.txt",
  "output_run.txt",
  "terminal_output.txt",
  "sweep_progress.json",
  "eval_dod.mjs",
  "packages/ai-core/check_keys.mjs",
  "packages/ai-core/find_working_gemini.mjs",
  "packages/ai-core/list_gemini.mjs",
  "packages/ai-core/list_models.mjs",
  "packages/ai-core/scratch_test_models.mjs",
  "packages/ai-core/test_actual_models.mjs",
  "packages/ai-core/test_gemini_now.mjs",
  "packages/ai-core/test_groq_cerebras.mjs",
];

const foundLoose = looseScripts.filter((p) => existsSync(resolve(REPO_ROOT, p)));

console.log(JSON.stringify({
  totalSourceFiles: allFiles.length,
  totalSourceLines: allFiles.reduce((acc, f) => acc + countLines(f), 0),
  reachableFilesFromIndex: visited.size,
  unreachableFilesCount: unreachable.length,
  unreachableTotalLines: unreachableLines,
  speculativeStats,
  foundLooseScripts: foundLoose,
  sampleUnreachable: unreachable.slice(0, 15),
}, null, 2));
