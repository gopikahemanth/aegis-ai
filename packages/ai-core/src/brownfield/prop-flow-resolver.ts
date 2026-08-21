/**
 * PropFlowResolver
 *
 * Traverses TypeScript ASTs to construct a deterministic React prop and callback dependency graph,
 * mapping multi-tier prop drilling, callback forwarding, and safe halting on prop spreads or dynamic callbacks.
 */

import ts from "typescript";
import { SymbolReferenceResolver, type FileAstSummary } from "./symbol-reference-resolver.js";

export type PropFlowEdgeType =
  | "PASSES_PROP"
  | "FORWARDS_PROP"
  | "CONSUMES_PROP"
  | "PASSES_CALLBACK"
  | "INVOKES_CALLBACK"
  | "HANDLES_CALLBACK";

export interface ComponentPropDeclaration {
  componentName: string;
  filePath: string;
  propName: string;
  typeName?: string;
  isOptional: boolean;
  defaultValue?: string;
  isCallback: boolean;
  line: number;
  col: number;
}

export interface JsxPropUsage {
  parentFile: string;
  parentComponent: string;
  targetComponent: string;
  targetFile?: string;
  propName: string;
  valueExpression: string;
  isSpread: boolean;
  isCallback: boolean;
  line: number;
  col: number;
}

export interface PropFlowEdge {
  fromFile: string;
  fromComponent: string;
  toFile: string;
  toComponent: string;
  propName: string;
  edgeType: PropFlowEdgeType;
  line: number;
  col: number;
}

export interface UnsafeReactPattern {
  filePath: string;
  componentName: string;
  patternType: "UNSAFE_PROP_SPREAD" | "DYNAMIC_CALLBACK" | "COMPUTED_PROP_ACCESS";
  snippet: string;
  reason: string;
}

export class PropFlowResolver {
  private readonly symbolResolver: SymbolReferenceResolver;
  private readonly declarations: Map<string, ComponentPropDeclaration[]> = new Map();
  private readonly usages: JsxPropUsage[] = [];
  private readonly edges: PropFlowEdge[] = [];
  private readonly unsafePatterns: UnsafeReactPattern[] = [];

  constructor(symbolResolver: SymbolReferenceResolver) {
    this.symbolResolver = symbolResolver;
  }

  /**
   * Analyzes all React components and JSX render sites across the project.
   */
  public analyzeProject(): {
    edges: PropFlowEdge[];
    declarations: Map<string, ComponentPropDeclaration[]>;
    usages: JsxPropUsage[];
    unsafePatterns: UnsafeReactPattern[];
  } {
    const fileSummaries = this.symbolResolver.getAllSummaries();

    for (const [filePath] of fileSummaries) {
      this.analyzeFile(filePath);
    }

    // Resolve component definitions and build directional prop flow edges
    this.linkPropFlowEdges();

    return {
      edges: this.edges,
      declarations: this.declarations,
      usages: this.usages,
      unsafePatterns: this.unsafePatterns,
    };
  }

  /**
   * Finds all direct and indirect forwarders / handlers of a component's prop or callback.
   */
  public findPropTrace(
    targetFile: string,
    targetComponent: string,
    propName: string
  ): {
    forwardingLayers: PropFlowEdge[];
    parentHandlers: PropFlowEdge[];
    renderSites: JsxPropUsage[];
    hasUnsafeSpread: boolean;
    unsafeReasons: string[];
  } {
    const targetRel = targetFile.replace(/\\/g, "/").replace(/^(\/|\\)+/, "");

    const matchingUsages = this.usages.filter(
      u => u.targetFile === targetRel && u.targetComponent === targetComponent
    );

    const hasUnsafeSpread = matchingUsages.some(u => u.isSpread) ||
      this.unsafePatterns.some(p => p.filePath === targetRel && p.componentName === targetComponent);

    const unsafeReasons: string[] = [];
    if (hasUnsafeSpread) {
      unsafeReasons.push(
        `UNSAFE_PROP_SPREAD: Component "${targetComponent}" in "${targetRel}" receives or forwards props via spread {...props}. Cannot statically prove prop completeness.`
      );
    }

    const forwardingLayers = this.edges.filter(
      e => (e.toFile === targetRel && e.toComponent === targetComponent && e.propName === propName) ||
           (e.fromFile === targetRel && e.fromComponent === targetComponent && e.propName === propName)
    );

    const parentHandlers = this.edges.filter(
      e => e.toFile === targetRel && e.toComponent === targetComponent && e.propName === propName && e.edgeType === "HANDLES_CALLBACK"
    );

    return {
      forwardingLayers,
      parentHandlers,
      renderSites: matchingUsages,
      hasUnsafeSpread,
      unsafeReasons,
    };
  }

  public getUnsafePatterns(): UnsafeReactPattern[] {
    return this.unsafePatterns;
  }

  public getEdges(): PropFlowEdge[] {
    return this.edges;
  }

  private analyzeFile(filePath: string) {
    const sourceFile = this.symbolResolver.getSourceFile(filePath);
    if (!sourceFile) return;

    const fileProps: ComponentPropDeclaration[] = [];
    const scopeStack: { name: string; kind: string }[] = [{ name: "top_level", kind: "module" }];

    const visit = (node: ts.Node) => {
      let pushedScope = false;

      // 1. Component Declarations (Functions, Arrow Functions)
      if (ts.isFunctionDeclaration(node) && node.name && /^[A-Z]/.test(node.name.text)) {
        const compName = node.name.text;
        scopeStack.push({ name: compName, kind: "component" });
        pushedScope = true;
        this.extractDeclaredProps(node.parameters, compName, filePath, sourceFile, fileProps);
      } else if (
        ts.isVariableDeclaration(node) &&
        ts.isIdentifier(node.name) &&
        /^[A-Z]/.test(node.name.text) &&
        node.initializer &&
        (ts.isArrowFunction(node.initializer) || ts.isFunctionExpression(node.initializer))
      ) {
        const compName = node.name.text;
        scopeStack.push({ name: compName, kind: "component" });
        pushedScope = true;
        this.extractDeclaredProps(node.initializer.parameters, compName, filePath, sourceFile, fileProps);
      }

      const currentScope = scopeStack[scopeStack.length - 1];

      // 2. JSX Elements: <Component prop={val} {...props} />
      if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
        const tagName = node.tagName.getText(sourceFile);
        if (/^[A-Z]/.test(tagName)) {
          this.extractJsxAttributes(node.attributes, tagName, currentScope.name, filePath, sourceFile);
        }
      }

      ts.forEachChild(node, visit);

      if (pushedScope) {
        scopeStack.pop();
      }
    };

    visit(sourceFile);
    this.declarations.set(filePath, fileProps);
  }

  private extractDeclaredProps(
    parameters: ts.NodeArray<ts.ParameterDeclaration>,
    componentName: string,
    filePath: string,
    sourceFile: ts.SourceFile,
    fileProps: ComponentPropDeclaration[]
  ) {
    if (parameters.length === 0) return;
    const firstParam = parameters[0];

    // Destructured props: function Component({ task, compact = false, onUpdate }: Props)
    if (ts.isObjectBindingPattern(firstParam.name)) {
      for (const element of firstParam.name.elements) {
        const propName = element.propertyName ? element.propertyName.getText(sourceFile) : element.name.getText(sourceFile);
        const defaultValue = element.initializer ? element.initializer.getText(sourceFile) : undefined;
        const isCallback = /^on[A-Z]/.test(propName) || propName.includes("Click") || propName.includes("Change");
        const { line, character } = sourceFile.getLineAndCharacterOfPosition(element.getStart(sourceFile));

        fileProps.push({
          componentName,
          filePath,
          propName,
          isOptional: !!defaultValue || (firstParam.type?.getText(sourceFile).includes(`${propName}?`) ?? false),
          defaultValue,
          isCallback,
          line: line + 1,
          col: character + 1,
        });
      }
    }
  }

  private extractJsxAttributes(
    attributes: ts.JsxAttributes,
    targetComponent: string,
    parentComponent: string,
    parentFile: string,
    sourceFile: ts.SourceFile
  ) {
    for (const prop of attributes.properties) {
      const { line, character } = sourceFile.getLineAndCharacterOfPosition(prop.getStart(sourceFile));

      // Spread attribute: <Component {...props} />
      if (ts.isJsxSpreadAttribute(prop)) {
        const expr = prop.expression.getText(sourceFile);
        this.usages.push({
          parentFile,
          parentComponent,
          targetComponent,
          propName: "*",
          valueExpression: expr,
          isSpread: true,
          isCallback: false,
          line: line + 1,
          col: character + 1,
        });

        this.unsafePatterns.push({
          filePath: parentFile,
          componentName: parentComponent,
          patternType: "UNSAFE_PROP_SPREAD",
          snippet: `<${targetComponent} ${prop.getText(sourceFile)} />`,
          reason: `Unsafe prop spread on <${targetComponent} ... /> prevents exact static prop-flow derivation.`,
        });
        continue;
      }

      // Explicit JSX attribute: <Component propName={val} />
      if (ts.isJsxAttribute(prop) && ts.isIdentifier(prop.name)) {
        const propName = prop.name.text;
        const isCallback = /^on[A-Z]/.test(propName) || propName.includes("Click") || propName.includes("Change");
        const valueExpr = prop.initializer ? prop.initializer.getText(sourceFile) : "true";

        // Check for computed/dynamic callback access: e.g. onTaskUpdated={handlers[key]}
        if (isCallback && prop.initializer && ts.isJsxExpression(prop.initializer) && prop.initializer.expression) {
          if (ts.isElementAccessExpression(prop.initializer.expression)) {
            this.unsafePatterns.push({
              filePath: parentFile,
              componentName: parentComponent,
              patternType: "DYNAMIC_CALLBACK",
              snippet: prop.getText(sourceFile),
              reason: `Dynamic callback access on prop "${propName}" prevents static caller resolution.`,
            });
          }
        }

        this.usages.push({
          parentFile,
          parentComponent,
          targetComponent,
          propName,
          valueExpression: valueExpr,
          isSpread: false,
          isCallback,
          line: line + 1,
          col: character + 1,
        });
      }
    }
  }

  private linkPropFlowEdges() {
    for (const usage of this.usages) {
      // Resolve target component source file
      const summary = this.symbolResolver.getSummary(usage.parentFile);
      if (!summary) continue;

      for (const imp of summary.imports) {
        if (!imp.resolvedSourceFile) continue;
        if (imp.localAlias === usage.targetComponent || imp.importedName === usage.targetComponent) {
          usage.targetFile = imp.resolvedSourceFile;
          break;
        }
      }

      if (!usage.targetFile) {
        // Check if declared locally
        const localProps = this.declarations.get(usage.parentFile);
        if (localProps && localProps.some(p => p.componentName === usage.targetComponent)) {
          usage.targetFile = usage.parentFile;
        }
      }

      if (usage.targetFile && !usage.isSpread) {
        let edgeType: PropFlowEdgeType = "PASSES_PROP";
        if (usage.isCallback) {
          edgeType = usage.valueExpression.includes("handle") || usage.valueExpression.includes("on")
            ? "HANDLES_CALLBACK"
            : "PASSES_CALLBACK";
        }

        this.edges.push({
          fromFile: usage.parentFile,
          fromComponent: usage.parentComponent,
          toFile: usage.targetFile,
          toComponent: usage.targetComponent,
          propName: usage.propName,
          edgeType,
          line: usage.line,
          col: usage.col,
        });
      }
    }
  }
}
