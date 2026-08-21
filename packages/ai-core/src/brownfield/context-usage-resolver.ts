/**
 * ContextUsageResolver
 *
 * Traverses TypeScript ASTs to extract React Context definitions (createContext),
 * provider value objects (<Context.Provider value={{ ... }}>), and consumer
 * property accesses (useContext). Safely halts on computed/dynamic context property accesses.
 */

import ts from "typescript";
import { SymbolReferenceResolver } from "./symbol-reference-resolver.js";

export type ContextEdgeType =
  | "DEFINES_CONTEXT"
  | "SUPPLIES_CONTEXT"
  | "CONSUMES_CONTEXT";

export interface ContextDefinition {
  contextName: string;
  filePath: string;
  contextId: string; // filePath::contextName::line::col
  defaultProperties: string[];
  line: number;
  col: number;
}

export interface ProviderSupply {
  contextName: string;
  contextId?: string;
  providerFile: string;
  providerComponent: string;
  suppliedProperties: string[];
  line: number;
  col: number;
}

export interface ContextConsumer {
  contextName: string;
  contextId?: string;
  consumerFile: string;
  consumerComponent: string;
  consumedProperties: string[]; // e.g. ["tasks", "updateTask"] or ["*"] for full object
  isDestructured: boolean;
  hasComputedAccess: boolean;
  line: number;
  col: number;
}

export interface ContextUsageEdge {
  fromFile: string;
  fromComponent: string;
  toFile: string;
  contextName: string;
  propertyName: string;
  edgeType: ContextEdgeType;
  line: number;
  col: number;
}

export interface UnsafeContextPattern {
  filePath: string;
  contextName: string;
  reason: string;
}

export class ContextUsageResolver {
  private readonly symbolResolver: SymbolReferenceResolver;
  private readonly definitions: ContextDefinition[] = [];
  private readonly providers: ProviderSupply[] = [];
  private readonly consumers: ContextConsumer[] = [];
  private readonly edges: ContextUsageEdge[] = [];
  private readonly unsafePatterns: UnsafeContextPattern[] = [];

  constructor(symbolResolver: SymbolReferenceResolver) {
    this.symbolResolver = symbolResolver;
  }

  /**
   * Analyzes all files in the project for React Context definitions, providers, and consumers.
   */
  public analyzeProject(): {
    definitions: ContextDefinition[];
    providers: ProviderSupply[];
    consumers: ContextConsumer[];
    edges: ContextUsageEdge[];
    unsafePatterns: UnsafeContextPattern[];
  } {
    const summaries = this.symbolResolver.getAllSummaries();

    for (const [filePath] of summaries) {
      this.analyzeFile(filePath);
    }

    this.linkContextEdges();

    return {
      definitions: this.definitions,
      providers: this.providers,
      consumers: this.consumers,
      edges: this.edges,
      unsafePatterns: this.unsafePatterns,
    };
  }

  /**
   * Discovers all providers and consumers of a specific Context property.
   */
  public findContextTrace(
    contextName: string,
    propertyName?: string
  ): {
    definitions: ContextDefinition[];
    providers: ProviderSupply[];
    consumers: ContextConsumer[];
    hasComputedAccess: boolean;
    unsafeReasons: string[];
  } {
    const defs = this.definitions.filter(d => d.contextName === contextName);
    const provs = this.providers.filter(p => p.contextName === contextName);
    const cons = this.consumers.filter(c => c.contextName === contextName);

    const hasComputed = cons.some(c => c.hasComputedAccess) ||
      this.unsafePatterns.some(u => u.contextName === contextName);

    const unsafeReasons: string[] = [];
    if (hasComputed) {
      unsafeReasons.push(
        `COMPUTED_CONTEXT_ACCESS: Context "${contextName}" is accessed via dynamic computed key ctx[key]. Cannot statically prove consumer completeness.`
      );
    }

    // Filter by propertyName if specified
    const matchedConsumers = propertyName
      ? cons.filter(c => c.consumedProperties.includes(propertyName) || c.consumedProperties.includes("*"))
      : cons;

    return {
      definitions: defs,
      providers: provs,
      consumers: matchedConsumers,
      hasComputedAccess: hasComputed,
      unsafeReasons,
    };
  }

  public getUnsafePatterns(): UnsafeContextPattern[] {
    return this.unsafePatterns;
  }

  private analyzeFile(filePath: string) {
    const sourceFile = this.symbolResolver.getSourceFile(filePath);
    if (!sourceFile) return;

    const scopeStack: string[] = ["top_level"];

    const visit = (node: ts.Node) => {
      let pushedScope = false;

      // Track component scopes
      if (ts.isFunctionDeclaration(node) && node.name && /^[A-Z]/.test(node.name.text)) {
        scopeStack.push(node.name.text);
        pushedScope = true;
      } else if (
        ts.isVariableDeclaration(node) &&
        ts.isIdentifier(node.name) &&
        /^[A-Z]/.test(node.name.text) &&
        node.initializer &&
        (ts.isArrowFunction(node.initializer) || ts.isFunctionExpression(node.initializer))
      ) {
        scopeStack.push(node.name.text);
        pushedScope = true;
      }

      const currentScope = scopeStack[scopeStack.length - 1];

      // 1. Context Definitions: const TaskContext = createContext(...)
      if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer && ts.isCallExpression(node.initializer)) {
        const callText = node.initializer.expression.getText(sourceFile);
        if (callText === "createContext" || callText.endsWith(".createContext")) {
          const contextName = node.name.text;
          const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
          const defaultProps: string[] = [];

          if (node.initializer.arguments.length > 0) {
            const firstArg = node.initializer.arguments[0];
            if (ts.isObjectLiteralExpression(firstArg)) {
              for (const prop of firstArg.properties) {
                if (ts.isPropertyAssignment(prop) && ts.isIdentifier(prop.name)) {
                  defaultProps.push(prop.name.text);
                }
              }
            }
          }

          this.definitions.push({
            contextName,
            filePath,
            contextId: `${filePath}::${contextName}::${line + 1}::${character + 1}`,
            defaultProperties: defaultProps,
            line: line + 1,
            col: character + 1,
          });
        }
      }

      // 2. Provider Usages: <TaskContext.Provider value={{ tasks, updateTask }}>
      if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
        const tagText = node.tagName.getText(sourceFile);
        if (tagText.endsWith(".Provider")) {
          const contextName = tagText.replace(/\.Provider$/, "");
          const suppliedProps: string[] = [];
          const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));

          for (const attr of node.attributes.properties) {
            if (ts.isJsxAttribute(attr) && ts.isIdentifier(attr.name) && attr.name.text === "value") {
              if (attr.initializer && ts.isJsxExpression(attr.initializer) && attr.initializer.expression) {
                const expr = attr.initializer.expression;
                if (ts.isObjectLiteralExpression(expr)) {
                  for (const prop of expr.properties) {
                    if (ts.isShorthandPropertyAssignment(prop)) {
                      suppliedProps.push(prop.name.text);
                    } else if (ts.isPropertyAssignment(prop) && ts.isIdentifier(prop.name)) {
                      suppliedProps.push(prop.name.text);
                    }
                  }
                }
              }
            }
          }

          this.providers.push({
            contextName,
            providerFile: filePath,
            providerComponent: currentScope,
            suppliedProperties: suppliedProps,
            line: line + 1,
            col: character + 1,
          });
        }
      }

      // 3. Consumer Usages: const { tasks } = useContext(TaskContext) or const ctx = useContext(TaskContext)
      if (ts.isVariableDeclaration(node) && node.initializer && ts.isCallExpression(node.initializer)) {
        const callText = node.initializer.expression.getText(sourceFile);
        if (callText === "useContext" || callText.endsWith(".useContext")) {
          if (node.initializer.arguments.length > 0) {
            const contextArg = node.initializer.arguments[0].getText(sourceFile);
            const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
            const consumedProps: string[] = [];
            let isDestructured = false;

            if (ts.isObjectBindingPattern(node.name)) {
              isDestructured = true;
              for (const elem of node.name.elements) {
                const propName = elem.propertyName ? elem.propertyName.getText(sourceFile) : elem.name.getText(sourceFile);
                consumedProps.push(propName);
              }
            } else if (ts.isIdentifier(node.name)) {
              // Track property accesses on ctx object within the same function
              const varName = node.name.text;

              // Scan sibling nodes in function body for ctx.propertyName or ctx[key]
              const parentBlock = this.findEnclosingBlock(node);
              if (parentBlock) {
                this.scanObjectPropertyAccesses(parentBlock, varName, sourceFile, filePath, contextArg, consumedProps);
              }
              if (consumedProps.length === 0) {
                consumedProps.push("*"); // Whole object consumer only if no specific properties were accessed
              }
            }

            this.consumers.push({
              contextName: contextArg,
              consumerFile: filePath,
              consumerComponent: currentScope,
              consumedProperties: consumedProps,
              isDestructured,
              hasComputedAccess: false,
              line: line + 1,
              col: character + 1,
            });
          }
        }
      }

      ts.forEachChild(node, visit);

      if (pushedScope) {
        scopeStack.pop();
      }
    };

    visit(sourceFile);
  }

  private scanObjectPropertyAccesses(
    block: ts.Node,
    varName: string,
    sourceFile: ts.SourceFile,
    filePath: string,
    contextName: string,
    consumedProps: string[]
  ) {
    const visitAccess = (node: ts.Node) => {
      // Direct access: ctx.tasks
      if (ts.isPropertyAccessExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === varName) {
        const prop = node.name.text;
        if (!consumedProps.includes(prop)) {
          consumedProps.push(prop);
        }
      }

      // Destructuring alias: const { tasks: currentTasks } = ctx
      if (ts.isVariableDeclaration(node) && node.initializer && ts.isIdentifier(node.initializer) && node.initializer.text === varName) {
        if (ts.isObjectBindingPattern(node.name)) {
          for (const elem of node.name.elements) {
            const prop = elem.propertyName ? elem.propertyName.getText(sourceFile) : elem.name.getText(sourceFile);
            if (!consumedProps.includes(prop)) {
              consumedProps.push(prop);
            }
          }
        }
      }

      // Computed access: ctx[someKey]
      if (ts.isElementAccessExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === varName) {
        this.unsafePatterns.push({
          filePath,
          contextName,
          reason: `Dynamic element access on context object "${varName}[${node.argumentExpression.getText(sourceFile)}]" in ${filePath}`,
        });
      }

      ts.forEachChild(node, visitAccess);
    };

    visitAccess(block);
  }

  private findEnclosingBlock(node: ts.Node): ts.Node | null {
    let curr: ts.Node | undefined = node.parent;
    while (curr) {
      if (ts.isBlock(curr) || ts.isFunctionDeclaration(curr) || ts.isArrowFunction(curr)) {
        return curr;
      }
      curr = curr.parent;
    }
    return null;
  }

  private linkContextEdges() {
    for (const def of this.definitions) {
      this.edges.push({
        fromFile: def.filePath,
        fromComponent: "top_level",
        toFile: def.filePath,
        contextName: def.contextName,
        propertyName: "*",
        edgeType: "DEFINES_CONTEXT",
        line: def.line,
        col: def.col,
      });
    }

    for (const prov of this.providers) {
      const def = this.definitions.find(d => d.contextName === prov.contextName);
      if (def) {
        for (const prop of prov.suppliedProperties) {
          this.edges.push({
            fromFile: prov.providerFile,
            fromComponent: prov.providerComponent,
            toFile: def.filePath,
            contextName: prov.contextName,
            propertyName: prop,
            edgeType: "SUPPLIES_CONTEXT",
            line: prov.line,
            col: prov.col,
          });
        }
      }
    }

    for (const cons of this.consumers) {
      const def = this.definitions.find(d => d.contextName === cons.contextName);
      if (def) {
        for (const prop of cons.consumedProperties) {
          this.edges.push({
            fromFile: cons.consumerFile,
            fromComponent: cons.consumerComponent,
            toFile: def.filePath,
            contextName: cons.contextName,
            propertyName: prop,
            edgeType: "CONSUMES_CONTEXT",
            line: cons.line,
            col: cons.col,
          });
        }
      }
    }
  }
}
