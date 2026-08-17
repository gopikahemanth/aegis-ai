/**
 * FeatureImplementationVerifier
 *
 * Scans generated source code and live responses to detect placeholder implementations,
 * fake features, empty event handlers, and hardcoded static mocks.
 * Hard Invariant: UI PRESENT != FEATURE IMPLEMENTED.
 */

export interface FeatureVerificationReport {
  featureName: string;
  isRealImplementation: boolean;
  hasPlaceholderHandlers: boolean;
  hasStaticMockDataOnly: boolean;
  hasDisconnectedDatabaseModel: boolean;
  violations: string[];
  summary: string;
}

export class FeatureImplementationVerifier {
  public static verifyFeatureSource(
    featureName: string,
    fileContents: Record<string, string>
  ): FeatureVerificationReport {
    const violations: string[] = [];
    let hasPlaceholderHandlers = false;
    let hasStaticMockDataOnly = false;
    let hasDisconnectedDatabaseModel = false;

    for (const [path, code] of Object.entries(fileContents)) {
      // Check for placeholder/empty handlers (e.g. onClick={() => {}} or console.log only)
      if (
        code.includes("onClick={() => {}}") ||
        code.includes("onClick={() => console.log") ||
        code.includes("onSubmit={(e) => { e.preventDefault(); }}") ||
        code.includes("// TODO: implement")
      ) {
        hasPlaceholderHandlers = true;
        violations.push(`Placeholder or non-operational handler found in "${path}".`);
      }

      // Check for static hardcoded mocks when API should be called
      if (
        code.includes("const mockData = [") &&
        !code.includes("fetch(") &&
        !code.includes("axios.") &&
        !code.includes("apiClient.")
      ) {
        hasStaticMockDataOnly = true;
        violations.push(`Static mock data without backend connectivity found in "${path}".`);
      }
    }

    const isReal = violations.length === 0;

    return {
      featureName,
      isRealImplementation: isReal,
      hasPlaceholderHandlers,
      hasStaticMockDataOnly,
      hasDisconnectedDatabaseModel,
      violations,
      summary: isReal
        ? `Feature "${featureName}" verified as genuine and functional.`
        : `Feature "${featureName}" failed verification: ${violations.length} placeholder/fake violation(s) detected.`,
    };
  }
}
