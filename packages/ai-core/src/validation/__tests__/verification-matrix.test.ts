import { describe, it, expect } from "vitest";
import { VerificationMatrix } from "../verification-matrix.js";

describe("VerificationMatrix", () => {
  it("tracks 13 verification dimensions per feature and evaluates overall completeness", () => {
    const matrix = new VerificationMatrix();

    matrix.registerFeature("members");
    matrix.setDimension("members", "contract", "PASS");
    matrix.setDimension("members", "fileGraph", "PASS");
    matrix.setDimension("members", "importExport", "PASS");
    matrix.setDimension("members", "typeCheck", "PASS");
    matrix.setDimension("members", "build", "PASS");
    matrix.setDimension("members", "unitTest", "PASS");
    matrix.setDimension("members", "api", "PASS");
    matrix.setDimension("members", "database", "PASS");
    matrix.setDimension("members", "browser", "PASS");
    matrix.setDimension("members", "reality", "PASS");
    matrix.setDimension("members", "security", "PASS");
    matrix.setDimension("members", "visual", "PASS");
    matrix.setDimension("members", "goldenWorkflow", "PASS");

    const report = matrix.evaluate();
    expect(report.isVerified).toBe(true);
    expect(report.fullyVerifiedFeatures).toBe(1);
    expect(report.failures.length).toBe(0);
  });
});
