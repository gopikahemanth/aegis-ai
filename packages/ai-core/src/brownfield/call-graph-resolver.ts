/**
 * CallGraphResolver
 *
 * Traverses TypeScript ASTs to construct a deterministic caller -> callee call graph,
 * JSX component hierarchy, and test-to-source reference mappings.
 */

import ts from "typescript";
import { SymbolReferenceResolver, type FileAstSummary, type SymbolIdentifier } from "./symbol-reference-resolver.js";

export type CallSiteKind =
  | "function_call"
  | "method_call"
  | "constructor_call"
  | "jsx_render"
  | "type_reference"
  | "hook_invocation";

export interface CallSite {
  callerFile: string;
  callerSymbolName: string; // Enclosing function, component, or "top_level"
  callerKind: string;
  calleeName: string; // The identifier being called
  calleeTargetFile?: string; // Resolved source file if known
  calleeTargetSymbol?: SymbolIdentifier; // Resolved target symbol
  kind: CallSiteKind;
  line: number;
  col: number;
}

export interface CallerGraphEdge {
  fromFile: string;
  fromSymbol: string;
  toFile: string;
  toSymbol: string;
  callKind: CallSiteKind;
  line: number;
  col: number;
}

export class CallGraphResolver {
  private readonly symbolResolver: SymbolReferenceResolver;
  private readonly callSitesByFile: Map<string, CallSite[]> = new Map();
  private readonly edges: CallerGraphEdge[] = [];

  constructor(symbolResolver: SymbolReferenceResolver) {
    this.symbolResolver = symbolResolver;
  }

  /**
   * Analyzes all files in the project and constructs the complete call graph.
   */
  public buildGraph(): {
    edges: CallerGraphEdge[];
    callSites: Map<string, CallSite[]>;
  } {
    const fileSummaries = this.symbolResolver.getAllSummaries();

    for (const [filePath] of fileSummaries) {
      this.analyzeFile(filePath);
    }

    // Resolve target symbols and build directional edges
    for (const [, sites] of this.callSitesByFile) {
      for (const site of sites) {
        this.resolveCallee(site);
        if (site.calleeTargetFile && site.calleeTargetSymbol) {
          this.edges.push({
            fromFile: site.callerFile,
            fromSymbol: site.callerSymbolName,
            toFile: site.calleeTargetFile,
            toSymbol: site.calleeTargetSymbol.name,
            callKind: site.kind,
            line: site.line,
            col: site.col,
          });
        }
      }
    }

    return {
      edges: this.edges,
      callSites: this.callSitesByFile,
    };
  }

  /**
   * Finds all direct callers of a specific symbol in a specific file.
   */
  public findDirectCallers(
    targetFile: string,
    targetSymbolName: string
  ): CallerGraphEdge[] {
    const targetRel = targetFile.replace(/\\/g, "/").replace(/^(\/|\\)+/, "");
    return this.edges.filter(
      e =>
        e.toFile === targetRel &&
        (e.toSymbol === targetSymbolName || (targetSymbolName === "default" && e.toSymbol === "default"))
    );
  }

  /**
   * Finds all JSX renderers of a component.
   */
  public findJsxUsages(targetFile: string, componentName: string): CallerGraphEdge[] {
    const targetRel = targetFile.replace(/\\/g, "/").replace(/^(\/|\\)+/, "");
    return this.edges.filter(
      e => e.toFile === targetRel && e.toSymbol === componentName && e.callKind === "jsx_render"
    );
  }

  /**
   * Finds all test files and test suites referencing a target symbol.
   */
  public findTestCallers(targetFile: string, targetSymbolName: string): CallerGraphEdge[] {
    const targetRel = targetFile.replace(/\\/g, "/").replace(/^(\/|\\)+/, "");
    return this.edges.filter(
      e =>
        e.toFile === targetRel &&
        (e.toSymbol === targetSymbolName || targetSymbolName === "default") &&
        (e.fromFile.includes("__tests__") || e.fromFile.endsWith(".test.ts") || e.fromFile.endsWith(".test.tsx") || e.fromFile.endsWith(".spec.ts") || e.fromFile.endsWith(".spec.tsx"))
    );
  }

  private analyzeFile(filePath: string): CallSite[] {
    const sourceFile = this.symbolResolver.getSourceFile(filePath);
    if (!sourceFile) return [];

    const sites: CallSite[] = [];
    const scopeStack: { name: string; kind: string }[] = [{ name: "top_level", kind: "module" }];

    const visit = (node: ts.Node) => {
      let pushedScope = false;

      // 1. Track caller scope (functions, methods, components, tests)
      if (ts.isFunctionDeclaration(node) && node.name) {
        scopeStack.push({ name: node.name.text, kind: "function" });
        pushedScope = true;
      } else if (ts.isMethodDeclaration(node) && ts.isIdentifier(node.name)) {
        scopeStack.push({ name: node.name.text, kind: "method" });
        pushedScope = true;
      } else if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer && (ts.isArrowFunction(node.initializer) || ts.isFunctionExpression(node.initializer))) {
        scopeStack.push({ name: node.name.text, kind: "function" });
        pushedScope = true;
      }

      const currentScope = scopeStack[scopeStack.length - 1];

      // 2. Call Expressions: fn(), obj.method(), hook(), describe(), it()
      if (ts.isCallExpression(node)) {
        const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));

        if (ts.isIdentifier(node.expression)) {
          const callee = node.expression.text;
          const kind: CallSiteKind = callee.startsWith("use") ? "hook_invocation" : "function_call";
          sites.push({
            callerFile: filePath,
            callerSymbolName: currentScope.name,
            callerKind: currentScope.kind,
            calleeName: callee,
            kind,
            line: line + 1,
            col: character + 1,
          });
        } else if (ts.isPropertyAccessExpression(node.expression)) {
          // obj.method() or Namespace.fn()
          const objText = node.expression.expression.getText(sourceFile);
          const propText = node.expression.name.text;
          sites.push({
            callerFile: filePath,
            callerSymbolName: currentScope.name,
            callerKind: currentScope.kind,
            calleeName: `${objText}.${propText}`,
            kind: "method_call",
            line: line + 1,
            col: character + 1,
          });
        }
      }

      // 3. New Expressions: new Service()
      if (ts.isNewExpression(node)) {
        const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
        if (ts.isIdentifier(node.expression)) {
          sites.push({
            callerFile: filePath,
            callerSymbolName: currentScope.name,
            callerKind: currentScope.kind,
            calleeName: node.expression.text,
            kind: "constructor_call",
            line: line + 1,
            col: character + 1,
          });
        }
      }

      // 4. JSX Elements: <Component prop={...} />
      if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
        const tagName = node.tagName.getText(sourceFile);
        // Only uppercase identifiers are React components
        if (/^[A-Z]/.test(tagName)) {
          const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
          sites.push({
            callerFile: filePath,
            callerSymbolName: currentScope.name,
            callerKind: currentScope.kind,
            calleeName: tagName,
            kind: "jsx_render",
            line: line + 1,
            col: character + 1,
          });
        }
      }

      // 5. Type References: TaskItem, Promise<User>
      if (ts.isTypeReferenceNode(node)) {
        const typeName = node.typeName.getText(sourceFile);
        if (/^[A-Z]/.test(typeName) && typeName !== "Promise" && typeName !== "Array" && typeName !== "Record") {
          const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
          sites.push({
            callerFile: filePath,
            callerSymbolName: currentScope.name,
            callerKind: currentScope.kind,
            calleeName: typeName,
            kind: "type_reference",
            line: line + 1,
            col: character + 1,
          });
        }
      }

      ts.forEachChild(node, visit);

      if (pushedScope) {
        scopeStack.pop();
      }
    };

    visit(sourceFile);
    this.callSitesByFile.set(filePath, sites);
    return sites;
  }

  private resolveCallee(site: CallSite) {
    const summary = this.symbolResolver.getSummary(site.callerFile);
    if (!summary) return;

    let searchName = site.calleeName;
    let namespaceObj: string | undefined;

    if (searchName.includes(".")) {
      const parts = searchName.split(".");
      namespaceObj = parts[0];
      searchName = parts[1];
    }

    // Check if imported
    for (const imp of summary.imports) {
      if (!imp.resolvedSourceFile) continue;

      if (namespaceObj && imp.isNamespace && imp.localAlias === namespaceObj) {
        // Namespace access: Namespace.fn()
        const targetSummary = this.symbolResolver.getSummary(imp.resolvedSourceFile);
        if (targetSummary) {
          const sym = targetSummary.symbols.find(s => s.name === searchName || s.localName === searchName);
          if (sym) {
            site.calleeTargetFile = imp.resolvedSourceFile;
            site.calleeTargetSymbol = sym;
            return;
          }
        }
      } else if (!namespaceObj && imp.localAlias === searchName) {
        // Direct named or default import
        const chain = this.symbolResolver.resolveExportChain(imp.resolvedSourceFile, imp.importedName);
        if (chain) {
          site.calleeTargetFile = chain.targetFile;
          site.calleeTargetSymbol = chain.targetSymbol;
          return;
        }
      }
    }

    // Check if declared locally in same file
    const localSym = summary.symbols.find(s => s.name === searchName || s.localName === searchName);
    if (localSym) {
      site.calleeTargetFile = site.callerFile;
      site.calleeTargetSymbol = localSym;
    }
  }
}
