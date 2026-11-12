const fs = require('fs');
const path = require('path');

const file = path.resolve(__dirname, '../packages/ai-core/src/healing/ts-symbol-repair-engine.ts');
let content = fs.readFileSync(file, 'utf8');

// 1. Add TS2440 parsing
const parseTarget = `      // TS2345: Argument of type`;
const parseReplacement = `      // TS2440: Import declaration conflicts with local declaration of 'Button'.
      const ts2440Match = line.match(/^([^(]+)\\(([0-9]+),([0-9]+)\\):\\s+error\\s+(TS2440):\\s+Import declaration conflicts with local declaration of\\s+['"]?([a-zA-Z0-9_$]+)['"]?/);
      if (ts2440Match) {
        results.push({
          importerFile: ts2440Match[1].trim().replace(/\\\\/g, "/"),
          line: parseInt(ts2440Match[2], 10),
          col: parseInt(ts2440Match[3], 10),
          code: "TS2440",
          requestedSymbol: cleanQuotes(ts2440Match[5]),
          message: line,
        });
        continue;
      }

      // TS2345: Argument of type`;

if (!content.includes('TS2440')) {
  if (content.includes(parseTarget)) {
    content = content.replace(parseTarget, parseReplacement);
    console.log('✓ Added TS2440 parser');
  } else {
    console.error('Target for parseErrors not found!');
  }
} else {
  console.log('TS2440 parser already present');
}

// 2. Add TS2440 attemptRepair dispatch
const dispatchTarget = `    // 13. Handle TS2345`;
const dispatchReplacement = `    // 14. Handle TS2440 (Import declaration conflicts with local declaration)
    if (err.code === "TS2440" && err.requestedSymbol) {
      return this.fixImportConflictWithLocal(projectRoot, err);
    }

    // 13. Handle TS2345`;

if (!content.includes('fixImportConflictWithLocal(')) {
  if (content.includes(dispatchTarget)) {
    content = content.replace(dispatchTarget, dispatchReplacement);
    console.log('✓ Added TS2440 dispatch');
  } else {
    console.error('Target for dispatch not found!');
  }
}

// 3. Add fixImportConflictWithLocal implementation
const methodTarget = `  private static escapeRegex(s: string): string {`;
const methodReplacement = `  /**
   * Fix TS2440: Import declaration conflicts with local declaration of 'X'.
   * Removes redundant local fallback stub (e.g. const Button = (props: any) => ...)
   * or removes conflicting import symbol.
   */
  public static fixImportConflictWithLocal(
    projectRoot: string,
    err: TsErrorParsed
  ): SymbolRepairAction | null {
    const absImporter = resolve(projectRoot, err.importerFile);
    if (!existsSync(absImporter)) return null;

    const content = readFileSync(absImporter, "utf8");
    const requested = err.requestedSymbol;
    if (!requested) return null;

    const lines = content.split(/\\r?\\n/);
    const escaped = this.escapeRegex(requested);

    // 1. Look for a local component fallback stub or duplicate variable declaration
    let localDeclLineIdx = -1;
    const localDeclRegex = new RegExp(\`^\\\\s*(?:export\\\\s+)?(?:const|let|var|function|class)\\\\s+\${escaped}\\\\b\`);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.includes("import ") || line.includes("from ")) continue;
      if (localDeclRegex.test(line)) {
        localDeclLineIdx = i;
        break;
      }
    }

    if (localDeclLineIdx !== -1) {
      const targetLine = lines[localDeclLineIdx];
      // Check if it's a fallback stub or declaration
      if (targetLine.includes("=>") || targetLine.includes("return") || targetLine.includes("<") || targetLine.trim().endsWith(";")) {
        lines.splice(localDeclLineIdx, 1);
        const newContent = lines.join("\\n");
        writeFileSync(absImporter, newContent, "utf8");
        console.log(\`[TsSymbolRepairEngine] ✓ Removed redundant local declaration of imported symbol '\${requested}' in \${absImporter}:\${localDeclLineIdx + 1}\`);
        return {
          fileToModify: absImporter,
          originalContent: content,
          modifiedContent: newContent,
          description: \`Removed redundant local declaration of imported symbol '\${requested}'\`,
          applied: true,
        };
      }
    }

    // 2. If no local declaration was removed, remove symbol from import line
    const targetImportIdx = err.line - 1;
    if (targetImportIdx >= 0 && targetImportIdx < lines.length) {
      const line = lines[targetImportIdx];
      if (line.includes(requested)) {
        let newLine = line.replace(new RegExp(\`\\\\b\${escaped}\\\\s*,\\\\s*\`), "");
        if (newLine === line) {
          newLine = line.replace(new RegExp(\`,\\\\s*\\\\b\${escaped}\\\\b\`), "");
        }
        if (newLine === line) {
          newLine = line.replace(new RegExp(\`\\\\b\${escaped}\\\\b\`), "");
        }
        if (newLine !== line) {
          lines[targetImportIdx] = newLine;
          const newContent = lines.join("\\n");
          writeFileSync(absImporter, newContent, "utf8");
          console.log(\`[TsSymbolRepairEngine] ✓ Removed conflicting import '\${requested}' in \${absImporter}:\${err.line}\`);
          return {
            fileToModify: absImporter,
            originalContent: content,
            modifiedContent: newContent,
            description: \`Removed conflicting import '\${requested}' from import declaration\`,
            applied: true,
          };
        }
      }
    }

    return null;
  }

  private static escapeRegex(s: string): string {`;

if (!content.includes('public static fixImportConflictWithLocal(')) {
  if (content.includes(methodTarget)) {
    content = content.replace(methodTarget, methodReplacement);
    console.log('✓ Added fixImportConflictWithLocal method');
  } else {
    console.error('Target for method not found!');
  }
}

fs.writeFileSync(file, content, 'utf8');
console.log('Successfully updated ts-symbol-repair-engine.ts');
