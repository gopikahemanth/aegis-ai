import { describe, it, expect } from "vitest";
import { LessonEffectivenessEngine } from "../lesson-effectiveness-engine.js";

describe("AEGIS Phase 44 — Lesson Effectiveness Engine", () => {
  it("evaluates lesson effectiveness based on empirical outcomes rather than mere reuse", () => {
    const unused = LessonEffectivenessEngine.evaluateLesson("les_unused", 0, 0, 0);
    expect(unused.rating).toBe("UNKNOWN");

    const effective = LessonEffectivenessEngine.evaluateLesson("les_good", 10, 9, 1, 2);
    expect(effective.rating).toBe("HIGHLY_EFFECTIVE");
    expect(effective.recommendationAccuracyPct).toBe(90);

    const harmful = LessonEffectivenessEngine.evaluateLesson("les_bad", 5, 1, 4, 0);
    expect(harmful.rating).toBe("HARMFUL");
  });
});
