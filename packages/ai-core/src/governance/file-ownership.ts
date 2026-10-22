export type SubsystemRole =
  | "RequirementsAuthority"
  | "ContractAuthority"
  | "AuthorizedSchemaManager"
  | "DatabaseAgent"
  | "BackendAgent"
  | "FrontendAgent"
  | "DesignSystem"
  | "DevOps"
  | "SafeRepairCoordinator"
  | "System";

export interface FileOwnershipEntry {
  path: string;
  owner: SubsystemRole;
  registeredAt: string;
  lastModifiedAt?: string;
  regenerationCount?: number;
}

export interface CanWriteResult {
  allowed: boolean;
  currentOwner?: SubsystemRole;
  reason?: string;
}

export class FileOwnershipRegistry {
  private static registry: Map<string, FileOwnershipEntry> = new Map();

  /**
   * Determine default authoritative owner for a given project file path.
   */
  public static getDefaultOwnerForPath(relativePath: string): SubsystemRole {
    const norm = relativePath.replace(/\\/g, "/").toLowerCase();

    // 1. Requirements authority
    if (norm === ".aegis/feature-matrix.json" || norm.endsWith("feature-matrix.json")) {
      return "RequirementsAuthority";
    }

    // 2. Contract authority
    if (
      norm.startsWith(".aegis/") &&
      (norm.includes("contract") || norm.includes("architecture") || norm.includes("manifest"))
    ) {
      return "ContractAuthority";
    }

    // 3. Authorized schema manager
    if (norm === "prisma/schema.prisma" || norm.endsWith("schema.prisma")) {
      return "AuthorizedSchemaManager";
    }

    // 4. Design system and shared primitives
    if (
      norm.startsWith("src/design-system/") ||
      norm.startsWith("src/shared/components/") ||
      norm.includes("tokens.ts") ||
      norm.includes("colors.ts")
    ) {
      return "DesignSystem";
    }

    // 5. Backend files
    if (norm.startsWith("server/") || norm.startsWith("src/server/")) {
      return "BackendAgent";
    }

    // 6. Tooling and DevOps configs
    if (
      norm === "package.json" ||
      norm === "tsconfig.json" ||
      norm === "dockerfile" ||
      norm.startsWith("docker-compose") ||
      /(vite|tailwind|postcss|eslint|prettier|vitest)\.config\./i.test(norm)
    ) {
      return "DevOps";
    }

    // 7. General frontend
    if (norm.startsWith("src/") || norm.startsWith("public/") || norm === "index.html") {
      return "FrontendAgent";
    }

    return "System";
  }

  /**
   * Register or transfer authoritative owner of a path.
   */
  public static registerOwner(
    relativePath: string,
    owner: SubsystemRole,
    force: boolean = false
  ): void {
    const normalized = relativePath.replace(/\\/g, "/").toLowerCase();
    const existing = this.registry.get(normalized);
    if (!existing || force) {
      this.registry.set(normalized, {
        path: relativePath,
        owner,
        registeredAt: existing?.registeredAt || new Date().toISOString(),
        lastModifiedAt: new Date().toISOString(),
        regenerationCount: (existing?.regenerationCount || 0) + (existing && force ? 1 : 0),
      });
    }
  }

  /**
   * Get the registered owner of a path, or derive its default owner.
   */
  public static getOwner(relativePath: string): SubsystemRole {
    const normalized = relativePath.replace(/\\/g, "/").toLowerCase();
    const entry = this.registry.get(normalized);
    if (entry) return entry.owner;
    return this.getDefaultOwnerForPath(relativePath);
  }

  /**
   * Verify if the requesting agent role has authority to write the file.
   *
   * Rules:
   * 1. System has root override authority (e.g. initial scaffold).
   * 2. Author of record (currentOwner === requestingAgent) is allowed.
   * 3. Authorized regeneration (isAuthorizedRegeneration: true) transfers or reaffirms ownership.
   * 4. SafeRepairCoordinator with an authorized repair operation is allowed.
   * 5. Competing agent writes to another agent's file are strictly rejected.
   */
  public static canWrite(
    relativePath: string,
    requestingAgent: SubsystemRole,
    options?: {
      isAuthorizedRegeneration?: boolean;
      repairTicketId?: string;
    }
  ): CanWriteResult {
    const normalized = relativePath.replace(/\\/g, "/").toLowerCase();
    const currentOwner = this.getOwner(relativePath);

    // Root system override
    if (requestingAgent === "System") {
      return { allowed: true, currentOwner };
    }

    // Explicit authorized repair through SafeRepairCoordinator
    if (requestingAgent === "SafeRepairCoordinator") {
      return { allowed: true, currentOwner };
    }

    // Authorized regeneration due to requirement evolution
    if (options?.isAuthorizedRegeneration) {
      this.registerOwner(relativePath, requestingAgent, true);
      return { allowed: true, currentOwner: requestingAgent };
    }

    // Unregistered file being initialized by appropriate layer agent
    if (!this.registry.has(normalized)) {
      this.registerOwner(relativePath, requestingAgent);
      return { allowed: true, currentOwner: requestingAgent };
    }

    // Same owner
    if (currentOwner === requestingAgent) {
      return { allowed: true, currentOwner };
    }

    // DatabaseAgent alias compatibility with AuthorizedSchemaManager
    if (
      (currentOwner === "AuthorizedSchemaManager" && requestingAgent === "DatabaseAgent") ||
      (currentOwner === "DatabaseAgent" && requestingAgent === "AuthorizedSchemaManager")
    ) {
      return { allowed: true, currentOwner };
    }

    return {
      allowed: false,
      currentOwner,
      reason: `UNAUTHORIZED_FILE_MUTATION: File "${relativePath}" is owned by ${currentOwner}. Write rejected for role "${requestingAgent}". Modifications must occur through an authorized regeneration or SafeRepairCoordinator.`,
    };
  }

  /**
   * Authorize regeneration of a specific file when requirements change.
   */
  public static authorizeRegeneration(relativePath: string, newOwner?: SubsystemRole): void {
    const normalized = relativePath.replace(/\\/g, "/").toLowerCase();
    const targetOwner = newOwner || this.getDefaultOwnerForPath(relativePath);
    this.registerOwner(relativePath, targetOwner, true);
  }

  /**
   * Reset registry (e.g. at the start of a fresh generation run).
   */
  public static reset(): void {
    this.registry.clear();
  }

  /**
   * Snapshot all ownership entries for diagnostics and reporting.
   */
  public static getAllOwnerships(): FileOwnershipEntry[] {
    return Array.from(this.registry.values());
  }
}
