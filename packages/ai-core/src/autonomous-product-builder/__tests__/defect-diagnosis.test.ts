import { describe, it, expect } from "vitest";
import { DefectDiagnosisEngine } from "../defect-diagnosis-engine.js";

describe("AEGIS Phase 46 — Defect Diagnosis Engine", () => {
  it("classifies TypeScript, database, API, and dependency failures with confidence and evidence", () => {
    const typeErr = DefectDiagnosisEngine.diagnose("TypeScript error TS2304: Cannot find name 'Member'");
    expect(typeErr.category).toBe("TYPE_ERROR");
    expect(typeErr.confidence).toBeGreaterThan(0.9);

    const dbErr = DefectDiagnosisEngine.diagnose("PrismaClientInitializationError: Can't reach database server");
    expect(dbErr.category).toBe("DATABASE_ERROR");

    const apiErr = DefectDiagnosisEngine.diagnose("HTTP 404: Cannot POST /api/members");
    expect(apiErr.category).toBe("API_ERROR");

    const depErr = DefectDiagnosisEngine.diagnose("Module not found: Can't resolve 'jsonwebtoken'");
    expect(depErr.category).toBe("DEPENDENCY_ERROR");
  });
});
