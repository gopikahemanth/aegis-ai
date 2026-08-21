/**
 * HookStateResolver
 *
 * Traverses TypeScript ASTs to extract custom hook return object and tuple shapes,
 * maps consumer destructuring / property accesses, and discovers returned callbacks.
 * Safely halts on dynamic hook property access (hookResult[dynamicKey]).
 */

import ts from "typescript";
import { SymbolReferenceResolver } from "./symbol-reference-resolver.js";

export type HookEdgeType =
  | "USES_HOOK"
  | "RETURNS_HOOK_VALUE"
  | "CONSUMES_HOOK_VALUE";

export interface CustomHookDefinition {
  hookName: string;
  filePath: string;
  returnKind: "OBJECT" | "TUPLE" | "PRIMITIVE" | "UNKNOWN";
  returnedProperties: string[]; // for object return: ["tasks", "loading", "updateTask"]
  returnedTupleElements: string[]; // for tuple return: ["tasks", "setTasks"]
  line: number;
  col: number;
}

export interface HookConsumer {
  hookName: string;
  consumerFile: string;
  consumerComponent: string;
  destructuredProperties: string[]; // ["tasks", "loading"]
  destructuredTupleIndices: number[]; // [0, 1]
  hasDynamicPropertyAccess: boolean;
  line: number;
  col: number;
}

export interface HookUsageEdge {
  fromFile: string;
  fromComponent: string;
  toFile: string;
  hookName: string;
  propertyName: string;
  edgeType: HookEdgeType;
  line: number;
  col: number;
}

export interface UnsafeHookPattern {
  filePath: string;
  hookName: string;
  reason: string;
}

export class HookStateResolver {
  private readonly symbolResolver: SymbolReferenceResolver;
  private readonly definitions: CustomHookDefinition[] = [];
  private readonly consumers: HookConsumer[] = [];
  private readonly edges: HookUsageEdge[] = [];
  private readonly unsafePatterns: UnsafeHookPattern[] = [];

  constructor(symbolResolver: SymbolReferenceResolver) {
    this.symbolResolver = symbolResolver;
  }

  /**
   * Analyzes all custom hooks and consumer components across the project.
   */
  public analyzeProject(): {
    definitions: CustomHookDefinition[];
    consumers: HookConsumer[];
    edges: HookUsageEdge[];
    unsafePatterns: UnsafeHookPattern[];
  } {
    const summaries = this.symbolResolver.getAllSummaries();

    for (const [filePath] of summaries) {
      this.analyzeFile(filePath);
    }

    this.linkHookEdges();

    return {
      definitions: this.definitions,
      consumers: this.consumers,
      edges: this.edges,
      unsafePatterns: this.unsafePatterns,
    };
  }

  /**
   * Finds all consumers and definition details for a specific custom hook.
   */
  public findHookTrace(
    hookName: string,
    propertyName?: string
  ): {
    definitions: CustomHookDefinition[];
    consumers: HookConsumer[];
    hasDynamicAccess: boolean;
    unsafeReasons: string[];
  } {
    const defs = this.definitions.filter(d => d.hookName === hookName);
    const cons = this.consumers.filter(c => c.hookName === hookName);

    const hasDynamic = cons.some(c => c.hasDynamicPropertyAccess) ||
      this.unsafePatterns.some(u => u.hookName === hookName);

    const unsafeReasons: string[] = [];
    if (hasDynamic) {
      unsafeReasons.push(
        `DYNAMIC_HOOK_PROPERTY_ACCESS: Return value of custom hook "${hookName}" is accessed via dynamic computed key result[key]. Cannot statically guarantee completeness.`
      );
    }

    const matchedConsumers = propertyName
      ? cons.filter(c => c.destructuredProperties.includes(propertyName) || c.destructuredProperties.includes("*"))
      : cons;

    return {
      definitions: defs,
      consumers: matchedConsumers,
      hasDynamicAccess: hasDynamic,
      unsafeReasons,
    };
  }

  public getUnsafePatterns(): UnsafeHookPattern[] {
    return this.unsafePatterns;
  }

  private analyzeFile(filePath: string) {
    const sourceFile = this.symbolResolver.getSourceFile(filePath);
    if (!sourceFile) return;

    const scopeStack: string[] = ["top_level"];

    const visit = (node: ts.Node) => {
      let pushedScope = false;

      // 1. Hook Definitions (Functions named use[A-Z]...)
      if (ts.isFunctionDeclaration(node) && node.name && /^use[A-Z]/.test(node.name.text)) {
        const hookName = node.name.text;
        scopeStack.push(hookName);
        pushedScope = true;
        this.extractHookReturnShape(node.body, hookName, filePath, sourceFile, node.getStart(sourceFile));
      } else if (
        ts.isVariableDeclaration(node) &&
        ts.isIdentifier(node.name) &&
        /^use[A-Z]/.test(node.name.text) &&
        node.initializer &&
        (ts.isArrowFunction(node.initializer) || ts.isFunctionExpression(node.initializer))
      ) {
        const hookName = node.name.text;
        scopeStack.push(hookName);
        pushedScope = true;
        this.extractHookReturnShape(node.initializer.body, hookName, filePath, sourceFile, node.getStart(sourceFile));
      } else if (ts.isFunctionDeclaration(node) && node.name && /^[A-Z]/.test(node.name.text)) {
        scopeStack.push(node.name.text);
        pushedScope = true;
      }

      const currentScope = scopeStack[scopeStack.length - 1];

      // 2. Hook Invocations & Consumer Destructuring: const { tasks } = useTasks() or const [t, setT] = useTasks()
      if (ts.isVariableDeclaration(node) && node.initializer && ts.isCallExpression(node.initializer)) {
        const callExpr = node.initializer.expression;
        const callText = callExpr.getText(sourceFile);

        if (/^use[A-Z]/.test(callText) && callText !== "useContext" && callText !== "useState" && callText !== "useEffect" && callText !== "useMemo" && callText !== "useCallback" && callText !== "useRef") {
          const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
          const destructuredProps: string[] = [];
          const tupleIndices: number[] = [];

          // Object destructuring: const { tasks, loading } = useTasks()
          if (ts.isObjectBindingPattern(node.name)) {
            for (const elem of node.name.elements) {
              const prop = elem.propertyName ? elem.propertyName.getText(sourceFile) : elem.name.getText(sourceFile);
              destructuredProps.push(prop);
            }
          }
          // Array / Tuple destructuring: const [items, setItems] = useTasks()
          else if (ts.isArrayBindingPattern(node.name)) {
            node.name.elements.forEach((elem, idx) => {
              if (ts.isBindingElement(elem)) {
                tupleIndices.push(idx);
                destructuredProps.push(elem.name.getText(sourceFile));
              }
            });
          }
          // Whole variable consumer: const taskState = useTasks()
          else if (ts.isIdentifier(node.name)) {
            const varName = node.name.text;
            const parentBlock = this.findEnclosingBlock(node);
            if (parentBlock) {
              this.scanHookPropertyAccesses(parentBlock, varName, sourceFile, filePath, callText, destructuredProps);
            }
            if (destructuredProps.length === 0) {
              destructuredProps.push("*");
            }
          }

          this.consumers.push({
            hookName: callText,
            consumerFile: filePath,
            consumerComponent: currentScope,
            destructuredProperties: destructuredProps,
            destructuredTupleIndices: tupleIndices,
            hasDynamicPropertyAccess: false,
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
  }

  private extractHookReturnShape(
    body: ts.Node | undefined,
    hookName: string,
    filePath: string,
    sourceFile: ts.SourceFile,
    startPos: number
  ) {
    if (!body) return;

    let returnKind: "OBJECT" | "TUPLE" | "PRIMITIVE" | "UNKNOWN" = "UNKNOWN";
    const returnedProps: string[] = [];
    const tupleElems: string[] = [];
    const { line, character } = sourceFile.getLineAndCharacterOfPosition(startPos);

    const visitReturns = (n: ts.Node) => {
      if (ts.isReturnStatement(n) && n.expression) {
        let expr = n.expression;
        // Strip 'as const' expression
        if (ts.isAsExpression(expr)) {
          expr = expr.expression;
        }

        // Object Return: return { tasks, loading, updateTask }
        if (ts.isObjectLiteralExpression(expr)) {
          returnKind = "OBJECT";
          for (const prop of expr.properties) {
            if (ts.isShorthandPropertyAssignment(prop)) {
              returnedProps.push(prop.name.text);
            } else if (ts.isPropertyAssignment(prop) && ts.isIdentifier(prop.name)) {
              returnedProps.push(prop.name.text);
            }
          }
        }
        // Tuple Return: return [tasks, setTasks]
        else if (ts.isArrayLiteralExpression(expr)) {
          returnKind = "TUPLE";
          for (const elem of expr.elements) {
            tupleElems.push(elem.getText(sourceFile));
          }
        }
      }
      ts.forEachChild(n, visitReturns);
    };

    visitReturns(body);

    this.definitions.push({
      hookName,
      filePath,
      returnKind,
      returnedProperties: returnedProps,
      returnedTupleElements: tupleElems,
      line: line + 1,
      col: character + 1,
    });
  }

  private scanHookPropertyAccesses(
    block: ts.Node,
    varName: string,
    sourceFile: ts.SourceFile,
    filePath: string,
    hookName: string,
    destructuredProps: string[]
  ) {
    const visitAccess = (node: ts.Node) => {
      // Direct access: taskState.tasks
      if (ts.isPropertyAccessExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === varName) {
        const prop = node.name.text;
        if (!destructuredProps.includes(prop)) {
          destructuredProps.push(prop);
        }
      }

      // Computed access: taskState[dynamicKey]
      if (ts.isElementAccessExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === varName) {
        this.unsafePatterns.push({
          filePath,
          hookName,
          reason: `Dynamic element access on hook result "${varName}[${node.argumentExpression.getText(sourceFile)}]" in ${filePath}`,
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

  private linkHookEdges() {
    for (const def of this.definitions) {
      for (const prop of def.returnedProperties) {
        this.edges.push({
          fromFile: def.filePath,
          fromComponent: def.hookName,
          toFile: def.filePath,
          hookName: def.hookName,
          propertyName: prop,
          edgeType: "RETURNS_HOOK_VALUE",
          line: def.line,
          col: def.col,
        });
      }
    }

    for (const cons of this.consumers) {
      const def = this.definitions.find(d => d.hookName === cons.hookName);
      if (def) {
        for (const prop of cons.destructuredProperties) {
          this.edges.push({
            fromFile: cons.consumerFile,
            fromComponent: cons.consumerComponent,
            toFile: def.filePath,
            hookName: cons.hookName,
            propertyName: prop,
            edgeType: "CONSUMES_HOOK_VALUE",
            line: cons.line,
            col: cons.col,
          });
        }
      }
    }
  }
}
