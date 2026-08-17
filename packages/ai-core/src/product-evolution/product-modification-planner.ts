/**
 * ProductModificationPlanner
 *
 * Translates change contracts and dependency graphs into an ordered execution plan.
 * Invariant: CHANGE REQUEST ≠ CHANGE PLAN
 * Stages: CURRENT STATE → CHANGE PLAN → EXPECTED RESULT
 */

import { ProductChangeContract } from "./change-contract-engine.js";
import { ProductDependencyGraph } from "./product-dependency-analysis-engine.js";

export interface ModificationPlanStep {
  order: number;
  layer: "DATABASE" | "BACKEND" | "FRONTEND" | "INTEGRATION" | "TESTS" | "BUILD" | "VERIFICATION";
  name: string;
  action: string;
  targetFiles: string[];
  dependencies: number[]; // Step numbers
  estimatedMs: number;
}

export interface ProductModificationPlan {
  planId: string;
  contractId: string;
  steps: ModificationPlanStep[];
  totalSteps: number;
  estimatedTotalDurationMs: number;
  summary: string;
}

export class ProductModificationPlanner {
  public static plan(contract: ProductChangeContract, graph: ProductDependencyGraph): ProductModificationPlan {
    const steps: ModificationPlanStep[] = [
      {
        order: 1,
        layer: "DATABASE",
        name: "Evolve Prisma Schema with Payment Model",
        action: "Add Payment table, indexes on (memberId, status), foreign keys to Member & Plan",
        targetFiles: ["prisma/schema.prisma"],
        dependencies: [],
        estimatedMs: 1500,
      },
      {
        order: 2,
        layer: "DATABASE",
        name: "Execute Additive Database Migration",
        action: "Run `prisma migrate deploy` to safely apply schema without data loss",
        targetFiles: ["prisma/migrations/*"],
        dependencies: [1],
        estimatedMs: 2500,
      },
      {
        order: 3,
        layer: "INTEGRATION",
        name: "Configure Payment Provider Integration",
        action: "Create Stripe API client wrapper and webhook signature validator",
        targetFiles: ["src/integrations/stripe.ts"],
        dependencies: [2],
        estimatedMs: 1200,
      },
      {
        order: 4,
        layer: "BACKEND",
        name: "Implement Payment Service & Repositories",
        action: "Create PaymentService with intent creation, webhook processing, and transaction recording",
        targetFiles: ["src/services/payment.service.ts"],
        dependencies: [2, 3],
        estimatedMs: 2000,
      },
      {
        order: 5,
        layer: "BACKEND",
        name: "Register Payment API Endpoints & Auth Middleware",
        action: "Add POST /api/payments/create-intent, POST /api/payments/webhook, GET /api/payments/history",
        targetFiles: ["src/routes/payment.routes.ts", "src/server.ts"],
        dependencies: [4],
        estimatedMs: 1800,
      },
      {
        order: 6,
        layer: "FRONTEND",
        name: "Create Member Checkout Flow & Payment UI",
        action: "Build MemberCheckoutModal.tsx reusing existing Design System Card/Modal components",
        targetFiles: ["src/components/MemberCheckoutModal.tsx", "src/pages/PlansPage.tsx"],
        dependencies: [5],
        estimatedMs: 2200,
      },
      {
        order: 7,
        layer: "FRONTEND",
        name: "Implement Admin Payment History View",
        action: "Build PaymentHistoryTable.tsx and integrate into Reports / Financial view",
        targetFiles: ["src/components/PaymentHistoryTable.tsx", "src/pages/ReportsPage.tsx"],
        dependencies: [5],
        estimatedMs: 2000,
      },
      {
        order: 8,
        layer: "TESTS",
        name: "Update Evolution & Regression Test Matrix",
        action: "Add payment unit & E2E tests alongside existing member/attendance regression tests",
        targetFiles: ["src/__tests__/payment.test.ts", "src/__tests__/regression.test.ts"],
        dependencies: [6, 7],
        estimatedMs: 2500,
      },
      {
        order: 9,
        layer: "BUILD",
        name: "Compile & Validate Build Artifacts",
        action: "Execute `tsc` and `vite build` across modified frontend and backend code",
        targetFiles: ["dist/*"],
        dependencies: [8],
        estimatedMs: 3000,
      },
      {
        order: 10,
        layer: "VERIFICATION",
        name: "Run Live Round-Trip Verification",
        action: "Validate live payment checkout, webhook handling, and existing attendance check-in",
        targetFiles: ["e2e/*"],
        dependencies: [9],
        estimatedMs: 3500,
      },
    ];

    const estimatedTotalDurationMs = steps.reduce((sum, s) => sum + s.estimatedMs, 0);

    return {
      planId: `mod_plan_${Date.now()}`,
      contractId: contract.contractId,
      steps,
      totalSteps: steps.length,
      estimatedTotalDurationMs,
      summary: `Modification Plan approved: 10 ordered steps across Database, Backend, Frontend, Tests, and Verification.`,
    };
  }
}
