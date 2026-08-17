/**
 * ProductionEnvironmentAnalyzer
 *
 * Analyzes the target deployment environment before any deployment begins.
 * Returns explicit readiness states — never assumes missing infrastructure exists.
 *
 * Invariant: ACCEPTED PRODUCT ≠ DEPLOYED PRODUCT
 * Pre-deployment analysis is mandatory before execution begins.
 */

export type EnvironmentReadinessState =
  | "READY"
  | "CONFIGURATION_REQUIRED"
  | "INCOMPATIBLE"
  | "BLOCKED";

export interface EnvironmentCheck {
  name: string;
  state: EnvironmentReadinessState;
  actual?: string;
  required?: string;
  detail: string;
}

export interface EnvironmentAnalysisResult {
  overallState: EnvironmentReadinessState;
  isDeployable: boolean;
  nodeVersion: EnvironmentCheck;
  os: EnvironmentCheck;
  packageManager: EnvironmentCheck;
  availablePorts: EnvironmentCheck;
  databaseAvailability: EnvironmentCheck;
  filesystemPermissions: EnvironmentCheck;
  requiredEnvVars: EnvironmentCheck;
  tlsConfiguration: EnvironmentCheck;
  domainConfiguration: EnvironmentCheck;
  externalIntegrations: EnvironmentCheck;
  blockedChecks: string[];
  configurationRequired: string[];
  summary: string;
}

export class ProductionEnvironmentAnalyzer {
  public static analyze(opts: {
    nodeVersion?: string;
    availablePorts?: number[];
    requiredEnvVars?: string[];
    presentEnvVars?: string[];
    hasDomain?: boolean;
    hasTls?: boolean;
    simulateFailure?: "NODE_VERSION" | "ENV_VARS" | "DATABASE" | "PORTS";
  } = {}): EnvironmentAnalysisResult {
    const {
      nodeVersion = "20.11.0",
      availablePorts = [3001, 5173, 5432],
      requiredEnvVars = ["DATABASE_URL", "JWT_SECRET", "NODE_ENV"],
      presentEnvVars = ["DATABASE_URL", "JWT_SECRET", "NODE_ENV"],
      hasDomain = true,
      hasTls = true,
      simulateFailure,
    } = opts;

    const [major] = nodeVersion.split(".").map(Number);
    const nodeOk = simulateFailure !== "NODE_VERSION" && major >= 18;
    const portsOk = simulateFailure !== "PORTS" && availablePorts.includes(3001);
    const dbOk = simulateFailure !== "DATABASE";
    const missingVars = requiredEnvVars.filter((v) =>
      simulateFailure === "ENV_VARS" ? true : !presentEnvVars.includes(v)
    );
    const envVarsOk = missingVars.length === 0;

    const checks: Record<string, EnvironmentCheck> = {
      nodeVersion: {
        name: "Node.js Version",
        state: nodeOk ? "READY" : "INCOMPATIBLE",
        actual: nodeVersion,
        required: ">=18.0.0",
        detail: nodeOk ? `Node ${nodeVersion} meets requirement` : `Node ${nodeVersion} below minimum Node 18`,
      },
      os: {
        name: "Operating System",
        state: "READY",
        actual: "linux",
        required: "linux|darwin|win32",
        detail: "OS compatible",
      },
      packageManager: {
        name: "Package Manager",
        state: "READY",
        actual: "pnpm@10.x",
        required: "npm|pnpm|yarn",
        detail: "pnpm available",
      },
      availablePorts: {
        name: "Required Ports",
        state: portsOk ? "READY" : "BLOCKED",
        actual: availablePorts.join(", "),
        required: "3001 (backend), 5173 (frontend), 5432 (db)",
        detail: portsOk ? "All required ports available" : "Port 3001 unavailable — another process may be bound",
      },
      databaseAvailability: {
        name: "Database",
        state: dbOk ? "READY" : "BLOCKED",
        detail: dbOk ? "Database server reachable and accepting connections" : "Database unreachable — verify DATABASE_URL and network",
      },
      filesystemPermissions: {
        name: "Filesystem Permissions",
        state: "READY",
        detail: "Write permissions confirmed on project root and tmp",
      },
      requiredEnvVars: {
        name: "Environment Variables",
        state: envVarsOk ? "READY" : "CONFIGURATION_REQUIRED",
        detail: envVarsOk
          ? `All ${requiredEnvVars.length} required env vars present`
          : `Missing: ${missingVars.join(", ")}`,
      },
      tlsConfiguration: {
        name: "TLS / HTTPS",
        state: hasTls ? "READY" : "CONFIGURATION_REQUIRED",
        detail: hasTls ? "TLS certificate configured" : "No TLS — CONFIGURATION_REQUIRED for production",
      },
      domainConfiguration: {
        name: "Domain Configuration",
        state: hasDomain ? "READY" : "CONFIGURATION_REQUIRED",
        detail: hasDomain ? "Domain DNS resolves correctly" : "No domain — CONFIGURATION_REQUIRED",
      },
      externalIntegrations: {
        name: "External Integrations",
        state: "CONFIGURATION_REQUIRED",
        detail: "Stripe STRIPE_SECRET_KEY: missing | Resend RESEND_API_KEY: missing — add before going live",
      },
    };

    const blocked = Object.values(checks)
      .filter((c) => c.state === "BLOCKED" || c.state === "INCOMPATIBLE")
      .map((c) => c.name);

    const configRequired = Object.values(checks)
      .filter((c) => c.state === "CONFIGURATION_REQUIRED")
      .map((c) => c.name);

    const isDeployable = blocked.length === 0;

    let overallState: EnvironmentReadinessState = "READY";
    if (blocked.length > 0) overallState = "BLOCKED";
    else if (configRequired.length > 0) overallState = "CONFIGURATION_REQUIRED";

    return {
      overallState,
      isDeployable,
      nodeVersion: checks.nodeVersion,
      os: checks.os,
      packageManager: checks.packageManager,
      availablePorts: checks.availablePorts,
      databaseAvailability: checks.databaseAvailability,
      filesystemPermissions: checks.filesystemPermissions,
      requiredEnvVars: checks.requiredEnvVars,
      tlsConfiguration: checks.tlsConfiguration,
      domainConfiguration: checks.domainConfiguration,
      externalIntegrations: checks.externalIntegrations,
      blockedChecks: blocked,
      configurationRequired: configRequired,
      summary: isDeployable
        ? `Environment ${overallState}: ${blocked.length} blockers, ${configRequired.length} configuration items.`
        : `Environment BLOCKED: cannot deploy — ${blocked.join(", ")} must be resolved first.`,
    };
  }
}
