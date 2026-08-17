/**
 * DeploymentPlanEngine
 *
 * Creates a machine-readable deployment plan BEFORE execution begins.
 * Rollback strategy is mandatory before any execution starts.
 * Invariant: no deployment executes without an approved plan.
 */

export type DeploymentTarget = "LOCAL" | "VPS" | "RAILWAY" | "VERCEL" | "RENDER" | "DOCKER" | "KUBERNETES";

export interface DeploymentPlan {
  planId: string;
  target: DeploymentTarget;
  productName: string;
  buildCommand: string;
  startCommand: string;
  migrationCommand: string;
  healthChecks: string[];
  smokeTests: string[];
  requiredEnvironment: string[];
  ports: { backend: number; frontend: number; database: number };
  rollbackStrategy: string;
  rollbackCommand: string;
  estimatedDurationMs: number;
  approvedAt: string;
}

export class DeploymentPlanEngine {
  public static createPlan(
    productName: string,
    target: DeploymentTarget = "LOCAL",
    requiredEnvVars: string[] = ["DATABASE_URL", "JWT_SECRET", "NODE_ENV"]
  ): DeploymentPlan {
    const safeName = productName.toLowerCase().replace(/\s+/g, "-");
    return {
      planId: `plan_${Date.now()}`,
      target,
      productName,
      buildCommand: `cd ${safeName} && pnpm install && pnpm run build`,
      startCommand: `cd ${safeName} && pnpm run start`,
      migrationCommand: `cd ${safeName} && pnpm exec prisma migrate deploy`,
      healthChecks: [
        "GET http://localhost:3001/health → 200",
        "GET http://localhost:5173 → 200",
        "Database connection → CONNECTED",
      ],
      smokeTests: [
        "POST /api/auth/login → 200 + JWT",
        "GET /api/members (auth) → 200 + array",
        "POST /api/members (auth) → 201 + record",
        "POST /api/attendance (auth) → 201 + record",
        "GET /api/reports/attendance (auth) → 200",
        "Browser: /dashboard loads",
        "Browser: /members loads and form submits",
      ],
      requiredEnvironment: requiredEnvVars,
      ports: { backend: 3001, frontend: 5173, database: 5432 },
      rollbackStrategy: "PREVIOUS_BUILD_RESTORE",
      rollbackCommand: `cd ${safeName} && git stash && pnpm run start`,
      estimatedDurationMs: 120_000,
      approvedAt: new Date().toISOString(),
    };
  }
}
