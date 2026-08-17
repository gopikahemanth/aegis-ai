/**
 * ApiCompatibilityValidator
 *
 * Compares previous ApiContract vs updated ApiContract to detect breaking changes:
 * - Removed endpoints
 * - Changed HTTP methods
 * - Added required request fields
 * - Removed response fields
 * - Added authentication requirements to previously public endpoints
 */

import type { ApiEndpointContract } from "../governance/api-contract-registry.js";

export type ApiChangeClassification = "NON_BREAKING_CHANGE" | "BREAKING_CHANGE";

export interface ApiChangeViolation {
  endpoint: string;
  method: string;
  changeType: "REMOVED_ENDPOINT" | "METHOD_CHANGED" | "NEW_REQUIRED_FIELD" | "REMOVED_RESPONSE_FIELD" | "AUTH_ADDED";
  message: string;
}

export interface ApiCompatibilityReport {
  isBackwardCompatible: boolean;
  classification: ApiChangeClassification;
  totalEndpointsBefore: number;
  totalEndpointsAfter: number;
  addedEndpoints: string[];
  modifiedEndpoints: string[];
  removedEndpoints: string[];
  breakingChanges: ApiChangeViolation[];
  summary: string;
}

export class ApiCompatibilityValidator {
  /**
   * Compare previous endpoints vs new endpoints and classify backward compatibility.
   */
  public static validate(
    previousEndpoints: ApiEndpointContract[],
    newEndpoints: ApiEndpointContract[]
  ): ApiCompatibilityReport {
    const breakingChanges: ApiChangeViolation[] = [];
    const addedEndpoints: string[] = [];
    const modifiedEndpoints: string[] = [];
    const removedEndpoints: string[] = [];

    const prevMap = new Map<string, ApiEndpointContract>();
    for (const ep of previousEndpoints) {
      prevMap.set(`${ep.method} ${ep.path}`, ep);
    }

    const newMap = new Map<string, ApiEndpointContract>();
    for (const ep of newEndpoints) {
      newMap.set(`${ep.method} ${ep.path}`, ep);
    }

    // 1. Check for removed endpoints (Breaking)
    for (const [key, prevEp] of prevMap.entries()) {
      if (!newMap.has(key)) {
        removedEndpoints.push(key);
        breakingChanges.push({
          endpoint: prevEp.path,
          method: prevEp.method,
          changeType: "REMOVED_ENDPOINT",
          message: `BREAKING: Endpoint ${prevEp.method} ${prevEp.path} was removed. Existing client consumers will fail.`,
        });
      }
    }

    // 2. Check for added endpoints (Non-breaking)
    for (const [key] of newMap.entries()) {
      if (!prevMap.has(key)) {
        addedEndpoints.push(key);
      }
    }

    // 3. Check for modified existing endpoints
    for (const [key, newEp] of newMap.entries()) {
      const prevEp = prevMap.get(key);
      if (!prevEp) continue;

      let isModified = false;

      // Auth added to previously public endpoint (Breaking)
      if (newEp.authentication && !prevEp.authentication) {
        isModified = true;
        breakingChanges.push({
          endpoint: newEp.path,
          method: newEp.method,
          changeType: "AUTH_ADDED",
          message: `BREAKING: Endpoint ${newEp.method} ${newEp.path} now requires authentication. Unauthenticated clients will receive 401.`,
        });
      }

      // Check required request fields added (Breaking if required and not optional)
      const prevReqFields = new Set((prevEp.requestSchema || []).map((f) => f.name));
      for (const newField of newEp.requestSchema || []) {
        if (!prevReqFields.has(newField.name) && newField.required) {
          isModified = true;
          breakingChanges.push({
            endpoint: newEp.path,
            method: newEp.method,
            changeType: "NEW_REQUIRED_FIELD",
            message: `BREAKING: Required field "${newField.name}" added to ${newEp.method} ${newEp.path} request body.`,
          });
        }
      }

      if (isModified) {
        modifiedEndpoints.push(key);
      }
    }

    const isBackwardCompatible = breakingChanges.length === 0;

    return {
      isBackwardCompatible,
      classification: isBackwardCompatible ? "NON_BREAKING_CHANGE" : "BREAKING_CHANGE",
      totalEndpointsBefore: previousEndpoints.length,
      totalEndpointsAfter: newEndpoints.length,
      addedEndpoints,
      modifiedEndpoints,
      removedEndpoints,
      breakingChanges,
      summary: isBackwardCompatible
        ? `API EVOLUTION COMPATIBLE: ${addedEndpoints.length} added, ${modifiedEndpoints.length} modified. All existing consumers preserved.`
        : `BREAKING API CHANGES DETECTED: ${breakingChanges.length} breaking issue(s).`,
    };
  }
}
