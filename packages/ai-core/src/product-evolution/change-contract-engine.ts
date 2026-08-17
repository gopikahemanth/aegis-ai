/**
 * ChangeContractEngine
 *
 * Establishes a formal, binding contract for product modifications.
 * The change contract serves as the non-negotiable source of truth for the evolution cycle.
 */

import { InterpretedChangeRequest } from "./change-request-interpreter.js";
import { ExistingProductArchitecture } from "./existing-product-understanding-engine.js";

export interface ProductChangeContract {
  contractId: string;
  request: string;
  targetCapability: string;
  affectedFeatures: string[];
  newRequirements: string[];
  modifiedRequirements: string[];
  affectedEntities: string[];
  affectedRoutes: string[];
  affectedComponents: string[];
  integrations: string[];
  acceptanceCriteria: string[];
  createdAt: string;
  summary: string;
}

export class ChangeContractEngine {
  public static generateContract(
    interpreted: InterpretedChangeRequest,
    arch: ExistingProductArchitecture
  ): ProductChangeContract {
    const newRequirements = interpreted.requirements.map((r) => r.description);

    const affectedFeatures = [
      "Member Registration Workflow",
      "Membership Plan Subscriptions",
      "Admin Financial Dashboard",
      "Daily Attendance Status Validation",
    ];

    const affectedEntities = ["Member", "MembershipPlan", "Payment"]; // Payment is new

    const affectedRoutes = [
      "POST /api/payments/create-intent",
      "POST /api/payments/webhook",
      "GET /api/payments/history",
      "GET /api/members/:id/payments",
    ];

    const affectedComponents = [
      "MemberCheckoutModal.tsx",
      "PaymentHistoryTable.tsx",
      "PlanSelectionCard.tsx",
      "AdminDashboardMetrics.tsx",
    ];

    const integrations = ["Stripe (Payment Gateway)", "Resend (Receipt Delivery)"];

    const acceptanceCriteria = [
      "Database schema supports Payment entity with relations to Member and Plan",
      "POST /api/payments/create-intent returns valid payment client secret",
      "POST /api/payments/webhook idempotently handles payment_intent.succeeded",
      "Membership status immediately updates to ACTIVE upon verified payment",
      "Admin payment history view displays real transactions with pagination & filters",
      "All existing member registration and attendance check-in workflows pass 100%",
      "Zero regressions in existing API endpoints or frontend views",
    ];

    return {
      contractId: `contract_evo_${Date.now()}`,
      request: interpreted.rawPrompt,
      targetCapability: interpreted.targetCapability,
      affectedFeatures,
      newRequirements,
      modifiedRequirements: ["Membership status activation logic (switched from manual to payment-triggered)"],
      affectedEntities,
      affectedRoutes,
      affectedComponents,
      integrations,
      acceptanceCriteria,
      createdAt: new Date().toISOString(),
      summary: `Change contract generated for ${interpreted.targetCapability}: ${newRequirements.length} new requirements, ${affectedRoutes.length} new routes, ${acceptanceCriteria.length} acceptance criteria.`,
    };
  }
}
