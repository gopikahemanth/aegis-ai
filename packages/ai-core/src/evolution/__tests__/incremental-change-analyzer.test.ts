import { describe, it, expect } from "vitest";
import { IncrementalChangeAnalyzer } from "../incremental-change-analyzer.js";

describe("IncrementalChangeAnalyzer", () => {
  it("correctly classifies request categories and calculates minimal blast radius", () => {
    // 1. Bug fix -> LOCAL
    const fixAnalysis = IncrementalChangeAnalyzer.analyzeRequest("Fix the login button onClick error");
    expect(fixAnalysis.category).toBe("BUG_FIX");
    expect(fixAnalysis.blastRadius).toBe("LOCAL");

    // 2. UI Style -> LOCAL
    const uiAnalysis = IncrementalChangeAnalyzer.analyzeRequest("Improve the dashboard css styling and layout");
    expect(uiAnalysis.category).toBe("UI_CHANGE");
    expect(uiAnalysis.blastRadius).toBe("LOCAL");

    // 3. New Feature with database -> DATA
    const dataAnalysis = IncrementalChangeAnalyzer.analyzeRequest("Add a new database model for MemberAttendance");
    expect(dataAnalysis.category).toBe("NEW_FEATURE");
    expect(dataAnalysis.blastRadius).toBe("DATA");
    expect(dataAnalysis.requiresSchemaMigration).toBe(true);

    // 4. Architecture Migration -> ARCHITECTURE
    const archAnalysis = IncrementalChangeAnalyzer.analyzeRequest("Migrate to Next.js fullstack");
    expect(archAnalysis.category).toBe("ARCHITECTURE_CHANGE");
    expect(archAnalysis.blastRadius).toBe("ARCHITECTURE");
    expect(archAnalysis.requiresFullRegression).toBe(true);
  });
});
