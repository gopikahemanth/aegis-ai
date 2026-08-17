/**
 * InfrastructurePlanEngine
 *
 * Creates a machine-readable infrastructure plan BEFORE mutation.
 * Invariant: INFRASTRUCTURE PLAN ≠ INFRASTRUCTURE EXECUTION
 */

import { HostingTarget } from "./hosting-target-engine.js";

export interface InfrastructurePlanStep {
  order: number;
  phase: string;
  component: string;
  action: string;
  dependencies: string[];
  estimatedMs: number;
}

export interface InfrastructurePlan {
  planId: string;
  productName: string;
  target: HostingTarget;
  steps: InfrastructurePlanStep[];
  domain: string;
  tlsEnabled: boolean;
  backupStrategy: string;
  rollbackStrategy: string;
  healthCheckEndpoints: string[];
  approvedAt: string;
  summary: string;
}

export class InfrastructurePlanEngine {
  public static createPlan(
    productName: string,
    target: HostingTarget,
    opts: {
      domain?: string;
      tlsEnabled?: boolean;
      backupStrategy?: string;
      rollbackStrategy?: string;
    } = {}
  ): InfrastructurePlan {
    const {
      domain = "aegisgym.com",
      tlsEnabled = true,
      backupStrategy = "DAILY_SNAPSHOT_RECOVERY",
      rollbackStrategy = "PREVIOUS_INFRASTRUCTURE_STATE_RESTORE",
    } = opts;

    const steps: InfrastructurePlanStep[] = [
      { order: 1, phase: "DATABASE", component: "PostgreSQL Engine", action: "Provision schema & verify connection pool", dependencies: [], estimatedMs: 3000 },
      { order: 2, phase: "BACKEND", component: "API Compute Service", action: "Start Express service on target port", dependencies: ["DATABASE"], estimatedMs: 2500 },
      { order: 3, phase: "FRONTEND", component: "Static / Client Host", action: "Deploy Vite bundle & configure reverse proxy", dependencies: ["BACKEND"], estimatedMs: 2000 },
      { order: 4, phase: "DOMAIN", component: "DNS & Router", action: `Configure records for ${domain} & api.${domain}`, dependencies: ["FRONTEND", "BACKEND"], estimatedMs: 1500 },
      { order: 5, phase: "TLS", component: "Certificate Manager", action: `Issue & bind TLS certificate for ${domain}`, dependencies: ["DOMAIN"], estimatedMs: 2000 },
      { order: 6, phase: "MONITORING", component: "Health & Telemetry", action: "Activate health checks and metric probes", dependencies: ["FRONTEND", "BACKEND", "TLS"], estimatedMs: 1000 },
      { order: 7, phase: "BACKUP", component: "Snapshot Engine", action: "Schedule automated database snapshots", dependencies: ["DATABASE"], estimatedMs: 1000 },
    ];

    return {
      planId: `inf_plan_${Date.now()}`,
      productName,
      target,
      steps,
      domain,
      tlsEnabled,
      backupStrategy,
      rollbackStrategy,
      healthCheckEndpoints: [
        `http://localhost:${target.ports.backend}/health`,
        `http://localhost:${target.ports.frontend}`,
      ],
      approvedAt: new Date().toISOString(),
      summary: `Infrastructure plan for ${productName} on ${target.type} target: 7 steps, domain=${domain}, TLS=${tlsEnabled}.`,
    };
  }
}
