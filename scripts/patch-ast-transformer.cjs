const fs = require('fs');
const path = require('path');

const file = path.resolve(__dirname, '../packages/ai-core/src/governance/ast-safe-transformer.ts');
let content = fs.readFileSync(file, 'utf8');

const targetBlock = `      const byName = new Map<string, DeclInfo[]>();

      for (const stmt of sf.statements) {
        if (ts.isFunctionDeclaration(stmt) && stmt.name) {
          const name = stmt.name.text;
          if (!byName.has(name)) byName.set(name, []);
          byName.get(name)!.push({
            name,
            node: stmt,
            isDefaultExport: Boolean(stmt.modifiers?.some(m => m.kind === ts.SyntaxKind.DefaultKeyword)),
            isExport: Boolean(stmt.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword)),
            hasBody: Boolean(stmt.body),
            start: stmt.getStart(sf),
            end: stmt.getEnd(),
          });
        } else if (ts.isVariableStatement(stmt)) {
          for (const decl of stmt.declarationList.declarations) {
            if (ts.isIdentifier(decl.name)) {
              const name = decl.name.text;
              if (!byName.has(name)) byName.set(name, []);
              byName.get(name)!.push({
                name,
                node: stmt,
                isDefaultExport: false,
                isExport: Boolean(stmt.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword)),
                hasBody: Boolean(decl.initializer),
                start: stmt.getStart(sf),
                end: stmt.getEnd(),
              });
            }
          }
        } else if (ts.isClassDeclaration(stmt) && stmt.name) {
          const name = stmt.name.text;
          if (!byName.has(name)) byName.set(name, []);
          byName.get(name)!.push({
            name,
            node: stmt,
            isDefaultExport: Boolean(stmt.modifiers?.some(m => m.kind === ts.SyntaxKind.DefaultKeyword)),
            isExport: Boolean(stmt.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword)),
            hasBody: true,
            start: stmt.getStart(sf),
            end: stmt.getEnd(),
          });
        }
      }

      const toRemove: { start: number; end: number; name: string }[] = [];
      let deduplicatedCount = 0;`;

const replacementBlock = `      const byName = new Map<string, DeclInfo[]>();
      const importedNames = new Set<string>();
      const toRemove: { start: number; end: number; name: string }[] = [];
      let deduplicatedCount = 0;

      for (const stmt of sf.statements) {
        if (ts.isImportDeclaration(stmt) && stmt.importClause) {
          if (stmt.importClause.name) {
            importedNames.add(stmt.importClause.name.text);
          }
          if (stmt.importClause.namedBindings && ts.isNamedImports(stmt.importClause.namedBindings)) {
            for (const elem of stmt.importClause.namedBindings.elements) {
              importedNames.add(elem.name.text);
            }
          }
        }
      }

      for (const stmt of sf.statements) {
        if (ts.isFunctionDeclaration(stmt) && stmt.name) {
          const name = stmt.name.text;
          if (!byName.has(name)) byName.set(name, []);
          byName.get(name)!.push({
            name,
            node: stmt,
            isDefaultExport: Boolean(stmt.modifiers?.some(m => m.kind === ts.SyntaxKind.DefaultKeyword)),
            isExport: Boolean(stmt.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword)),
            hasBody: Boolean(stmt.body),
            start: stmt.getStart(sf),
            end: stmt.getEnd(),
          });
        } else if (ts.isVariableStatement(stmt)) {
          for (const decl of stmt.declarationList.declarations) {
            if (ts.isIdentifier(decl.name)) {
              const name = decl.name.text;
              if (importedNames.has(name)) {
                // Duplicate local fallback declaration conflicting with import (TS2440)
                toRemove.push({
                  start: stmt.getStart(sf),
                  end: stmt.getEnd(),
                  name,
                });
                deduplicatedCount++;
                continue;
              }
              if (!byName.has(name)) byName.set(name, []);
              byName.get(name)!.push({
                name,
                node: stmt,
                isDefaultExport: false,
                isExport: Boolean(stmt.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword)),
                hasBody: Boolean(decl.initializer),
                start: stmt.getStart(sf),
                end: stmt.getEnd(),
              });
            }
          }
        } else if (ts.isClassDeclaration(stmt) && stmt.name) {
          const name = stmt.name.text;
          if (!byName.has(name)) byName.set(name, []);
          byName.get(name)!.push({
            name,
            node: stmt,
            isDefaultExport: Boolean(stmt.modifiers?.some(m => m.kind === ts.SyntaxKind.DefaultKeyword)),
            isExport: Boolean(stmt.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword)),
            hasBody: true,
            start: stmt.getStart(sf),
            end: stmt.getEnd(),
          });
        }
      }`;

// Normalize line endings for replacement
const normalizeLf = (s) => s.replace(/\r\n/g, '\n');
const normalizedContent = normalizeLf(content);
const normalizedTarget = normalizeLf(targetBlock);
const normalizedReplacement = normalizeLf(replacementBlock);

if (normalizedContent.includes(normalizedTarget)) {
  const updated = normalizedContent.replace(normalizedTarget, normalizedReplacement);
  fs.writeFileSync(file, updated, 'utf8');
  console.log('✓ Successfully updated ast-safe-transformer.ts with TS2440 import collision deduplication');
} else {
  console.error('Target block not found in ast-safe-transformer.ts');
}
