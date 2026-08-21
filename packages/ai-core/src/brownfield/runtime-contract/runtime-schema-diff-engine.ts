/**
 * RuntimeSchemaDiffEngine — Aegis V2.3 Project 2 Phase 7.1
 *
 * Computes structural field diffs between current schema and requested schema state.
 */

import type { SchemaFieldDescriptor } from "./runtime-contract-model.js";

export interface SchemaFieldDiff {
  type: "ADD" | "REMOVE" | "RENAME" | "MODIFY";
  fieldName: string;
  newFieldName?: string;
  fieldDescriptor?: SchemaFieldDescriptor;
}

export class RuntimeSchemaDiffEngine {
  /**
   * Calculates field-level diffs between existing schema fields and requested field operations.
   */
  public static computeDiff(
    currentFields: SchemaFieldDescriptor[],
    operation: string,
    params: {
      newField?: { name: string; type: string; zodTypeString?: string; isOptional?: boolean };
      removeFieldName?: string;
      renameField?: { oldName: string; newName: string };
    }
  ): SchemaFieldDiff[] {
    const diffs: SchemaFieldDiff[] = [];

    if (operation === "SCHEMA_FIELD_ADD" && params.newField) {
      diffs.push({
        type: "ADD",
        fieldName: params.newField.name,
      });
    } else if (operation === "SCHEMA_FIELD_REMOVE" && params.removeFieldName) {
      diffs.push({
        type: "REMOVE",
        fieldName: params.removeFieldName,
      });
    } else if (operation === "SCHEMA_FIELD_RENAME" && params.renameField) {
      diffs.push({
        type: "RENAME",
        fieldName: params.renameField.oldName,
        newFieldName: params.renameField.newName,
      });
    }

    return diffs;
  }
}
