/**
 * ASTSafeTransformer
 *
 * Provides safe, syntax-aware code transformations without dangerous global regex replacements.
 *
 * Rules:
 * - NEVER replace arbitrary useState(null) with fake user objects.
 * - NEVER inject demo credentials or fake authentication tokens into arbitrary source code.
 * - ONLY performs safe, non-destructive syntax repairs (casing normalization, export synthesis, syntax typo repairs).
 */

import ts from "typescript";

export interface TransformResult {
  code: string;
  transformed: boolean;
  repairsApplied: string[];
}

export class ASTSafeTransformer {
  /**
   * Safely repairs syntax typos and structural defects in TypeScript / TSX files.
   */
  public static transformSource(sourceCode: string, fileName: string): TransformResult {
    const repairs: string[] = [];
    let currentCode = sourceCode;

    // 0. Strip leaked patch blocks or search/replace markers from file content
    if (currentCode.includes("===PATCH:")) {
      const idx = currentCode.indexOf("===PATCH:");
      currentCode = currentCode.substring(0, idx).trim();
      repairs.push("Stripped trailing ===PATCH: block from file content");
    }
    if (currentCode.includes("<<<<<<< SEARCH")) {
      const idx = currentCode.indexOf("<<<<<<< SEARCH");
      currentCode = currentCode.substring(0, idx).trim();
      repairs.push("Stripped trailing <<<<<<< SEARCH block from file content");
    }

    // 1. Repair double generic brackets like React.FC<any>> -> React.FC<any>
    if (/React\.FC<[^>]+>>/.test(currentCode)) {
      currentCode = currentCode.replace(/(React\.FC<[^>]+)>>/g, "$1>");
      repairs.push("Fixed double generic closing bracket typo (React.FC<...>>)");
    }

    // 2. Repair malformed export async function in React components
    if (/export\s+async\s+function\s+([A-Z][A-Za-z0-9_$]*)\s*\(/.test(currentCode) && (fileName.endsWith(".tsx") || fileName.endsWith(".jsx"))) {
      currentCode = currentCode.replace(/export\s+async\s+function\s+([A-Z][A-Za-z0-9_$]*)/g, "export function $1");
      repairs.push("Removed async keyword from React component function declaration");
    }

    // 3. Fix duplicate interface definitions safely
    const deduplicated = this.fixDuplicateInterfaces(currentCode);
    if (deduplicated !== currentCode) {
      currentCode = deduplicated;
      repairs.push("Deduplicated repeated interface definitions");
    }

    // 4. Fix nested or broken router JSX structures
    if (fileName.includes("Route") || fileName.includes("App")) {
      const fixedRouter = this.fixBrokenRouterJSX(currentCode);
      if (fixedRouter !== currentCode) {
        currentCode = fixedRouter;
        repairs.push("Normalized nested router JSX structure");
      }
    }

    // 5. Fix pdf-parse default vs namespace import mismatch
    if (currentCode.includes("import pdfParse from \"pdf-parse\"") || currentCode.includes("import pdf from \"pdf-parse\"")) {
      currentCode = currentCode.replace(/import\s+(?:pdfParse|pdf)\s+from\s+["']pdf-parse["']/g, 'import * as pdfParseModule from "pdf-parse";\nconst pdfParse = (pdfParseModule as any).default || pdfParseModule;');
      repairs.push("Normalized pdf-parse CommonJS/ESM interop import");
    }

    // 6. Clean trailing code fence / prompt contamination
    const cleanedContamination = ASTSafeTransformer.stripPromptContamination(currentCode, fileName);
    if (cleanedContamination !== currentCode) {
      currentCode = cleanedContamination;
      repairs.push("Stripped trailing markdown fence/path prompt contamination");
    }

    // 7. Fix hyphenated function names e.g. function foo-bar() -> function fooBar()
    if (/(?:export\s+(?:default\s+)?)?function\s+([a-zA-Z0-9_$]+-[a-zA-Z0-9_$-]+)\s*\(/.test(currentCode)) {
      currentCode = currentCode.replace(/((?:export\s+(?:default\s+)?)?function\s+)([a-zA-Z0-9_$]+-[a-zA-Z0-9_$-]+)(\s*\()/g, (_m, prefix, id, suffix) => {
        const camel = id.replace(/-([a-zA-Z0-9])/g, (_: any, c: string) => c.toUpperCase());
        return `${prefix}${camel}${suffix}`;
      });
      repairs.push("Normalized invalid hyphenated function identifier to camelCase");
    }

    // 8. Auto-escape invalid unescaped '>' or '}' in JSX child text for .tsx and .jsx files
    if (fileName.endsWith(".tsx") || fileName.endsWith(".jsx")) {
      const repairedJsx = ASTSafeTransformer.repairJsxUnescapedCharacters(currentCode, fileName);
      if (repairedJsx !== currentCode) {
        currentCode = repairedJsx;
        repairs.push("Auto-escaped invalid literal angle brackets or braces in JSX text");
      }
    }

    // 9. Normalize illegal leading-zero decimal literals (TS1489: e.g. heading: 090 -> heading: 90)
    const normalizedNumbers = ASTSafeTransformer.normalizeLeadingZeroLiterals(currentCode, fileName);
    if (normalizedNumbers.normalizedCount > 0) {
      currentCode = normalizedNumbers.code;
      repairs.push(`Normalized ${normalizedNumbers.normalizedCount} leading-zero numeric literal(s) (TS1489)`);
    }

    // 10. Deduplicate redundant top-level declarations (e.g. duplicate App declarations)
    const dedupedIdents = ASTSafeTransformer.deduplicateTopLevelIdentifiers(currentCode, fileName);
    if (dedupedIdents.deduplicatedCount > 0) {
      currentCode = dedupedIdents.code;
      repairs.push(`Deduplicated ${dedupedIdents.deduplicatedCount} duplicate top-level identifier(s)`);
    }

    // 11. Normalize untyped ternary literal variable declarations to prevent TS2345 widening
    const ternaryNormalized = ASTSafeTransformer.repairTernaryLiteralWidening(currentCode, fileName);
    if (ternaryNormalized.repairedCount > 0) {
      currentCode = ternaryNormalized.code;
      repairs.push(`Normalized ${ternaryNormalized.repairedCount} untyped ternary literal variable(s) (TS2345)`);
    }

    return {
      code: currentCode,
      transformed: repairs.length > 0,
      repairsApplied: repairs,
    };
  }

  /**
   * Safely escapes literal '>' or '}' characters in JSX text nodes (e.g. <div>> {log}</div> -> <div>&gt; {log}</div>)
   * while preserving valid HTML entities, JS comparison operators, and arrow functions.
   */
  public static repairJsxUnescapedCharacters(sourceCode: string, fileName: string): string {
    if (!fileName.endsWith(".tsx") && !fileName.endsWith(".jsx")) {
      return sourceCode;
    }

    let code = sourceCode;
    try {
      const sf = ts.createSourceFile(
        fileName,
        code,
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TSX
      );

      const replacements: { start: number; end: number; text: string }[] = [];
      const walk = (node: ts.Node) => {
        if (ts.isJsxText(node)) {
          const text = node.getText(sf);
          let escaped = text;
          if (/(?<!&[a-zA-Z0-9#]{1,10})>/.test(escaped)) {
            escaped = escaped.replace(/(?<!&[a-zA-Z0-9#]{1,10})>/g, "&gt;");
          }
          if (/(?<!&#[0-9]{1,10})}/.test(escaped)) {
            escaped = escaped.replace(/(?<!&#[0-9]{1,10})}/g, "&#125;");
          }
          if (escaped !== text) {
            replacements.push({ start: node.getStart(sf), end: node.getEnd(), text: escaped });
          }
        }
        ts.forEachChild(node, walk);
      };
      walk(sf);

      if (replacements.length > 0) {
        replacements.sort((a, b) => b.start - a.start);
        for (const r of replacements) {
          code = code.slice(0, r.start) + r.text + code.slice(r.end);
        }
      }
    } catch {
      // In case AST parsing threw an exception
    }

    // Secondary regex guard for unescaped angle brackets right after opening tags (e.g. <div>> {log}</div>)
    if (/(<[A-Za-z0-9_.-]+(?:\s+[^>]*?)?>)\s*>+\s*(\{|\b|[a-zA-Z0-9])/.test(code)) {
      code = code.replace(/(<[A-Za-z0-9_.-]+(?:\s+[^>]*?)?>)\s*>+\s*(\{|\b|[a-zA-Z0-9])/g, "$1&gt; $2");
    }

    // Secondary regex guard for unescaped less-than brackets in JSX text (e.g. <div>Within limits (< 750°C)</div> or <span>< 5 ms</span>)
    // In JSX text, a literal '<' followed by whitespace, numbers, or comparison symbols is not a valid tag and breaks React Babel.
    let prevCode = "";
    while (prevCode !== code) {
      prevCode = code;
      code = code.replace(/(>[^<{]*?)<(\s*=?\s*[\d.]+[^<{]*?<\/[a-zA-Z0-9_.-]+>)/g, "$1&lt;$2");
      code = code.replace(/(>[^<{]*?)<(\s+[^<{]*?<\/[a-zA-Z0-9_.-]+>)/g, "$1&lt;$2");
    }

    return code;
  }

  /**
   * Safely deduplicates identical/repeated interface declarations without truncating the file.
   */
  public static fixDuplicateInterfaces(sourceCode: string): string {
    const seenInterfaces = new Set<string>();
    const interfaceRegex = /(?:export\s+)?interface\s+([A-Za-z0-9_$]+)\s*\{[\s\S]*?\}/g;

    return sourceCode.replace(interfaceRegex, (fullMatch, interfaceName) => {
      if (seenInterfaces.has(interfaceName)) {
        // Return blank comment without reproducing the interface keyword + name
        return `/* duplicate declaration ${interfaceName} removed */`;
      }
      seenInterfaces.add(interfaceName);
      return fullMatch;
    });
  }

  /**
   * Normalizes nested or redundant <Routes> inside <Route> element props.
   */
  public static fixBrokenRouterJSX(sourceCode: string): string {
    let result = sourceCode;
    // Replace element={<Routes><Route ... /></Routes>} nested directly inside element={...}
    result = result.replace(/element=\{\s*<Routes>\s*([\s\S]*?)\s*<\/Routes>\s*\}/g, "element={$1}");
    return result;
  }

  /**
   * AST-safe transformation to strip <BrowserRouter> or <Router> wrappers from JSX trees
   * (e.g. in routes.tsx or child pages) and clean unused router imports.
   */
  public static stripRouterWrappersFromJsx(sourceCode: string, fileName = "routes.tsx"): string {
    if (!sourceCode.includes("BrowserRouter") && !sourceCode.includes("Router")) {
      return sourceCode;
    }

    try {
      const isTsx = fileName.endsWith(".tsx") || fileName.endsWith(".jsx") || !fileName.includes(".");
      const scriptKind = isTsx ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
      const sourceFile = ts.createSourceFile(
        fileName.endsWith(".tsx") ? fileName : `${fileName}.tsx`,
        sourceCode,
        ts.ScriptTarget.Latest,
        true,
        scriptKind
      );

      let transformed = false;

      const transformer = <T extends ts.Node>(context: ts.TransformationContext) => {
        const visit: ts.Visitor = (node: ts.Node): ts.Node | ts.Node[] | undefined => {
          // 1. Unnest <BrowserRouter>...</BrowserRouter> or <Router>...</Router>
          if (ts.isJsxElement(node)) {
            const tagName = node.openingElement.tagName.getText(sourceFile);
            if (tagName === "BrowserRouter" || tagName === "Router") {
              transformed = true;
              const children = node.children
                .map(child => ts.visitNode(child, visit))
                .filter((c): c is ts.JsxChild => c !== undefined && (!ts.isJsxText(c) || c.text.trim().length > 0));

              if (children.length === 1) {
                return children[0];
              } else if (children.length > 1) {
                return ts.factory.createJsxFragment(
                  ts.factory.createJsxOpeningFragment(),
                  children,
                  ts.factory.createJsxJsxClosingFragment()
                );
              }
            }
          }

          // 2. Clean react-router-dom import declarations removing BrowserRouter / Router if stripped
          if (ts.isImportDeclaration(node)) {
            const moduleSpecifier = node.moduleSpecifier;
            if (ts.isStringLiteral(moduleSpecifier) && (moduleSpecifier.text === "react-router-dom" || moduleSpecifier.text === "react-router")) {
              const importClause = node.importClause;
              if (importClause && importClause.namedBindings && ts.isNamedImports(importClause.namedBindings)) {
                const remainingElements = importClause.namedBindings.elements.filter(el => {
                  const name = el.name.text;
                  const propName = el.propertyName?.text;
                  return name !== "BrowserRouter" && name !== "Router" && propName !== "BrowserRouter" && propName !== "Router";
                });

                if (remainingElements.length === 0) {
                  return undefined;
                } else if (remainingElements.length !== importClause.namedBindings.elements.length) {
                  transformed = true;
                  return ts.factory.updateImportDeclaration(
                    node,
                    node.modifiers,
                    ts.factory.updateImportClause(
                      importClause,
                      importClause.isTypeOnly,
                      importClause.name,
                      ts.factory.updateNamedImports(importClause.namedBindings, remainingElements)
                    ),
                    node.moduleSpecifier,
                    node.assertClause
                  );
                }
              }
            }
          }

          return ts.visitEachChild(node, visit, context);
        };

        return (rootNode: T) => ts.visitNode(rootNode, visit) as T;
      };

      const result = ts.transform(sourceFile, [transformer]);
      if (!transformed) {
        result.dispose();
        return sourceCode;
      }

      const transformedSourceFile = result.transformed[0] as ts.SourceFile;
      const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
      let output = printer.printFile(transformedSourceFile);
      result.dispose();

      if (!output.endsWith("\n")) output += "\n";
      return output;
    } catch {
      return sourceCode;
    }
  }
  /**
   * Strips trailing file paths, markdown comments, or prompt artifacts appended by LLMs.
   */
  public static stripPromptContamination(content: string, fileName: string): string {
    let cleaned = content;

    // Remove markdown code blocks if the entire content was wrapped in ```
    if (cleaned.trimStart().startsWith("```") && cleaned.trimEnd().endsWith("```")) {
      cleaned = cleaned.trim().replace(/^```[a-zA-Z0-9_-]*\n?/, "").replace(/\n?```$/, "").trimEnd();
    }

    // Remove trailing file path annotations like "server/index.ts" or "===FILE: ...==="
    cleaned = cleaned
      .replace(/\n+(?:FILE|file|path|filename|filepath):\s*[\w\/\\.]+\.(?:ts|tsx|js|jsx|json|prisma)\s*$/gm, "")
      .replace(/\n+===END===\s*$/gm, "")
      .replace(/\n+```\s*$/gm, "");

    // Remove stray markdown code fences anywhere in the file (e.g. ```, ```tsx, ```ts)
    cleaned = cleaned.replace(/^[ \t]*```[a-zA-Z0-9_-]*\r?$/gm, "");

    // Remove stray language identifier lines orphaned by markdown stripping (e.g. 'tsx', 'ts', 'jsx', 'js')
    cleaned = cleaned.replace(/^[ \t]*(?:tsx|ts|jsx|js|typescript|javascript)\r?$/gm, "");

    if (content.endsWith("\n") && !cleaned.endsWith("\n")) {
      cleaned += "\n";
    }

    return cleaned;
  }

  /**
   * Parses AST to verify syntax validity without throwing runtime exceptions.
   */
  public static validateSyntax(sourceCode: string, fileName: string): { valid: boolean; isValid: boolean; errors: string[] } {
    try {
      const isTsx = fileName.endsWith(".tsx") || fileName.endsWith(".jsx");
      const scriptKind = isTsx ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
      const sourceFile = ts.createSourceFile(
        fileName,
        sourceCode,
        ts.ScriptTarget.Latest,
        true,
        scriptKind
      );

      const diagnostics = (sourceFile as any).parseDiagnostics || [];
      if (diagnostics.length > 0) {
        const errors = diagnostics.map((d: any) => {
          const pos = sourceFile.getLineAndCharacterOfPosition(d.start || 0);
          return `Line ${pos.line + 1}: ${d.messageText}`;
        });
        return { valid: false, isValid: false, errors };
      }

      return { valid: true, isValid: true, errors: [] };
    } catch (err: any) {
      return { valid: false, isValid: false, errors: [err.message] };
    }
  }

  /**
   * Safely closes small trailing bracket imbalances (braces, parens, brackets) if verified by TypeScript parser.
   */
  public static closeUnbalancedBrackets(content: string, fileName: string): string {
    if (!content || !content.trim()) return content;

    // Check if file is already 100% syntactically valid
    const initialCheck = ASTSafeTransformer.validateSyntax(content, fileName);
    if (initialCheck.valid) {
      return content;
    }

    const countDeltas = (str: string) => {
      let braceCount = 0;
      let parenCount = 0;
      let bracketCount = 0;
      let inString = false;
      let stringChar = "";
      let inLineComment = false;
      let inBlockComment = false;

      for (let i = 0; i < str.length; i++) {
        const char = str[i];
        const nextChar = str[i + 1];

        if (!inString && !inLineComment && !inBlockComment) {
          if (char === '/' && nextChar === '/') {
            inLineComment = true;
            i++;
            continue;
          }
          if (char === '/' && nextChar === '*') {
            inBlockComment = true;
            i++;
            continue;
          }
        }
        if (inLineComment) {
          if (char === '\n') inLineComment = false;
          continue;
        }
        if (inBlockComment) {
          if (char === '*' && nextChar === '/') {
            inBlockComment = false;
            i++;
          }
          continue;
        }

        if ((char === '"' || char === "'" || char === '`')) {
          if (!inString) {
            inString = true;
            stringChar = char;
          } else if (char === stringChar && str[i - 1] !== '\\') {
            inString = false;
          }
          continue;
        }
        if (inString) continue;

        if (char === '{') braceCount++;
        if (char === '}') braceCount--;
        if (char === '(') parenCount++;
        if (char === ')') parenCount--;
        if (char === '[') bracketCount++;
        if (char === ']') bracketCount--;
      }
      return { braceCount, parenCount, bracketCount };
    };

    // Generate content bases: original content, and content with 1 to 4 incomplete trailing lines trimmed
    const allLines = content.split("\n");
    const contentBases: string[] = [content];
    for (let popCount = 1; popCount <= 4; popCount++) {
      if (allLines.length > popCount) {
        contentBases.push(allLines.slice(0, allLines.length - popCount).join("\n"));
      }
    }

    const isJsxFile = fileName.endsWith(".tsx") || fileName.endsWith(".jsx");
    const componentMatch = content.match(/export\s+(?:default\s+)?(?:function|const)\s+([A-Z][A-Za-z0-9_$]*)/);

    for (const base of contentBases) {
      const { braceCount, parenCount, bracketCount } = countDeltas(base);
      if (braceCount < 0 || parenCount < 0 || bracketCount < 0) continue;
      if (braceCount > 6 || parenCount > 6 || bracketCount > 6) continue;

      const candidates: string[] = [];
      const closeBrackets = bracketCount > 0 ? "]".repeat(bracketCount) : "";
      const closeParens = parenCount > 0 ? ")".repeat(parenCount) : "";
      const closeBraces = braceCount > 0 ? "}".repeat(braceCount) : "";
      const closeBracesSemi = braceCount > 1 ? ("}".repeat(braceCount - 1) + "\n};\n") : (braceCount === 1 ? "};\n" : "");

      // Variant 1: standard closing brackets
      candidates.push(base.trimEnd() + "\n" + closeBrackets + closeParens + "\n" + closeBraces + "\n");

      // Variant 2: semicolon after parens (common in `return (...);`)
      candidates.push(base.trimEnd() + "\n" + closeBrackets + closeParens + ";\n" + closeBraces + "\n");

      // Variant 3: semicolon after braces (common in `const App = () => { ... };`)
      candidates.push(base.trimEnd() + "\n" + closeBrackets + closeParens + ";\n" + closeBracesSemi);

      // Variant 4: with export default if defined
      if (componentMatch && !base.includes(`export default ${componentMatch[1]}`) && !base.includes("export default function") && !base.includes("export default class")) {
        candidates.push(base.trimEnd() + "\n" + closeBrackets + closeParens + ";\n" + closeBracesSemi + `export default ${componentMatch[1]};\n`);
      }

      // Variant 5: JSX tag closing variants
      if (isJsxFile) {
        const jsxTags = [
          "</div>",
          "</div></div>",
          "</div></div></div>",
          "</div></div></div></div>",
          "</main></div>",
          "</section></div>",
          "</main></section></div>",
          "</form></div>",
          "</div>\n))}\n</div>",
          "</div>\n))}\n</div></div>",
          "</div>\n))}\n</div></div></div>",
          "</div>\n))}\n</main></div>",
        ];
        for (const tag of jsxTags) {
          candidates.push(base.trimEnd() + "\n" + tag + "\n" + closeBrackets + closeParens + ";\n" + closeBraces + "\n");
          candidates.push(base.trimEnd() + "\n" + tag + "\n" + closeBrackets + closeParens + ";\n" + closeBracesSemi);
          candidates.push(base.trimEnd() + "\n" + tag + "\n);\n}\n");
          if (componentMatch && !base.includes(`export default ${componentMatch[1]}`)) {
            candidates.push(base.trimEnd() + "\n" + tag + "\n" + closeBrackets + closeParens + ";\n" + closeBracesSemi + `export default ${componentMatch[1]};\n`);
            candidates.push(base.trimEnd() + "\n" + tag + "\n);\n}\n" + `export default ${componentMatch[1]};\n`);
          }
        }
      }

      for (const candidate of candidates) {
        const check = ASTSafeTransformer.validateSyntax(candidate, fileName);
        if (check.valid) {
          console.log(`[ASTSafeTransformer] 🔧 Auto-closed trailing unbalanced brackets in ${fileName} (braces: +${braceCount}, parens: +${parenCount}, brackets: +${bracketCount})`);
          return candidate;
        }
      }
    }

    return content;
  }

  /**
   * Safely normalizes invalid leading-zero numeric literals (TS1489 / TS1121).
   * E.g. heading: 090 -> heading: 90, bearing: 045 -> bearing: 45.
   * Preserves:
   * - String literals ("090", '090', `090`)
   * - Decimals / floats (0.90, 0.05)
   * - Standard ES6 hex (0x90), octal (0o70), binary (0b10)
   * - Standalone 0
   * - Identifiers and property names (item090, _090)
   */
  public static normalizeLeadingZeroLiterals(sourceCode: string, fileName = "file.tsx"): { code: string; normalizedCount: number } {
    let code = sourceCode;
    let normalizedCount = 0;

    // 1. Primary AST traversal using TypeScript compiler API
    try {
      const isTsx = fileName.endsWith(".tsx") || fileName.endsWith(".jsx") || !fileName.includes(".");
      const scriptKind = isTsx ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
      const sf = ts.createSourceFile(
        fileName.endsWith(".tsx") || fileName.endsWith(".ts") ? fileName : `${fileName}.tsx`,
        code,
        ts.ScriptTarget.Latest,
        true,
        scriptKind
      );

      const replacements: { start: number; end: number; text: string }[] = [];
      const walk = (node: ts.Node) => {
        if (ts.isNumericLiteral(node)) {
          const raw = node.getText(sf);
          // Match invalid leading zero decimal/octal literals like 090, 045, 085, 012, 007, 00
          // but NOT floats (0.90), hex (0x1F), octal (0o77), binary (0b10), or single 0
          if (/^0[0-9]+$/.test(raw)) {
            const normalized = raw.replace(/^0+/, "") || "0";
            replacements.push({
              start: node.getStart(sf),
              end: node.getEnd(),
              text: normalized,
            });
          }
        }
        ts.forEachChild(node, walk);
      };
      walk(sf);

      if (replacements.length > 0) {
        replacements.sort((a, b) => b.start - a.start);
        for (const r of replacements) {
          code = code.slice(0, r.start) + r.text + code.slice(r.end);
        }
        normalizedCount += replacements.length;
      }
    } catch {
      // In case AST parsing failed
    }

    // 2. Secondary AST-safe regex pass for object properties and array items in case AST recovery missed partially unparsed expressions
    // Matches patterns like `heading: 090`, `bearing: 045`, `[090, 045]`, `foo = 090`
    // Negative lookbehind ensures we don't touch identifiers, floats, or hex/octal prefixes
    const regex = /(?<=[:=,(\[]\s*(?:[-+]?\s*))\b0([0-9]+)\b(?![."'])/g;
    const regexMatches = [...code.matchAll(regex)];
    if (regexMatches.length > 0) {
      code = code.replace(regex, (_match, digits) => {
        normalizedCount++;
        return digits.replace(/^0+/, "") || "0";
      });
    }

    return { code, normalizedCount };
  }

  /**
   * Detects duplicate top-level identifier declarations (TS2300: e.g. duplicate App).
   */
  public static detectDuplicateTopLevelIdentifiers(sourceCode: string, fileName = "file.tsx"): string[] {
    const isTsx = fileName.endsWith(".tsx") || fileName.endsWith(".jsx") || !fileName.includes(".");
    const scriptKind = isTsx ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
    try {
      const sf = ts.createSourceFile(
        fileName,
        sourceCode,
        ts.ScriptTarget.Latest,
        true,
        scriptKind
      );

      const declared = new Set<string>();
      const duplicates = new Set<string>();

      for (const stmt of sf.statements) {
        if (ts.isFunctionDeclaration(stmt) && stmt.name) {
          const name = stmt.name.text;
          if (declared.has(name)) duplicates.add(name);
          else declared.add(name);
        } else if (ts.isVariableStatement(stmt)) {
          for (const decl of stmt.declarationList.declarations) {
            if (ts.isIdentifier(decl.name)) {
              const name = decl.name.text;
              if (declared.has(name)) duplicates.add(name);
              else declared.add(name);
            }
          }
        } else if (ts.isClassDeclaration(stmt) && stmt.name) {
          const name = stmt.name.text;
          if (declared.has(name)) duplicates.add(name);
          else declared.add(name);
        }
      }

      return Array.from(duplicates);
    } catch {
      return [];
    }
  }

  /**
   * Safely deduplicates top-level identifier declarations, prioritizing default exports or canonical implementations.
   */
  public static deduplicateTopLevelIdentifiers(sourceCode: string, fileName = "file.tsx"): { code: string; deduplicatedCount: number } {
    const isTsx = fileName.endsWith(".tsx") || fileName.endsWith(".jsx") || !fileName.includes(".");
    const scriptKind = isTsx ? ts.ScriptKind.TSX : ts.ScriptKind.TS;

    try {
      const sf = ts.createSourceFile(
        fileName,
        sourceCode,
        ts.ScriptTarget.Latest,
        true,
        scriptKind
      );

      interface DeclInfo {
        name: string;
        node: ts.Node;
        isDefaultExport: boolean;
        isExport: boolean;
        hasBody: boolean;
        start: number;
        end: number;
      }

      const byName = new Map<string, DeclInfo[]>();

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
      let deduplicatedCount = 0;

      for (const [name, decls] of byName.entries()) {
        if (decls.length > 1) {
          // Prioritize: 1) default export with body, 2) export with body, 3) longest implementation
          let canonical = decls.find(d => d.isDefaultExport && d.hasBody);
          if (!canonical) canonical = decls.find(d => d.isDefaultExport);
          if (!canonical) canonical = decls.find(d => d.isExport && d.hasBody);
          if (!canonical) canonical = decls.find(d => d.isExport);
          if (!canonical) canonical = decls[decls.length - 1];

          for (const d of decls) {
            if (d !== canonical) {
              toRemove.push({ start: d.start, end: d.end, name });
              deduplicatedCount++;
            }
          }
        }
      }

      if (toRemove.length === 0) {
        return { code: sourceCode, deduplicatedCount: 0 };
      }

      toRemove.sort((a, b) => b.start - a.start);
      let res = sourceCode;
      for (const r of toRemove) {
        res = res.slice(0, r.start) + `/* [ASTSafeTransformer] Removed duplicate declaration of '${r.name}' */` + res.slice(r.end);
      }

      return { code: res, deduplicatedCount };
    } catch {
      return { code: sourceCode, deduplicatedCount: 0 };
    }
  }

  /**
   * Safely repairs untyped variable declarations initialized with literal ternary expressions
   * which would otherwise widen to 'string' and cause TS2345 type errors when passed to state setters.
   * e.g. const nextStatus = n.status === 'Active' ? 'Acknowledged' : 'Active';
   *   -> const nextStatus = (n.status === 'Active' ? 'Acknowledged' : 'Active') as const;
   */
  public static repairTernaryLiteralWidening(sourceCode: string, fileName = "file.tsx"): { code: string; repairedCount: number } {
    if (!fileName.endsWith(".ts") && !fileName.endsWith(".tsx")) {
      return { code: sourceCode, repairedCount: 0 };
    }

    let code = sourceCode;
    let repairedCount = 0;

    try {
      const isTsx = fileName.endsWith(".tsx") || fileName.endsWith(".jsx");
      const sf = ts.createSourceFile(
        fileName,
        code,
        ts.ScriptTarget.Latest,
        true,
        isTsx ? ts.ScriptKind.TSX : ts.ScriptKind.TS
      );

      const replacements: { start: number; end: number; text: string }[] = [];

      const walk = (node: ts.Node) => {
        if (ts.isVariableDeclaration(node) && !node.type && node.initializer) {
          if (ts.isConditionalExpression(node.initializer)) {
            const cond = node.initializer;
            const whenTrue = cond.whenTrue;
            const whenFalse = cond.whenFalse;

            const isLiteral = (n: ts.Expression) =>
              ts.isStringLiteral(n) ||
              ts.isNumericLiteral(n) ||
              n.kind === ts.SyntaxKind.TrueKeyword ||
              n.kind === ts.SyntaxKind.FalseKeyword;

            const trueText = whenTrue.getText(sf);
            const falseText = whenFalse.getText(sf);

            if (!trueText.includes(" as ") && !falseText.includes(" as ")) {
              if (isLiteral(whenTrue)) {
                replacements.push({
                  start: whenTrue.getStart(sf),
                  end: whenTrue.getEnd(),
                  text: `(${trueText} as const)`,
                });
                repairedCount++;
              }
              if (isLiteral(whenFalse)) {
                replacements.push({
                  start: whenFalse.getStart(sf),
                  end: whenFalse.getEnd(),
                  text: `(${falseText} as const)`,
                });
                repairedCount++;
              }
            }
          }
        }
        ts.forEachChild(node, walk);
      };

      walk(sf);

      if (replacements.length > 0) {
        replacements.sort((a, b) => b.start - a.start);
        for (const r of replacements) {
          code = code.slice(0, r.start) + r.text + code.slice(r.end);
        }
      }
    } catch {
      // In case AST parsing threw an exception
    }

    return { code, repairedCount };
  }

  /**
   * Convenience transform method returning transformed code directly.
   */
  public static transform(sourceCode: string, fileName = "file.tsx"): string {
    return this.transformSource(sourceCode, fileName).code;
  }
}

export const AstSafeTransformer = ASTSafeTransformer;
export type AstSafeTransformer = ASTSafeTransformer;
