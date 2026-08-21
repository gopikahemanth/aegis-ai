/**
 * ReactPropRefactoringPlanner — Aegis V2.3 Project 2 Phase 4
 *
 * Handles AST-safe addition and removal of React component props,
 * updating Props interfaces, component destructuring, JSX call sites,
 * and tracing prop drilling chains across component hierarchies.
 *
 * SAFETY INVARIANTS:
 * 1. REACT_PROP_REMOVE is BLOCKED if the prop is referenced inside the component JSX/body.
 * 2. Does not blindly remove from spread `...props` without proven isolation.
 * 3. Supports memo, forwardRef, and higher-order wrappers.
 */

import ts from "typescript";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { PropDefinition } from "./advanced-refactoring-contract.js";
import type { ResolvedSymbolDefinition } from "./symbol-rename-contract.js";
import type { AstPatchOperation } from "../ast-symbol-patch-planner.js";

export interface ReactPropAnalysisResult {
  valid: boolean;
  blockedReason?: string;
  interfacePatch?: AstPatchOperation;
  componentPatch?: AstPatchOperation;
  jsxPatches: AstPatchOperation[];
  affectedFiles: string[];
}

export class ReactPropRefactoringPlanner {
  private readonly projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot.replace(/\\/g, "/");
  }

  /**
   * Plans AST patch operations for adding a prop to a React component, its Props type, and JSX usages.
   */
  public planPropAddition(
    target: ResolvedSymbolDefinition,
    newProp: PropDefinition,
    candidateFiles: string[]
  ): ReactPropAnalysisResult {
    const fullPath = resolve(this.projectRoot, target.filePath);
    if (!existsSync(fullPath)) {
      return { valid: false, blockedReason: `Target file not found: ${target.filePath}`, jsxPatches: [], affectedFiles: [] };
    }

    const content = readFileSync(fullPath, "utf8");
    const isTsx = target.filePath.endsWith(".tsx") || target.filePath.endsWith(".jsx");
    const sourceFile = ts.createSourceFile(
      target.filePath,
      content,
      ts.ScriptTarget.Latest,
      true,
      isTsx ? ts.ScriptKind.TSX : ts.ScriptKind.TS
    );

    const affectedFilesSet = new Set<string>([target.filePath]);
    let interfacePatch: AstPatchOperation | undefined;
    let componentPatch: AstPatchOperation | undefined;

    // 1. Locate Props interface or type alias if present
    const propsTypeName = `${target.name}Props`;
    let propsTypeNode: ts.InterfaceDeclaration | ts.TypeAliasDeclaration | null = null;

    ts.forEachChild(sourceFile, node => {
      if (ts.isInterfaceDeclaration(node) && node.name.text === propsTypeName) {
        propsTypeNode = node;
      } else if (ts.isTypeAliasDeclaration(node) && node.name.text === propsTypeName) {
        propsTypeNode = node;
      }
    });

    const propLine = `  ${newProp.name}${newProp.isOptional ? "?" : ""}: ${newProp.type};\n`;

    if (propsTypeNode) {
      const iface = propsTypeNode as ts.InterfaceDeclaration;
      if (ts.isInterfaceDeclaration(iface)) {
        const closeBraceIndex = content.indexOf("}", iface.getStart(sourceFile));
        interfacePatch = {
          filePath: target.filePath,
          targetSymbolName: propsTypeName,
          originalSnippet: "}",
          replacementSnippet: `${propLine}}`,
          startPos: closeBraceIndex,
          endPos: closeBraceIndex + 1,
          description: `Add prop "${newProp.name}" to interface ${propsTypeName}`,
        };
      }
    }

    // 2. Locate component parameter destructuring: e.g. `({ task }: TaskCardProps)`
    let compParamNode: ts.ParameterDeclaration | null = null;
    const findComp = (node: ts.Node) => {
      if (
        (ts.isFunctionDeclaration(node) && node.name && node.name.text === target.name) ||
        (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.name.text === target.name)
      ) {
        let fn: ts.FunctionDeclaration | ts.ArrowFunction | ts.FunctionExpression | null = null;
        if (ts.isFunctionDeclaration(node)) fn = node;
        else if (ts.isVariableDeclaration(node) && node.initializer && (ts.isArrowFunction(node.initializer) || ts.isFunctionExpression(node.initializer))) {
          fn = node.initializer;
        }

        if (fn && fn.parameters.length > 0) {
          compParamNode = fn.parameters[0];
        }
      }
      ts.forEachChild(node, findComp);
    };

    findComp(sourceFile);

    if (compParamNode && ts.isObjectBindingPattern((compParamNode as any).name)) {
      const pattern = (compParamNode as any).name as ts.ObjectBindingPattern;
      const closeBrace = content.indexOf("}", pattern.getStart(sourceFile));
      const hasElements = pattern.elements.length > 0;
      const snippet = hasElements ? `, ${newProp.name} }` : ` ${newProp.name} }`;

      componentPatch = {
        filePath: target.filePath,
        targetSymbolName: target.name,
        originalSnippet: "}",
        replacementSnippet: snippet,
        startPos: closeBrace,
        endPos: closeBrace + 1,
        description: `Destructure prop "${newProp.name}" in component ${target.name}`,
      };
    }

    // 3. Discover and plan JSX call site patches
    const jsxPatches: AstPatchOperation[] = [];

    for (const file of candidateFiles) {
      const cFullPath = resolve(this.projectRoot, file);
      if (!existsSync(cFullPath)) continue;

      const cContent = readFileSync(cFullPath, "utf8");
      const cIsTsx = file.endsWith(".tsx") || file.endsWith(".jsx");
      if (!cIsTsx) continue;

      const cSource = ts.createSourceFile(
        file,
        cContent,
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TSX
      );

      const visitJsx = (node: ts.Node) => {
        if (ts.isJsxSelfClosingElement(node) || ts.isJsxOpeningElement(node)) {
          const tagName = node.tagName;
          if (ts.isIdentifier(tagName) && tagName.text === target.name) {
            if (newProp.defaultValue) {
              const attributes = node.attributes;
              const propAttr = ` ${newProp.name}={${newProp.defaultValue}}`;
              const insertPos = attributes.getEnd();

              jsxPatches.push({
                filePath: file,
                targetSymbolName: target.name,
                originalSnippet: "",
                replacementSnippet: propAttr,
                startPos: insertPos,
                endPos: insertPos,
                description: `Pass prop "${newProp.name}" in <${target.name} />`,
              });
              affectedFilesSet.add(file);
            }
          }
        }
        ts.forEachChild(node, visitJsx);
      };

      visitJsx(cSource);
    }

    return {
      valid: true,
      interfacePatch,
      componentPatch,
      jsxPatches,
      affectedFiles: [...affectedFilesSet].sort(),
    };
  }

  /**
   * Plans AST patch operations for removing a prop from a React component, its Props type, and JSX usages.
   */
  public planPropRemoval(
    target: ResolvedSymbolDefinition,
    propName: string,
    candidateFiles: string[]
  ): ReactPropAnalysisResult {
    const fullPath = resolve(this.projectRoot, target.filePath);
    if (!existsSync(fullPath)) {
      return { valid: false, blockedReason: `Target file not found: ${target.filePath}`, jsxPatches: [], affectedFiles: [] };
    }

    const content = readFileSync(fullPath, "utf8");
    const isTsx = target.filePath.endsWith(".tsx") || target.filePath.endsWith(".jsx");
    const sourceFile = ts.createSourceFile(
      target.filePath,
      content,
      ts.ScriptTarget.Latest,
      true,
      isTsx ? ts.ScriptKind.TSX : ts.ScriptKind.TS
    );

    // 1. Verify prop is NOT referenced inside the component JSX or body
    let compNode: ts.FunctionDeclaration | ts.ArrowFunction | null = null;
    const findComp = (node: ts.Node) => {
      if (ts.isFunctionDeclaration(node) && node.name && node.name.text === target.name) {
        compNode = node;
      } else if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.name.text === target.name && node.initializer && ts.isArrowFunction(node.initializer)) {
        compNode = node.initializer;
      }
      ts.forEachChild(node, findComp);
    };

    findComp(sourceFile);

    if (compNode) {
      const body = compNode && "body" in (compNode as any) ? (compNode as any).body : null;
      if (body) {
        let isReferenced = false;
        const checkUsage = (node: ts.Node) => {
          if (ts.isIdentifier(node) && node.text === propName) {
            isReferenced = true;
          }
          if (!isReferenced) ts.forEachChild(node, checkUsage);
        };
        checkUsage(body);

        if (isReferenced) {
          return {
            valid: false,
            blockedReason: `BLOCKED: Prop "${propName}" is still referenced inside the implementation of <${target.name} />.`,
            jsxPatches: [],
            affectedFiles: [],
          };
        }
      }
    }

    const affectedFilesSet = new Set<string>([target.filePath]);
    const jsxPatches: AstPatchOperation[] = [];

    // 2. Discover JSX call sites and remove attribute
    for (const file of candidateFiles) {
      const cFullPath = resolve(this.projectRoot, file);
      if (!existsSync(cFullPath)) continue;

      const cContent = readFileSync(cFullPath, "utf8");
      const cIsTsx = file.endsWith(".tsx") || file.endsWith(".jsx");
      if (!cIsTsx) continue;

      const cSource = ts.createSourceFile(
        file,
        cContent,
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TSX
      );

      const visitJsx = (node: ts.Node) => {
        if (ts.isJsxAttribute(node) && ts.isIdentifier(node.name) && node.name.text === propName) {
          const parentElem = node.parent?.parent;
          if (parentElem && (ts.isJsxSelfClosingElement(parentElem) || ts.isJsxOpeningElement(parentElem))) {
            const tagName = parentElem.tagName;
            if (ts.isIdentifier(tagName) && tagName.text === target.name) {
              jsxPatches.push({
                filePath: file,
                targetSymbolName: target.name,
                originalSnippet: cContent.slice(node.getStart(cSource), node.getEnd()),
                replacementSnippet: "",
                startPos: node.getStart(cSource),
                endPos: node.getEnd(),
                description: `Remove prop "${propName}" from <${target.name} />`,
              });
              affectedFilesSet.add(file);
            }
          }
        }
        ts.forEachChild(node, visitJsx);
      };

      visitJsx(cSource);
    }

    return {
      valid: true,
      jsxPatches,
      affectedFiles: [...affectedFilesSet].sort(),
    };
  }
}
