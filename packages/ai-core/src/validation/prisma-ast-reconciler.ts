import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import ts from "typescript";
import { CanonicalPrismaModelRegistry, PrismaDelegateOperationRegistry, CanonicalPrismaFieldRegistry } from "../governance/canonical-data-model.js";
import type { GraphIssue } from "./project-graph-engine.js";

export interface PrismaModelMetadata {
  modelName: string;
  delegateName: string;
  fields: Set<string>;
  fieldList: string[];
  relationFields: Map<string, { targetModel: string; isList: boolean }>;
}

export class PrismaAstReconciler {
  private static readonly PRISMA_KEYWORDS = new Set([
    "data", "where", "select", "include", "orderBy", "take", "skip",
    "cursor", "distinct", "connect", "create", "createMany", "update",
    "upsert", "delete", "set", "push", "increment", "decrement", "multiply", "divide"
  ]);

  private static readonly FIELD_ALIASES: Record<string, Record<string, string>> = {
    service: {
      duration: "durationMinutes",
    },
    schedulerule: {
      isWorkingDay: "isAvailable",
      workingDay: "isAvailable",
    },
    analysisresult: {
      score: "matchScore",
      atsScore: "matchScore",
      overallScore: "matchScore",
      rating: "matchScore",
      matches: "matchedKeywords",
      matched: "matchedKeywords",
      keywords: "matchedKeywords",
      missing: "missingKeywords",
      gaps: "missingKeywords",
      skillGaps: "missingKeywords",
      missingSkills: "missingKeywords",
      recommendations: "suggestions",
      tips: "suggestions",
    },
    user: {
      name: "email",
      username: "email",
    },
  };

  /**
   * Parses prisma/schema.prisma into structured model metadata.
   */
  public static loadSchemaModels(projectRoot: string): Map<string, PrismaModelMetadata> {
    const models = new Map<string, PrismaModelMetadata>();
    const schemaPath = join(projectRoot, "prisma", "schema.prisma");
    if (!existsSync(schemaPath)) return models;

    try {
      const content = readFileSync(schemaPath, "utf8");
      const modelBlocks = content.split(/model\s+/);
      for (const block of modelBlocks.slice(1)) {
        const modelName = block.split(/\s|\{/)[0].trim();
        if (!modelName) continue;

        const fields = new Set<string>();
        const fieldList: string[] = [];
        const relationFields = new Map<string, { targetModel: string; isList: boolean }>();

        const lines = block.split(/\r?\n/);
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith("//") || trimmed.startsWith("@@") || trimmed.startsWith("}")) {
            continue;
          }
          const parts = trimmed.split(/\s+/);
          if (parts.length >= 2) {
            const fieldName = parts[0];
            const rawType = parts[1];
            if (/^[a-zA-Z0-9_$]+$/.test(fieldName)) {
              fields.add(fieldName);
              fieldList.push(fieldName);

              const isList = rawType.endsWith("[]");
              const targetModel = rawType.replace(/\[\]|\?$/, "");
              if (targetModel && /^[A-Z]/.test(targetModel)) {
                relationFields.set(fieldName, { targetModel, isList });
              }
            }
          }
        }

        const delegateName = modelName.charAt(0).toLowerCase() + modelName.slice(1);
        models.set(modelName.toLowerCase(), {
          modelName,
          delegateName,
          fields,
          fieldList,
          relationFields,
        });
      }
    } catch {}

    return models;
  }

  /**
   * Inspects and reconciles Prisma calls in a TypeScript/JavaScript source file using AST.
   * Never deletes unknown fields with regex.
   * Renames unambiguous aliases via AST with syntax validation & rollback.
   * Reports structured diagnostics for any remaining schema mismatches.
   */
  public static reconcileSourceFile(
    sourceAbs: string,
    relPath: string,
    prismaModels: Map<string, PrismaModelMetadata>
  ): { issues: GraphIssue[]; transformed: boolean } {
    const issues: GraphIssue[] = [];
    if (!existsSync(sourceAbs)) return { issues, transformed: false };

    let content: string;
    try {
      content = readFileSync(sourceAbs, "utf8");
    } catch {
      return { issues, transformed: false };
    }

    if (!content.includes("prisma.") && !content.includes("tx.")) {
      return { issues, transformed: false };
    }

    const initialSf = ts.createSourceFile(sourceAbs, content, ts.ScriptTarget.Latest, true);
    const initialDiagnosticsCount = (initialSf as any).parseDiagnostics?.length || 0;

    // Helper: traverse AST and collect all Prisma invocation calls
    const collectPrismaCalls = (sf: ts.SourceFile) => {
      const calls: {
        callNode: ts.CallExpression;
        delegate: string;
        operation: string;
        receiver: string;
        delegateNode: ts.MemberName;
        operationNode: ts.MemberName;
      }[] = [];

      const walk = (node: ts.Node) => {
        if (ts.isCallExpression(node)) {
          if (ts.isPropertyAccessExpression(node.expression)) {
            const operationNode = node.expression.name;
            const operation = operationNode.text;
            const innerExpr = node.expression.expression;
            if (ts.isPropertyAccessExpression(innerExpr)) {
              const delegateNode = innerExpr.name;
              const delegate = delegateNode.text;
              const receiverExpr = innerExpr.expression;
              if (ts.isIdentifier(receiverExpr)) {
                const receiver = receiverExpr.text;
                if (receiver === "prisma" || receiver === "tx" || receiver === "db") {
                  calls.push({
                    callNode: node,
                    delegate,
                    operation,
                    receiver,
                    delegateNode,
                    operationNode,
                  });
                }
              }
            }
          }
        }
        ts.forEachChild(node, walk);
      };

      walk(sf);
      return calls;
    };

    // ── PASS 1: Identify unambiguous transformations ──────────────────────────
    const replacements: { start: number; end: number; text: string; description: string }[] = [];
    const callsPass1 = collectPrismaCalls(initialSf);

    for (const call of callsPass1) {
      const delegateLower = call.delegate.toLowerCase();
      const meta = prismaModels.get(delegateLower);
      const isKnownModel = !!meta || CanonicalPrismaModelRegistry.isValidDelegate(call.delegate);

      if (!isKnownModel) {
        // Attempt unambiguous delegate matching
        let matchedMeta: PrismaModelMetadata | undefined;
        for (const [mKey, mVal] of prismaModels.entries()) {
          if (mKey === delegateLower || mKey.includes(delegateLower) || delegateLower.includes(mKey)) {
            matchedMeta = mVal;
            break;
          }
        }

        if (matchedMeta && matchedMeta.delegateName !== call.delegate) {
          replacements.push({
            start: call.delegateNode.getStart(initialSf),
            end: call.delegateNode.getEnd(),
            text: matchedMeta.delegateName,
            description: `delegate "${call.delegate}" -> "${matchedMeta.delegateName}"`,
          });
        }
        continue;
      }

      if (!PrismaDelegateOperationRegistry.isValidOperation(call.operation)) {
        continue;
      }

      const canonicalFields = CanonicalPrismaFieldRegistry.getFields(call.delegate) || new Set<string>();
      const schemaFields = meta?.fields
        ? new Set([...meta.fields, ...canonicalFields])
        : canonicalFields;
      if (!schemaFields || schemaFields.size === 0) continue;

      if (call.callNode.arguments.length > 0) {
        const firstArg = call.callNode.arguments[0];
        if (ts.isObjectLiteralExpression(firstArg)) {
          const dataProp = firstArg.properties.find(p => p.name && p.name.getText(initialSf) === "data");
          if (dataProp && ts.isPropertyAssignment(dataProp)) {
            const dataExpr = dataProp.initializer;
            const objectLiterals: ts.ObjectLiteralExpression[] = [];
            if (ts.isObjectLiteralExpression(dataExpr)) {
              objectLiterals.push(dataExpr);
            } else if (ts.isArrayLiteralExpression(dataExpr)) {
              for (const elem of dataExpr.elements) {
                if (ts.isObjectLiteralExpression(elem)) objectLiterals.push(elem);
              }
            }

            const delegateAliases = this.FIELD_ALIASES[delegateLower] || {};

            for (const objLit of objectLiterals) {
              for (const prop of objLit.properties) {
                if (!prop.name) continue;
                const propName = prop.name.getText(initialSf).replace(/^['"`]|['"`]$/g, "");
                if (this.PRISMA_KEYWORDS.has(propName)) continue;

                if (!schemaFields.has(propName)) {
                  const canonicalField = delegateAliases[propName] ||
                    (propName === "title" && schemaFields.has("name") ? "name" : undefined) ||
                    (propName === "name" && schemaFields.has("title") ? "title" : undefined) ||
                    (propName === "user_id" && schemaFields.has("userId") ? "userId" : undefined) ||
                    (propName === "userId" && schemaFields.has("user_id") ? "user_id" : undefined) ||
                    (propName === "created_at" && schemaFields.has("createdAt") ? "createdAt" : undefined) ||
                    (propName === "createdAt" && schemaFields.has("created_at") ? "created_at" : undefined) ||
                    (propName === "updated_at" && schemaFields.has("updatedAt") ? "updatedAt" : undefined) ||
                    (propName === "updatedAt" && schemaFields.has("updated_at") ? "updated_at" : undefined);

                  if (canonicalField && schemaFields.has(canonicalField)) {
                    if (ts.isPropertyAssignment(prop)) {
                      replacements.push({
                        start: prop.name.getStart(initialSf),
                        end: prop.name.getEnd(),
                        text: canonicalField,
                        description: `field "${propName}" -> "${canonicalField}" for model "${call.delegate}"`,
                      });
                    } else if (ts.isShorthandPropertyAssignment(prop)) {
                      replacements.push({
                        start: prop.getStart(initialSf),
                        end: prop.getEnd(),
                        text: `${canonicalField}: ${propName}`,
                        description: `shorthand "${propName}" -> "${canonicalField}: ${propName}" for model "${call.delegate}"`,
                      });
                    }
                  }
                }
              }
            }
          }
        }
      }
    }

    let transformedCode = content;
    let fileModified = false;

    // Apply replacements in reverse offset order to prevent index drift
    if (replacements.length > 0) {
      replacements.sort((a, b) => b.start - a.start);
      let candidate = content;
      for (const r of replacements) {
        candidate = candidate.slice(0, r.start) + r.text + candidate.slice(r.end);
      }

      // Syntax validation of transformed code: must be clean with 0 parse diagnostics
      const candidateSf = ts.createSourceFile(sourceAbs, candidate, ts.ScriptTarget.Latest, true);
      const candidateDiags = (candidateSf as any).parseDiagnostics?.length || 0;

      if (candidateDiags === 0) {
        transformedCode = candidate;
        fileModified = true;
        for (const r of replacements) {
          console.log(`[PrismaAstReconciler] ✓ AST-safe transformed Prisma ${r.description} in ${relPath}`);
        }
        try {
          writeFileSync(sourceAbs, transformedCode, "utf8");
        } catch (err: any) {
          console.warn(`[PrismaAstReconciler] Failed to save AST-reconciled file ${relPath}: ${err.message}`);
        }
      } else {
        console.warn(`[PrismaAstReconciler] ⚠️ AST transformations introduced syntax errors (${candidateDiags} diags). Rolled back.`);
        transformedCode = content;
      }
    }

    // ── PASS 2: Collect structured diagnostics from the final AST ─────────────
    const finalSf = ts.createSourceFile(sourceAbs, transformedCode, ts.ScriptTarget.Latest, true);
    const finalCalls = collectPrismaCalls(finalSf);

    for (const call of finalCalls) {
      const delegateLower = call.delegate.toLowerCase();
      const meta = prismaModels.get(delegateLower);
      const isKnownModel = !!meta || CanonicalPrismaModelRegistry.isValidDelegate(call.delegate);

      if (!isKnownModel) {
        const pos = finalSf.getLineAndCharacterOfPosition(call.delegateNode.getStart(finalSf));
        issues.push({
          type: "PRISMA_SCHEMA_MISMATCH",
          sourceFile: relPath,
          line: pos.line + 1,
          column: pos.character + 1,
          model: call.delegate,
          expectedSchema: Array.from(prismaModels.keys()),
          message: `PRISMA_SCHEMA_MISMATCH: Unknown Prisma model delegate "prisma.${call.delegate}" at ${relPath}:${pos.line + 1}:${pos.character + 1}. Valid delegates: ${Array.from(prismaModels.keys()).join(", ") || CanonicalPrismaModelRegistry.MODEL_DELEGATES.join(", ")}.`,
          severity: "ERROR",
        });
        continue;
      }

      if (!PrismaDelegateOperationRegistry.isValidOperation(call.operation)) {
        const pos = finalSf.getLineAndCharacterOfPosition(call.operationNode.getStart(finalSf));
        issues.push({
          type: "PRISMA_SCHEMA_MISMATCH",
          sourceFile: relPath,
          line: pos.line + 1,
          column: pos.character + 1,
          model: call.delegate,
          message: `PRISMA_SCHEMA_MISMATCH: Invalid Prisma operation "${call.operation}" on delegate "prisma.${call.delegate}" at ${relPath}:${pos.line + 1}:${pos.character + 1}.`,
          severity: "ERROR",
        });
        continue;
      }

      const canonicalFields = CanonicalPrismaFieldRegistry.getFields(call.delegate) || new Set<string>();
      const schemaFields = meta?.fields
        ? new Set([...meta.fields, ...canonicalFields])
        : canonicalFields;
      if (!schemaFields || schemaFields.size === 0) continue;

      if (call.callNode.arguments.length > 0) {
        const firstArg = call.callNode.arguments[0];
        if (ts.isObjectLiteralExpression(firstArg)) {
          const dataProp = firstArg.properties.find(p => p.name && p.name.getText(finalSf) === "data");
          if (dataProp && ts.isPropertyAssignment(dataProp)) {
            const dataExpr = dataProp.initializer;
            const objectLiterals: ts.ObjectLiteralExpression[] = [];
            if (ts.isObjectLiteralExpression(dataExpr)) {
              objectLiterals.push(dataExpr);
            } else if (ts.isArrayLiteralExpression(dataExpr)) {
              for (const elem of dataExpr.elements) {
                if (ts.isObjectLiteralExpression(elem)) objectLiterals.push(elem);
              }
            }

            for (const objLit of objectLiterals) {
              for (const prop of objLit.properties) {
                if (!prop.name) continue;
                const propName = prop.name.getText(finalSf).replace(/^['"`]|['"`]$/g, "");
                if (this.PRISMA_KEYWORDS.has(propName)) continue;

                if (!schemaFields.has(propName)) {
                  // Unknown field not in schema and not transformed:
                  // DO NOT SILENTLY REMOVE. NEVER DELETE WITH REGEX.
                  // Emit structured diagnostic with exact location.
                  const pos = finalSf.getLineAndCharacterOfPosition(prop.getStart(finalSf));
                  issues.push({
                    type: "PRISMA_SCHEMA_MISMATCH",
                    sourceFile: relPath,
                    line: pos.line + 1,
                    column: pos.character + 1,
                    model: call.delegate,
                    field: propName,
                    expectedSchema: Array.from(schemaFields),
                    message: `PRISMA_SCHEMA_MISMATCH: Model "${call.delegate}" (expected schema: [${Array.from(schemaFields).join(", ")}]) does not contain field "${propName}" referenced in ${relPath}:${pos.line + 1}:${pos.character + 1}.`,
                    severity: "ERROR",
                  });
                }
              }
            }
          }
        }
      }
    }

    return { issues, transformed: fileModified };
  }
}
