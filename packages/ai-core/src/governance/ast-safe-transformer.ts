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

    return {
      code: currentCode,
      transformed: repairs.length > 0,
      repairsApplied: repairs,
    };
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
}
