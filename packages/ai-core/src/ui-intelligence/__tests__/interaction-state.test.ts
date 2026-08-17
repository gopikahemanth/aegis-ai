import { describe, it, expect } from "vitest";
import { InteractionStateEngine } from "../interaction-state-engine.js";

describe("AEGIS Phase 49 — Interaction State Engine", () => {
  it("provides focus ring classes, disabled states, and ensures micro-states are handled", () => {
    const buttonState = InteractionStateEngine.getComponentStateDef("Button");

    expect(buttonState.supportedStates).toContain("HOVER");
    expect(buttonState.supportedStates).toContain("FOCUS");
    expect(buttonState.supportedStates).toContain("DISABLED");
    expect(buttonState.supportedStates).toContain("LOADING");
    expect(buttonState.focusRingClass).toContain("focus:ring-2");
    expect(InteractionStateEngine.verifyAllStatesHandled("Button")).toBe(true);
  });
});
