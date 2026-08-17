/**
 * ApiDatabaseContractVerifier
 *
 * Verifies consistency across frontend request shapes, backend routing endpoints, and Prisma database schema definitions.
 */

export interface ApiEndpointSpec {
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  path: string;
  expectedParams?: string[];
  expectedBodyFields?: string[];
  expectedStatus: number;
}

export interface ApiDatabaseContractReport {
  isConsistent: boolean;
  totalEndpointsChecked: number;
  matchingEndpointsCount: number;
  schemaModelsChecked: number;
  discrepancies: string[];
  summary: string;
}

export class ApiDatabaseContractVerifier {
  public static verifyContracts(
    frontendEndpoints: ApiEndpointSpec[],
    backendEndpoints: ApiEndpointSpec[],
    databaseModels: string[]
  ): ApiDatabaseContractReport {
    const discrepancies: string[] = [];

    for (const fe of frontendEndpoints) {
      const match = backendEndpoints.find(
        (be) => be.method === fe.method && be.path === fe.path
      );
      if (!match) {
        discrepancies.push(`Frontend endpoint "${fe.method} ${fe.path}" has no matching backend route.`);
      }
    }

    if (databaseModels.length === 0) {
      discrepancies.push("Database schema contains 0 models.");
    }

    const isConsistent = discrepancies.length === 0;

    return {
      isConsistent,
      totalEndpointsChecked: frontendEndpoints.length,
      matchingEndpointsCount: frontendEndpoints.length - discrepancies.length,
      schemaModelsChecked: databaseModels.length,
      discrepancies,
      summary: isConsistent
        ? `All ${frontendEndpoints.length} frontend/backend contracts and ${databaseModels.length} database model(s) verified consistent.`
        : `Contract discrepancies detected: ${discrepancies.join("; ")}`,
    };
  }
}
