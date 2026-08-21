/**
 * ASTSymbolPatchPlanner
 *
 * Converts requested existing-symbol modifications into exact AST-local patch operations,
 * ensuring bit-for-bit preservation of surrounding code, comments, and formatting.
 * Validates patch-plan convergence against the closed ImpactSet.
 */

import ts from "typescript";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { ImpactClosureResult } from "./impact-closure-engine.js";

export type PatchPlanValidationStatus =
  | "CLOSED_AND_CONVERGENT"
  | "MISSING_IMPACTED_FILE"
  | "UNAUTHORIZED_FILE_IN_PATCH"
  | "PATCH_TARGET_INVALID"
  | "IMPACT_SET_NOT_CLOSED";

export interface AstPatchOperation {
  filePath: string;
  targetSymbolName: string;
  originalSnippet: string;
  replacementSnippet: string;
  startPos: number;
  endPos: number;
  description: string;
}

export interface SymbolPatchPlan {
  status: PatchPlanValidationStatus;
  targetSymbol: string;
  definitionFile: string;
  impactedFiles: string[];
  plannedFiles: string[];
  patches: AstPatchOperation[];
  validationError?: string;
}

export class ASTSymbolPatchPlanner {
  private readonly projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot.replace(/\\/g, "/");
  }

  /**
   * Validates whether the planned patch files match the required impact closure exactly.
   */
  public static validatePatchPlan(
    impactClosure: ImpactClosureResult,
    plannedFilePaths: string[]
  ): { status: PatchPlanValidationStatus; error?: string } {
    if (impactClosure.status !== "CLOSED") {
      return {
        status: "IMPACT_SET_NOT_CLOSED",
        error: "ABORT: Impact closure status is not CLOSED. Cannot safely plan patches.",
      };
    }

    const requiredFiles = new Set<string>([
      ...impactClosure.mustChange,
      ...impactClosure.mayChange,
    ]);

    const plannedFiles = new Set<string>(plannedFilePaths.map(p => p.replace(/\\/g, "/").replace(/^(\/|\\)+/, "")));

    // 1. Check for missing required files
    for (const req of requiredFiles) {
      if (!plannedFiles.has(req)) {
        return {
          status: "MISSING_IMPACTED_FILE",
          error: `MISSING_IMPACTED_FILE: Required impacted file "${req}" is missing from patch plan.`,
        };
      }
    }

    // 2. Check for unauthorized extra files
    for (const plan of plannedFiles) {
      if (!requiredFiles.has(plan)) {
        return {
          status: "UNAUTHORIZED_FILE_IN_PATCH",
          error: `UNAUTHORIZED_FILE_IN_PATCH: File "${plan}" is not in the required impact closure set.`,
        };
      }
    }

    return { status: "CLOSED_AND_CONVERGENT" };
  }

  /**
   * Plans an AST-local function or method body update in the definition file.
   */
  public planFunctionUpdate(
    filePath: string,
    functionName: string,
    newBodyOrSignature: (originalNodeText: string, node: ts.FunctionDeclaration | ts.MethodDeclaration | ts.VariableDeclaration) => string,
    description: string = `Update ${functionName}`
  ): AstPatchOperation | null {
    const relPath = this.toRelative(filePath);
    const fullPath = resolve(this.projectRoot, relPath);
    if (!existsSync(fullPath)) return null;

    const content = readFileSync(fullPath, "utf8");
    const sourceFile = ts.createSourceFile(
      relPath,
      content,
      ts.ScriptTarget.Latest,
      true,
      relPath.endsWith(".tsx") || relPath.endsWith(".jsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS
    );

    let targetOp: AstPatchOperation | null = null;

    const visit = (node: ts.Node) => {
      if (targetOp) return;

      if (ts.isFunctionDeclaration(node) && node.name && node.name.text === functionName) {
        const start = node.getStart(sourceFile);
        const end = node.getEnd();
        const originalSnippet = content.slice(start, end);
        const replacementSnippet = newBodyOrSignature(originalSnippet, node);

        targetOp = {
          filePath: relPath,
          targetSymbolName: functionName,
          originalSnippet,
          replacementSnippet,
          startPos: start,
          endPos: end,
          description,
        };
        return;
      }

      if (ts.isMethodDeclaration(node) && ts.isIdentifier(node.name) && node.name.text === functionName) {
        const start = node.getStart(sourceFile);
        const end = node.getEnd();
        const originalSnippet = content.slice(start, end);
        const replacementSnippet = newBodyOrSignature(originalSnippet, node);

        targetOp = {
          filePath: relPath,
          targetSymbolName: functionName,
          originalSnippet,
          replacementSnippet,
          startPos: start,
          endPos: end,
          description,
        };
        return;
      }

      if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.name.text === functionName) {
        const start = node.getStart(sourceFile);
        const end = node.getEnd();
        const originalSnippet = content.slice(start, end);
        const replacementSnippet = newBodyOrSignature(originalSnippet, node);

        targetOp = {
          filePath: relPath,
          targetSymbolName: functionName,
          originalSnippet,
          replacementSnippet,
          startPos: start,
          endPos: end,
          description,
        };
        return;
      }

      if (ts.isTypeAliasDeclaration(node) && ts.isIdentifier(node.name) && node.name.text === functionName) {
        const start = node.getStart(sourceFile);
        const end = node.getEnd();
        const originalSnippet = content.slice(start, end);
        const replacementSnippet = newBodyOrSignature(originalSnippet, node as any);

        targetOp = {
          filePath: relPath,
          targetSymbolName: functionName,
          originalSnippet,
          replacementSnippet,
          startPos: start,
          endPos: end,
          description,
        };
        return;
      }

      if (ts.isInterfaceDeclaration(node) && ts.isIdentifier(node.name) && node.name.text === functionName) {
        const start = node.getStart(sourceFile);
        const end = node.getEnd();
        const originalSnippet = content.slice(start, end);
        const replacementSnippet = newBodyOrSignature(originalSnippet, node as any);

        targetOp = {
          filePath: relPath,
          targetSymbolName: functionName,
          originalSnippet,
          replacementSnippet,
          startPos: start,
          endPos: end,
          description,
        };
        return;
      }

      ts.forEachChild(node, visit);
    };

    visit(sourceFile);
    return targetOp;
  }

  /**
   * Plans an AST-local call-site update in a caller file (e.g. updating arguments or component props).
   */
  public planCallSiteUpdate(
    callerFilePath: string,
    calleeSymbolName: string,
    transformCallNode: (originalCallText: string, node: ts.CallExpression | ts.JsxOpeningElement | ts.JsxSelfClosingElement) => string,
    description: string = `Update call sites of ${calleeSymbolName}`
  ): AstPatchOperation[] {
    const relPath = this.toRelative(callerFilePath);
    const fullPath = resolve(this.projectRoot, relPath);
    if (!existsSync(fullPath)) return [];

    const content = readFileSync(fullPath, "utf8");
    const sourceFile = ts.createSourceFile(
      relPath,
      content,
      ts.ScriptTarget.Latest,
      true,
      relPath.endsWith(".tsx") || relPath.endsWith(".jsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS
    );

    const ops: AstPatchOperation[] = [];

    const visit = (node: ts.Node) => {
      // Call Expressions: fn(a, b) or Service.fn(a, b)
      if (ts.isCallExpression(node)) {
        const exprText = node.expression.getText(sourceFile);
        if (exprText === calleeSymbolName || exprText.endsWith(`.${calleeSymbolName}`)) {
          const start = node.getStart(sourceFile);
          const end = node.getEnd();
          const originalSnippet = content.slice(start, end);
          const replacementSnippet = transformCallNode(originalSnippet, node);

          ops.push({
            filePath: relPath,
            targetSymbolName: calleeSymbolName,
            originalSnippet,
            replacementSnippet,
            startPos: start,
            endPos: end,
            description,
          });
        }
      }

      // JSX Component Usages: <Component prop={val} />
      if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
        const tagName = node.tagName.getText(sourceFile);
        if (tagName === calleeSymbolName) {
          const start = node.getStart(sourceFile);
          const end = node.getEnd();
          const originalSnippet = content.slice(start, end);
          const replacementSnippet = transformCallNode(originalSnippet, node);

          ops.push({
            filePath: relPath,
            targetSymbolName: calleeSymbolName,
            originalSnippet,
            replacementSnippet,
            startPos: start,
            endPos: end,
            description,
          });
        }
      }

      ts.forEachChild(node, visit);
    };

    visit(sourceFile);
    return ops;
  }

  /**
   * Plans an AST-safe additive field or model patch to a Prisma schema file (e.g. prisma/schema.prisma).
   */
  public planPrismaModelFieldAddition(
    schemaFilePath: string,
    modelName: string,
    fieldDefinition: string,
    description: string = `Add field to Prisma model ${modelName}`
  ): AstPatchOperation | null {
    const relPath = this.toRelative(schemaFilePath);
    const fullPath = resolve(this.projectRoot, relPath);
    if (!existsSync(fullPath)) return null;

    const content = readFileSync(fullPath, "utf8");
    const modelRegex = new RegExp(`model\\s+${modelName}\\s*\\{([\\s\\S]*?)\\}`, "m");
    const match = content.match(modelRegex);
    if (!match || match.index === undefined) return null;

    const matchIndex = match.index;
    const closingBraceOffset = matchIndex + match[0].lastIndexOf("}");
    const insertionText = `  ${fieldDefinition.trim()}\n`;

    return {
      filePath: relPath,
      targetSymbolName: modelName,
      originalSnippet: "",
      replacementSnippet: insertionText,
      startPos: closingBraceOffset,
      endPos: closingBraceOffset,
      description,
    };
  }

  /**
   * Automatically generates a convergent, multi-layer AST patch plan for an additive field across
   * all files in the required ImpactClosureResult.
   */
  public planFieldPropagation(options: {
    closure: ImpactClosureResult;
    modelName: string;
    fieldName: string;
    prismaFieldDef: string;
    tsType: string;
    defaultValue?: string;
  }): { filePath: string; operations: AstPatchOperation[] }[] {
    const requiredFiles = new Set<string>([
      ...options.closure.mustChange,
      ...options.closure.mayChange,
    ]);

    const patches: { filePath: string; operations: AstPatchOperation[] }[] = [];

    for (const file of requiredFiles) {
      const relPath = this.toRelative(file);
      const fullPath = resolve(this.projectRoot, relPath);
      if (!existsSync(fullPath)) continue;

      const fileContent = readFileSync(fullPath, "utf8");
      const fileOps: AstPatchOperation[] = [];

      // 1. Prisma Schema File
      if (relPath.endsWith(".prisma")) {
        const schemaOp = this.planPrismaModelFieldAddition(
          relPath,
          options.modelName,
          options.prismaFieldDef,
          `Add ${options.fieldName} to Prisma model ${options.modelName}`
        );
        if (schemaOp) fileOps.push(schemaOp);
      }
      // 2. TypeScript Types / DTOs
      else if (relPath.includes("types") || relPath.endsWith(".d.ts")) {
        const typeRegex = new RegExp(`(interface|type)\\s+(${options.modelName}|Create${options.modelName}Dto|Update${options.modelName}Dto)[^\\{=]*(\\{|=|&)`, "g");
        let m: RegExpExecArray | null;
        while ((m = typeRegex.exec(fileContent)) !== null) {
          const typeName = m[2];
          const op = this.planFunctionUpdate(
            relPath,
            typeName,
            (orig) => {
              if (orig.includes(`${options.fieldName}:`) || orig.includes(`${options.fieldName}?:`)) return orig;
              const closingBrace = orig.lastIndexOf("}");
              if (closingBrace === -1) return orig;
              return orig.slice(0, closingBrace) + `  ${options.fieldName}?: ${options.tsType};\n` + orig.slice(closingBrace);
            },
            `Add ${options.fieldName} to ${typeName}`
          );
          if (op) fileOps.push(op);
        }
      }
      // 3. Service Layer
      else if (relPath.includes("service") || relPath.includes("Service")) {
        const serviceOp = this.planFunctionUpdate(
          relPath,
          `create${options.modelName}`,
          (orig) => {
            if (orig.includes(`${options.fieldName}:`)) return orig;
            if (orig.includes("data:")) {
              return orig.replace(/(data:\s*\{[\s\S]*?)(\})/, `$1  ${options.fieldName}: dto.${options.fieldName} !== undefined ? dto.${options.fieldName} : ${options.defaultValue || 'null'},\n  $2`);
            }
            if (orig.includes("const item: " + options.modelName)) {
              return orig.replace(/(const item:\s*[a-zA-Z0-9_]+\s*=\s*\{[\s\S]*?)(\};)/, `$1  ${options.fieldName}: dto.${options.fieldName} !== undefined ? dto.${options.fieldName} : ${options.defaultValue || 'null'},\n  $2`);
            }
            return orig;
          },
          `Update create${options.modelName} to handle ${options.fieldName}`
        );
        if (serviceOp) fileOps.push(serviceOp);
      }
      // 4. Controller Layer
      else if (relPath.includes("controller") || relPath.includes("Controller")) {
        // Controller delegates req.body DTO directly; keep convergent
      }
      // 5. Frontend / UI Form Component
      else if (relPath.includes("components") || relPath.includes("Form") || relPath.includes("View")) {
        if (fileContent.includes("handleSubmit") || fileContent.includes("onSubmit")) {
          const compOp = this.planFunctionUpdate(
            relPath,
            `${options.modelName}Form`,
            (orig) => {
              if (orig.includes(`${options.fieldName}Value`)) return orig;
              return orig
                .replace(/(let\s+[a-zA-Z0-9_]+\s*=\s*[^;]+;\n)/, `$1  let ${options.fieldName}Value = ${options.defaultValue || '""'};\n`)
                .replace(/(props\.onSubmit\(\{[\s\S]*?)(\}\);)/, `$1  ${options.fieldName}: ${options.fieldName}Value,\n    $2`)
                .replace(/(return\s*\{[\s\S]*?render:\s*\(\)\s*=>\s*\(\{[\s\S]*?)(\}\),)/, `$1, ${options.fieldName}: ${options.fieldName}Value $2`)
                .replace(/(return\s*\{[\s\S]*?submit:\s*handleSubmit,)/, `$1\n    set${options.fieldName.charAt(0).toUpperCase() + options.fieldName.slice(1)}: (val: any) => { ${options.fieldName}Value = val; },`);
            },
            `Update ${options.modelName}Form to bind ${options.fieldName}`
          );
          if (compOp) fileOps.push(compOp);
        }
      }

      patches.push({ filePath: relPath, operations: fileOps });
    }

    return patches;
  }

  /**
   * Applies AST patch operations to a file's content in reverse offset order
   * to guarantee zero line/character drift.
   */
  public static applyPatchesToContent(content: string, operations: AstPatchOperation[]): string {
    // Sort descending by startPos to apply from bottom to top
    const sorted = [...operations].sort((a, b) => b.startPos - a.startPos);

    let result = content;
    for (const op of sorted) {
      const before = result.slice(0, op.startPos);
      const after = result.slice(op.endPos);
      result = before + op.replacementSnippet + after;
    }

    return result;
  }

  private toRelative(p: string): string {
    const normalizedProject = this.projectRoot.replace(/\\/g, "/");
    const normalizedP = p.replace(/\\/g, "/");
    if (normalizedP.startsWith(normalizedProject)) {
      return normalizedP.slice(normalizedProject.length).replace(/^(\/|\\)+/, "");
    }
    return normalizedP.replace(/^(\/|\\)+/, "");
  }
}
