export type SubsystemRole = "DatabaseAgent" | "BackendAgent" | "FrontendAgent" | "DesignSystem" | "DevOps" | "System";

export interface FileOwnershipEntry {
  path: string;
  owner: SubsystemRole;
  registeredAt: string;
}

export class FileOwnershipRegistry {
  private static registry: Map<string, FileOwnershipEntry> = new Map();

  public static registerOwner(relativePath: string, owner: SubsystemRole): void {
    const normalized = relativePath.replace(/\\/g, "/").toLowerCase();
    this.registry.set(normalized, {
      path: relativePath,
      owner,
      registeredAt: new Date().toISOString()
    });
  }

  public static getOwner(relativePath: string): SubsystemRole | null {
    const normalized = relativePath.replace(/\\/g, "/").toLowerCase();
    const entry = this.registry.get(normalized);
    return entry ? entry.owner : null;
  }

  public static canWrite(relativePath: string, requestingAgent: SubsystemRole): { allowed: boolean; currentOwner?: SubsystemRole } {
    const currentOwner = this.getOwner(relativePath);
    if (!currentOwner || currentOwner === requestingAgent || requestingAgent === "System") {
      return { allowed: true };
    }
    return { allowed: false, currentOwner };
  }
}
