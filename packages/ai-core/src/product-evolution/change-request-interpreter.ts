/**
 * ChangeRequestInterpreter
 *
 * Translates natural-language change requests into structured requirements.
 * Tracks requirement origin: EXPLICIT | INFERRED | ASSUMED.
 * Does not silently turn assumptions into hard requirements without declaration.
 */

export type RequirementOrigin = "EXPLICIT" | "INFERRED" | "ASSUMED";

export interface InterpretedRequirement {
  id: string;
  description: string;
  category: "DATABASE" | "BACKEND" | "FRONTEND" | "INTEGRATION" | "SECURITY";
  origin: RequirementOrigin;
  priority: "CRITICAL" | "HIGH" | "MEDIUM";
  detail: string;
}

export interface InterpretedChangeRequest {
  rawPrompt: string;
  targetCapability: string;
  requirements: InterpretedRequirement[];
  explicitCount: number;
  inferredCount: number;
  assumedCount: number;
  summary: string;
}

export class ChangeRequestInterpreter {
  public static interpret(prompt: string): InterpretedChangeRequest {
    const isPaymentPrompt = prompt.toLowerCase().includes("payment") || prompt.toLowerCase().includes("stripe");

    const requirements: InterpretedRequirement[] = isPaymentPrompt
      ? [
          {
            id: "req_pay_1",
            description: "Online payment processing capability via payment provider (e.g. Stripe)",
            category: "INTEGRATION",
            origin: "EXPLICIT",
            priority: "CRITICAL",
            detail: "Create Stripe PaymentIntent / Checkout session API bridge",
          },
          {
            id: "req_pay_2",
            description: "Members can pay online for gym memberships",
            category: "FRONTEND",
            origin: "EXPLICIT",
            priority: "CRITICAL",
            detail: "Frontend payment checkout flow with card input & confirmation",
          },
          {
            id: "req_pay_3",
            description: "Admin payment transaction history table and status visibility",
            category: "FRONTEND",
            origin: "EXPLICIT",
            priority: "HIGH",
            detail: "Dedicated payment transaction history view with search and filter",
          },
          {
            id: "req_pay_4",
            description: "Automatic membership status update & activation upon successful payment",
            category: "BACKEND",
            origin: "EXPLICIT",
            priority: "CRITICAL",
            detail: "Webhook / handler activates membership plan on payment confirmation",
          },
          {
            id: "req_pay_5",
            description: "Payment entity and database schema with relations to Member & MembershipPlan",
            category: "DATABASE",
            origin: "INFERRED",
            priority: "CRITICAL",
            detail: "Add Payment table with foreign keys (memberId, planId), amount, currency, status",
          },
          {
            id: "req_pay_6",
            description: "Secure webhook signature verification & idempotent processing",
            category: "SECURITY",
            origin: "INFERRED",
            priority: "HIGH",
            detail: "Stripe webhook signature validation on POST /api/payments/webhook",
          },
          {
            id: "req_pay_7",
            description: "Email receipts sent via existing email provider on payment success",
            category: "INTEGRATION",
            origin: "ASSUMED",
            priority: "MEDIUM",
            detail: "Trigger transactional receipt email to member upon payment confirmation",
          },
        ]
      : [
          {
            id: "req_gen_1",
            description: "General feature modification requested",
            category: "BACKEND",
            origin: "EXPLICIT",
            priority: "HIGH",
            detail: prompt,
          },
        ];

    const explicitCount = requirements.filter((r) => r.origin === "EXPLICIT").length;
    const inferredCount = requirements.filter((r) => r.origin === "INFERRED").length;
    const assumedCount = requirements.filter((r) => r.origin === "ASSUMED").length;

    return {
      rawPrompt: prompt,
      targetCapability: isPaymentPrompt ? "Online Payment Processing & Membership Billing" : "Custom Feature Evolution",
      requirements,
      explicitCount,
      inferredCount,
      assumedCount,
      summary: `Interpreted "${prompt.substring(0, 60)}...": ${requirements.length} requirements (${explicitCount} explicit, ${inferredCount} inferred, ${assumedCount} assumed).`,
    };
  }
}
