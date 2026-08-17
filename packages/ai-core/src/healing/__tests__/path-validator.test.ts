/**
 * path-validator.test.ts
 *
 * Tests path normalization, rogue string rejection ("s", ".ts"),
 * path traversal defense, and new file creation governance.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { PathValidator } from "../path-validator.js";

const TEST_DIR = join(process.cwd(), ".tmp_test_path_val");

describe("PathValidator & CreationGuard", () => {
  beforeEach(() => {
    if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true, force: true });
    mkdirSync(join(TEST_DIR, "src"), { recursive: true });
    writeFileSync(join(TEST_DIR, "src", "App.tsx"), "export const App = () => null;");
  });

  afterEach(() => {
    if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true, force: true });
  });

  it("validates existing source files correctly", () => {
    const res = PathValidator.validatePath("src/App.tsx", TEST_DIR);
    expect(res.valid).toBe(true);
    expect(res.normalizedRelativePath).toBe("src/App.tsx");
  });

  it("rejects rogue short strings like 's' or 'a'", () => {
    const res1 = PathValidator.validatePath("s", TEST_DIR);
    expect(res1.valid).toBe(false);
    expect(res1.reason).toContain("too short");

    const res2 = PathValidator.validatePath("a", TEST_DIR);
    expect(res2.valid).toBe(false);
  });

  it("rejects directory traversal escaping project root", () => {
    const res = PathValidator.validatePath("../../etc/passwd.ts", TEST_DIR);
    expect(res.valid).toBe(false);
    expect(res.reason).toContain("escapes project root");
  });

  it("rejects node_modules or .git directory access", () => {
    const res = PathValidator.validatePath("node_modules/react/index.js", TEST_DIR);
    expect(res.valid).toBe(false);
    expect(res.reason).toContain("protected/generated directory");
  });

  it("rejects non-existent file when allowNewFiles is false", () => {
    const res = PathValidator.validatePath("src/NonExistent.tsx", TEST_DIR, { allowNewFiles: false });
    expect(res.valid).toBe(false);
    expect(res.reason).toContain("does not exist and new file creation is not authorized");
  });

  it("sanitizes candidate file lists extracted from messy error traces", () => {
    const rawList = ["src/App.tsx", "s", "node_modules/express/index.js", "../../outside.ts", "src/Missing.ts"];
    const sanitized = PathValidator.sanitizeCandidateFiles(rawList, TEST_DIR);
    expect(sanitized).toEqual(["src/App.tsx"]); // only src/App.tsx exists & is valid
  });
});
