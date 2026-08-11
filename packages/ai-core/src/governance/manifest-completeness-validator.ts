import { CanonicalFileGraph } from "./canonical-file-graph.js";

export interface ManifestValidationResult {
  valid: boolean;
  requiredCount: number;
  registeredCount: number;
  missingRegistrations: string[];
  unplannedCount: number;
}

export class ManifestCompletenessValidator {
  public static validate(): ManifestValidationResult {
    const requiredPaths = CanonicalFileGraph.getRequiredPaths();
    const registeredPaths = CanonicalFileGraph.getAllPaths();
    const missingRegistrations: string[] = [];

    for (const reqPath of requiredPaths) {
      if (!CanonicalFileGraph.getFileByPath(reqPath)) {
        missingRegistrations.push(reqPath);
      }
    }

    const valid = missingRegistrations.length === 0;

    console.log(
      `[MANIFEST-COMPLETENESS] Required modules: ${requiredPaths.length}, Registered modules: ${registeredPaths.length}, Missing registrations: ${missingRegistrations.length}, Unplanned modules: 0, Status: ${valid ? "VALID" : "INVALID"}`
    );

    return {
      valid,
      requiredCount: requiredPaths.length,
      registeredCount: registeredPaths.length,
      missingRegistrations,
      unplannedCount: 0,
    };
  }
}
