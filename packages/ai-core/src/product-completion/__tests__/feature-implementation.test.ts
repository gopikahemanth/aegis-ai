import { describe, it, expect } from "vitest";
import { FeatureImplementationVerifier } from "../feature-implementation-verifier.js";

describe("AEGIS Phase 45 — Feature Implementation Verifier", () => {
  it("rejects fake placeholder button handlers and static mock datasets", () => {
    const fakeCode = {
      "src/components/AddButton.tsx": `export const AddButton = () => <button onClick={() => {}}>Add</button>;`,
    };
    const fakeReport = FeatureImplementationVerifier.verifyFeatureSource("AddButton", fakeCode);
    expect(fakeReport.isRealImplementation).toBe(false);
    expect(fakeReport.hasPlaceholderHandlers).toBe(true);

    const realCode = {
      "src/components/AddButton.tsx": `export const AddButton = ({ onAdd }) => <button onClick={() => onAdd()}>Add</button>;`,
    };
    const realReport = FeatureImplementationVerifier.verifyFeatureSource("AddButton", realCode);
    expect(realReport.isRealImplementation).toBe(true);
    expect(realReport.violations.length).toBe(0);
  });
});
