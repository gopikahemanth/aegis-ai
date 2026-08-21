/**
 * RuntimeSchemaPatchPlanner — Aegis V2.3 Project 2 Phase 7.1
 *
 * Generates exact AST patch operations for Zod validation schemas and
 * corresponding TypeScript interfaces simultaneously.
 */

import ts from "typescript";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { ContractDefinition } from "../contract-refactoring/contract-refactoring-contract.js";
import type { RuntimeSchemaDefinition } from "./runtime-contract-model.js";
import type { AstPatchOperation } from "../ast-symbol-patch-planner.js";

export interface SchemaPatchResult {
  valid: boolean;
  blockedReason?: string;
  patches: AstPatchOperation[];
  affectedFiles: string[];
}

export class RuntimeSchemaPatchPlanner {
  private readonly projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot.replace(/\\/g, "/");
  }

  /**
   * Plans simultaneous AST patches for field addition to both interface and Zod schema.
   */
  public planFieldAddition(
    contract: ContractDefinition | null,
    schema: RuntimeSchemaDefinition,
    field: { name: string; type: string; zodTypeString?: string; isOptional?: boolean }
  ): SchemaPatchResult {
    const patches: AstPatchOperation[] = [];
    const affectedFilesSet = new Set<string>([schema.filePath]);

    // 1. Patch Zod Schema
    const schemaFullPath = resolve(this.projectRoot, schema.filePath);
    if (existsSync(schemaFullPath)) {
      const content = readFileSync(schemaFullPath, "utf8");
      const isTsx = schema.filePath.endsWith(".tsx") || schema.filePath.endsWith(".jsx");
      const sf = ts.createSourceFile(
        schema.filePath,
        content,
        ts.ScriptTarget.Latest,
        true,
        isTsx ? ts.ScriptKind.TSX : ts.ScriptKind.TS
      );

      // Find z.object({ ... }) within the schema declaration
      let insertPos = -1;
      const findObject = (node: ts.Node) => {
        if (
          ts.isVariableDeclaration(node) &&
          ts.isIdentifier(node.name) &&
          node.name.text === schema.schemaName
        ) {
          if (node.initializer) {
            const objText = node.initializer.getText(sf);
            const closeBraceIndex = content.lastIndexOf("}", node.initializer.getEnd());
            if (closeBraceIndex !== -1) {
              insertPos = closeBraceIndex;
            }
          }
        }
        ts.forEachChild(node, findObject);
      };
      findObject(sf);

      if (insertPos !== -1) {
        const zodType = field.zodTypeString || this.mapTsToZodType(field.type, Boolean(field.isOptional));
        const schemaSnippet = `  ${field.name}: ${zodType},\n`;

        patches.push({
          filePath: schema.filePath,
          targetSymbolName: schema.schemaName,
          originalSnippet: "}",
          replacementSnippet: `${schemaSnippet}}`,
          startPos: insertPos,
          endPos: insertPos + 1,
          description: `Add field "${field.name}" to Zod schema ${schema.schemaName}`,
        });
      }
    }

    // 2. Patch TypeScript interface if separate from z.infer
    if (contract && contract.filePath && contract.fields && contract.fields.length > 0) {
      const contractFullPath = resolve(this.projectRoot, contract.filePath);
      if (existsSync(contractFullPath)) {
        const cContent = readFileSync(contractFullPath, "utf8");
        const isTsx = contract.filePath.endsWith(".tsx") || contract.filePath.endsWith(".jsx");
        const cSf = ts.createSourceFile(
          contract.filePath,
          cContent,
          ts.ScriptTarget.Latest,
          true,
          isTsx ? ts.ScriptKind.TSX : ts.ScriptKind.TS
        );

        let cInsertPos = -1;
        ts.forEachChild(cSf, node => {
          if (ts.isInterfaceDeclaration(node) && node.name.text === contract.symbolName) {
            cInsertPos = cContent.indexOf("}", node.getStart(cSf));
          }
        });

        if (cInsertPos !== -1) {
          const tsSnippet = `  ${field.name}${field.isOptional ? "?" : ""}: ${field.type};\n`;
          patches.push({
            filePath: contract.filePath,
            targetSymbolName: contract.symbolName,
            originalSnippet: "}",
            replacementSnippet: `${tsSnippet}}`,
            startPos: cInsertPos,
            endPos: cInsertPos + 1,
            description: `Add field "${field.name}" to interface ${contract.symbolName}`,
          });
          affectedFilesSet.add(contract.filePath);
        }
      }
    }

    return {
      valid: true,
      patches,
      affectedFiles: [...affectedFilesSet].sort(),
    };
  }

  /**
   * Plans simultaneous AST patches for field rename in both interface and Zod schema.
   */
  public planFieldRename(
    contract: ContractDefinition | null,
    schema: RuntimeSchemaDefinition,
    oldName: string,
    newName: string
  ): SchemaPatchResult {
    const patches: AstPatchOperation[] = [];
    const affectedFilesSet = new Set<string>([schema.filePath]);

    // 1. Rename in Schema
    const schemaField = schema.fields.find(f => f.name === oldName);
    if (schemaField) {
      patches.push({
        filePath: schema.filePath,
        targetSymbolName: schema.schemaName,
        originalSnippet: oldName,
        replacementSnippet: newName,
        startPos: schemaField.startPos,
        endPos: schemaField.startPos + oldName.length,
        description: `Rename field "${oldName}" to "${newName}" in Zod schema ${schema.schemaName}`,
      });
    }

    // 2. Rename in Interface if separate
    if (contract && contract.filePath && contract.fields) {
      const cField = contract.fields.find(f => f.name === oldName);
      if (cField) {
        const cFullPath = resolve(this.projectRoot, contract.filePath);
        if (existsSync(cFullPath)) {
          const cContent = readFileSync(cFullPath, "utf8");
          const isTsx = contract.filePath.endsWith(".tsx") || contract.filePath.endsWith(".jsx");
          const cSf = ts.createSourceFile(
            contract.filePath,
            cContent,
            ts.ScriptTarget.Latest,
            true,
            isTsx ? ts.ScriptKind.TSX : ts.ScriptKind.TS
          );

          ts.forEachChild(cSf, node => {
            if (ts.isInterfaceDeclaration(node) && node.name.text === contract.symbolName) {
              for (const member of node.members) {
                if (ts.isPropertySignature(member) && ts.isIdentifier(member.name) && member.name.text === oldName) {
                  patches.push({
                    filePath: contract.filePath,
                    targetSymbolName: contract.symbolName,
                    originalSnippet: oldName,
                    replacementSnippet: newName,
                    startPos: member.name.getStart(cSf),
                    endPos: member.name.getEnd(),
                    description: `Rename field "${oldName}" to "${newName}" in interface ${contract.symbolName}`,
                  });
                  affectedFilesSet.add(contract.filePath);
                }
              }
            }
          });
        }
      }
    }

    return {
      valid: true,
      patches,
      affectedFiles: [...affectedFilesSet].sort(),
    };
  }

  private mapTsToZodType(tsType: string, isOptional: boolean): string {
    let zod = "z.string()";
    const lower = tsType.toLowerCase();

    if (lower.includes("number")) zod = "z.number()";
    else if (lower.includes("boolean")) zod = "z.boolean()";
    else if (lower.includes("date")) zod = "z.date()";
    else if (lower.includes("[]") || lower.includes("array<")) zod = "z.array(z.string())";

    if (isOptional) zod += ".optional()";
    return zod;
  }
}
