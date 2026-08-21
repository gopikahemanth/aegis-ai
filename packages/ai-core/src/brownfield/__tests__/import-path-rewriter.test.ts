/**
 * ImportPathRewriter Test Suite — Aegis V2.3 Project 2 Phase 5
 *
 * Tests:
 * - Same-directory rename specifier computation
 * - Cross-directory move specifier computation
 * - Extension preservation (.js ESM, extensionless, TypeScript aliases)
 */

import { describe, it, expect } from "vitest";
import { ImportPathRewriter } from "../file-refactoring/import-path-rewriter.js";

describe("ImportPathRewriter Tests", () => {
  it("TEST 1: Computes same-directory rename specifier preserving .js extension", () => {
    const spec = ImportPathRewriter.computeRelativeSpecifier(
      "src/components/TaskList.tsx",
      "src/components/TaskItem.tsx",
      "./TaskCard.js"
    );

    expect(spec).toBe("./TaskItem.js");
  });

  it("TEST 2: Computes cross-directory move specifier", () => {
    const spec = ImportPathRewriter.computeRelativeSpecifier(
      "src/App.tsx",
      "src/features/tasks/TaskCard.tsx",
      "./components/TaskCard.js"
    );

    expect(spec).toBe("./features/tasks/TaskCard.js");
  });

  it("TEST 3: Computes deep relative path upward and downward", () => {
    const spec = ImportPathRewriter.computeRelativeSpecifier(
      "src/features/dashboard/Dashboard.tsx",
      "src/features/tasks/TaskCard.tsx",
      "../../components/TaskCard.js"
    );

    expect(spec).toBe("../tasks/TaskCard.js");
  });

  it("TEST 4: Updates TypeScript path alias specifier", () => {
    const spec = ImportPathRewriter.computeRelativeSpecifier(
      "src/features/dashboard/Dashboard.tsx",
      "src/features/tasks/TaskCard.tsx",
      "@/components/TaskCard"
    );

    expect(spec).toBe("@/features/tasks/TaskCard");
  });
});
