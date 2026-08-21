/**
 * RuntimeSchemaResolver — Aegis V2.3 Project 2 Phase 6 & Phase 7.1
 *
 * Discovers and parses runtime validation schemas (Zod, Yup) from TypeScript AST:
 * - z.object, z.enum, z.array, z.string, z.number, z.boolean, z.date
 * - Optional, nullable, and nullish modifiers
 * - z.infer<typeof Schema> type inference links
 * - Coercion, transform, and refinement safety flags
 */

import ts from "typescript";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import type {
  RuntimeSchemaDefinition,
  SchemaFieldDescriptor,
} from "./runtime-contract-model.js";

export class RuntimeSchemaResolver {
  private readonly projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot.replace(/\\/g, "/");
  }

  /**
   * Resolves a runtime schema definition from a source file by name or target interface link.
   */
  public resolveSchema(sourceFile: string, schemaOrTypeName: string): RuntimeSchemaDefinition | null {
    const relSource = sourceFile.replace(/\\/g, "/").replace(/^(\/|\\)+/, "");
    const fullPath = resolve(this.projectRoot, relSource);
    if (!existsSync(fullPath)) return null;

    const content = readFileSync(fullPath, "utf8");
    const isTsx = relSource.endsWith(".tsx") || relSource.endsWith(".jsx");
    const sf = ts.createSourceFile(
      relSource,
      content,
      ts.ScriptTarget.Latest,
      true,
      isTsx ? ts.ScriptKind.TSX : ts.ScriptKind.TS
    );

    let schemaDef: RuntimeSchemaDefinition | null = null;
    let inferredTypeMap = new Map<string, string>(); // schemaName -> typeName

    // 1. Scan for type Foo = z.infer<typeof FooSchema>
    ts.forEachChild(sf, node => {
      if (
        ts.isTypeAliasDeclaration(node) &&
        node.type &&
        ts.isTypeQueryNode(node.type as any)
      ) {
        // z.infer<typeof Schema>
        const text = node.type.getText(sf);
        const match = text.match(/typeof\s+([a-zA-Z0-9_$]+)/);
        if (match) {
          inferredTypeMap.set(match[1], node.name.text);
        }
      }
    });

    // 2. Scan variable declarations for z.object({ ... }) or Schema.extend({ ... })
    const visit = (node: ts.Node) => {
      if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name)) {
        const varName = node.name.text;
        const matchesName =
          varName === schemaOrTypeName ||
          varName === `${schemaOrTypeName}Schema` ||
          schemaOrTypeName === `${varName.replace(/Schema$/, "")}`;

        if (matchesName && node.initializer) {
          const initText = node.initializer.getText(sf);
          const isZod = initText.includes("z.") || initText.includes("zod");

          if (isZod) {
            const fields: SchemaFieldDescriptor[] = [];
            let isComposition = false;

            // Extract fields from z.object({ ... }) or .extend({ ... })
            this.extractZodFields(node.initializer, sf, fields);
            if (initText.includes(".extend(") || initText.includes(".pick(") || initText.includes(".omit(")) {
              isComposition = true;
            }

            schemaDef = {
              schemaId: `${relSource}#${varName}`,
              schemaName: varName,
              filePath: relSource,
              validatorType: "zod",
              inferredTypeName: inferredTypeMap.get(varName) || varName.replace(/Schema$/, ""),
              isComposition,
              fields,
              startPos: node.getStart(sf),
              endPos: node.getEnd(),
            };
            return;
          }
        }
      }
      ts.forEachChild(node, visit);
    };

    visit(sf);
    return schemaDef;
  }

  private extractZodFields(
    expr: ts.Expression,
    sf: ts.SourceFile,
    fields: SchemaFieldDescriptor[]
  ) {
    const visitExpr = (node: ts.Node) => {
      // Look for object literal argument inside z.object({ ... }) or .extend({ ... })
      if (ts.isObjectLiteralExpression(node)) {
        for (const prop of node.properties) {
          if (ts.isPropertyAssignment(prop) && ts.isIdentifier(prop.name)) {
            const fieldName = prop.name.text;
            const init = prop.initializer;
            const rawText = init.getText(sf);

            const isOptional = rawText.includes(".optional()") || rawText.includes(".nullish()");
            const isNullable = rawText.includes(".nullable()") || rawText.includes(".nullish()");
            const hasCoercion = rawText.includes("z.coerce.") || rawText.includes("coerce");
            const hasTransform = rawText.includes(".transform(") || rawText.includes(".preprocess(") || rawText.includes(".pipe(");
            const hasRefinement = rawText.includes(".refine(") || rawText.includes(".superRefine(");

            let type = "unknown";
            let enumValues: string[] | undefined;

            if (rawText.includes("z.string(")) type = "string";
            else if (rawText.includes("z.number(")) type = "number";
            else if (rawText.includes("z.boolean(")) type = "boolean";
            else if (rawText.includes("z.date(")) type = "date";
            else if (rawText.includes("z.enum(")) {
              type = "enum";
              const enumMatch = rawText.match(/z\.enum\(\s*\[([^\]]+)\]\s*\)/);
              if (enumMatch) {
                enumValues = enumMatch[1].split(",").map(s => s.trim().replace(/^['"]|['"]$/g, ""));
              }
            } else if (rawText.includes("z.array(")) {
              type = "array";
            } else if (rawText.includes("z.object(")) {
              type = "object";
            }

            fields.push({
              name: fieldName,
              type,
              rawTypeString: rawText,
              isOptional,
              isNullable,
              enumValues,
              hasCoercion,
              hasTransform,
              hasRefinement,
              startPos: prop.getStart(sf),
              endPos: prop.getEnd(),
            });
          }
        }
      }
      ts.forEachChild(node, visitExpr);
    };

    visitExpr(expr);
  }
}
