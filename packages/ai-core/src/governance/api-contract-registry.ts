/**
 * ApiContractRegistry (Enhanced)
 *
 * Single authoritative source for all API endpoints in the generated project.
 *
 * Every endpoint must define:
 *   operationId, method, path, purpose, authentication, authorization,
 *   requestSchema, responseSchema, errorSchema, statusCodes, featureOwnership.
 *
 * Validation detects: duplicate routes, duplicate operationIds,
 * missing auth definitions, invalid methods/paths, unknown models.
 */

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

export interface ApiFieldSchema {
  /** Field name */
  name: string;
  /** TypeScript type string e.g. "string", "number", "string[]" */
  type: string;
  /** Whether the field is required */
  required: boolean;
  /** Brief description */
  description?: string;
  /** Is this field sensitive (e.g. password, token) */
  sensitive?: boolean;
}

export interface ApiErrorSchema {
  /** HTTP status code */
  statusCode: number;
  /** Error code string e.g. "UNAUTHORIZED", "NOT_FOUND" */
  code: string;
  /** Human message */
  message: string;
}

export interface ApiEndpointContract {
  /** Unique operation identifier e.g. "createScan", "listRepositories" */
  operationId: string;
  /** HTTP method */
  method: HttpMethod;
  /** Full path e.g. "/api/scans" */
  path: string;
  /** Human description of what this endpoint does */
  description: string;
  /** Whether this endpoint requires authentication */
  authentication: boolean;
  /** Optional role/permission required e.g. "admin", "user" */
  authorization?: string;
  /** Request body fields (for POST/PUT/PATCH) */
  requestSchema?: ApiFieldSchema[];
  /** Response body fields */
  responseSchema?: ApiFieldSchema[];
  /** Error cases */
  errorSchema?: ApiErrorSchema[];
  /** HTTP status codes returned (success + error) */
  statusCodes?: number[];
  /** Feature that owns this endpoint e.g. "security-scan", "auth" */
  featureOwnership?: string;
  /** Domain models this endpoint reads/writes */
  models?: string[];

  // Legacy compat — kept so existing DataArchitectureAgent output still works
  requestFields?: Record<string, string>;
  responseFields?: Record<string, string>;
}

export interface ApiValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export class ApiContractRegistry {
  private static endpoints: ApiEndpointContract[] = [];

  public static registerContract(endpoints: ApiEndpointContract[]): void {
    this.endpoints = endpoints;
    console.log(`[ApiContractRegistry] 🔒 Locked ${endpoints.length} API endpoint contracts as single source of truth for frontend & backend.`);
  }

  public static getEndpoints(): ApiEndpointContract[] {
    return this.endpoints;
  }

  /**
   * Validate the registered contract for:
   * - Duplicate routes (method + path)
   * - Duplicate operationIds
   * - Missing authentication field
   * - Invalid HTTP methods
   * - Invalid paths (must start with /)
   * - Missing operationId
   */
  public static validate(knownModels?: string[]): ApiValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const seenRoutes = new Set<string>();
    const seenOperationIds = new Set<string>();
    const validMethods: HttpMethod[] = ["GET", "POST", "PUT", "DELETE", "PATCH"];

    for (const ep of this.endpoints) {
      // Must have operationId
      if (!ep.operationId) {
        errors.push(`MISSING_OPERATION_ID: Endpoint "${ep.method} ${ep.path}" has no operationId.`);
      }

      // Duplicate route
      const routeKey = `${ep.method.toUpperCase()}:${ep.path}`;
      if (seenRoutes.has(routeKey)) {
        errors.push(`DUPLICATE_ROUTE: "${routeKey}" is defined more than once.`);
      }
      seenRoutes.add(routeKey);

      // Duplicate operationId
      if (ep.operationId) {
        if (seenOperationIds.has(ep.operationId)) {
          errors.push(`DUPLICATE_OPERATION_ID: "${ep.operationId}" appears more than once.`);
        }
        seenOperationIds.add(ep.operationId);
      }

      // Valid method
      if (!validMethods.includes(ep.method as HttpMethod)) {
        errors.push(`INVALID_METHOD: "${ep.method}" on "${ep.path}" is not a valid HTTP method.`);
      }

      // Valid path
      if (!ep.path.startsWith("/")) {
        errors.push(`INVALID_PATH: "${ep.path}" must start with "/".`);
      }

      // Authentication flag must be defined
      if (ep.authentication === undefined || ep.authentication === null) {
        warnings.push(`MISSING_AUTH_DEFINITION: Endpoint "${ep.operationId || ep.path}" has no authentication field. Defaulting to true.`);
      }

      // Models must be in known domain
      if (knownModels && ep.models) {
        for (const model of ep.models) {
          if (!knownModels.includes(model)) {
            warnings.push(`UNKNOWN_MODEL: Endpoint "${ep.operationId}" references model "${model}" not in domain contract.`);
          }
        }
      }
    }

    if (errors.length > 0) {
      console.error(`[ApiContractRegistry] ❌ API contract validation failed (${errors.length} errors):`);
      errors.forEach(e => console.error(`  • ${e}`));
    }
    if (warnings.length > 0) {
      warnings.forEach(w => console.warn(`[ApiContractRegistry] ⚠️  ${w}`));
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  public static generateDomainPromptContext(): string {
    if (this.endpoints.length === 0) return "";

    return `\nEXPLICIT LOCKED API CONTRACT (ALL FRONTEND SERVICES AND BACKEND CONTROLLERS MUST IMPLEMENT THESE EXACT ENDPOINTS):\n` +
      JSON.stringify(this.endpoints, null, 2) + "\n";
  }
}
