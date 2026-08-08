export interface ApiEndpointContract {
  path: string;
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  description: string;
  requestFields?: Record<string, string>;
  responseFields?: Record<string, string>;
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

  public static generateDomainPromptContext(): string {
    if (this.endpoints.length === 0) return "";

    return `\nEXPLICIT LOCKED API CONTRACT (ALL FRONTEND SERVICES AND BACKEND CONTROLLERS MUST IMPLEMENT THESE EXACT ENDPOINTS):\n` +
      JSON.stringify(this.endpoints, null, 2) + "\n";
  }
}
