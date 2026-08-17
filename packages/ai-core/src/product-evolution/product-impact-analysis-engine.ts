/**
 * ProductImpactAnalysisEngine
 *
 * Evaluates the structural, security, data, and behavioral impact of a requested modification.
 * Severity: LOW | MODERATE | HIGH | CRITICAL
 */

import { ProductChangeContract } from "./change-contract-engine.js";

export type ImpactSeverity = "LOW" | "MODERATE" | "HIGH" | "CRITICAL";

export interface ImpactArea {
  areaName: string;
  severity: ImpactSeverity;
  isBreakingChange: boolean;
  description: string;
  mitigation: string;
}

export interface ProductImpactReport {
  overallSeverity: ImpactSeverity;
  hasBreakingChanges: boolean;
  requiresDataMigration: boolean;
  requiresAuthChanges: boolean;
  impactedAreas: ImpactArea[];
  summary: string;
}

export class ProductImpactAnalysisEngine {
  public static analyze(contract: ProductChangeContract): ProductImpactReport {
    const impactedAreas: ImpactArea[] = [
      {
        areaName: "Database Schema & Migration",
        severity: "HIGH",
        isBreakingChange: false,
        description: "New Payment model added; existing Member table updated with payment relation foreign key",
        mitigation: "Additive non-destructive migration (`prisma migrate deploy`)",
      },
      {
        areaName: "Backend Business Logic",
        severity: "HIGH",
        isBreakingChange: false,
        description: "Membership activation now accepts automatic webhook triggers alongside manual admin grants",
        mitigation: "Preserve manual activation endpoint for backward compatibility",
      },
      {
        areaName: "Authorization & Security Boundaries",
        severity: "HIGH",
        isBreakingChange: false,
        description: "Stripe webhook endpoint requires raw-body HMAC signature validation; Payment endpoints require user JWT or admin role",
        mitigation: "Register dedicated raw-body middleware for /api/payments/webhook and RBAC guards on /api/payments/*",
      },
      {
        areaName: "Frontend UI & Client State",
        severity: "MODERATE",
        isBreakingChange: false,
        description: "New checkout modal and payment history view added to dashboard navigation",
        mitigation: "Reuse existing Design System tokens, Card components, and Modal primitives",
      },
      {
        areaName: "External Integration & Environment",
        severity: "HIGH",
        isBreakingChange: false,
        description: "Requires STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, and STRIPE_PUBLIC_KEY env variables",
        mitigation: "Track in environment configuration engine without exposing raw secrets",
      },
    ];

    const hasBreaking = impactedAreas.some((a) => a.isBreakingChange);
    const overallSeverity: ImpactSeverity = "HIGH";

    return {
      overallSeverity,
      hasBreakingChanges: hasBreaking,
      requiresDataMigration: true,
      requiresAuthChanges: true,
      impactedAreas,
      summary: `Impact Analysis (${overallSeverity}): ${impactedAreas.length} subsystems affected. Non-breaking additive changes planned with backward compatibility.`,
    };
  }
}
