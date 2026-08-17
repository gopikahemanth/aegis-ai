/**
 * IntegrationImplementationEngine
 *
 * Models and verifies external service integrations (Stripe payments, Resend email, S3 storage, OAuth).
 * Invariant: MOCK INTEGRATION != REAL INTEGRATION (Flags INTEGRATION_REQUIRES_CONFIGURATION when keys absent).
 */

export type IntegrationStatus = "INTEGRATED_AND_VERIFIED" | "INTEGRATION_REQUIRES_CONFIGURATION" | "NOT_REQUESTED";

export interface IntegrationContract {
  serviceName: string;
  category: "PAYMENT" | "EMAIL" | "STORAGE" | "OAUTH" | "ANALYTICS";
  envKeysRequired: string[];
  clientInterface: string;
  status: IntegrationStatus;
}

export class IntegrationImplementationEngine {
  public static modelIntegrations(requestedServices: string[] = ["payments", "email"]): IntegrationContract[] {
    return requestedServices.map((svc) => {
      const lower = svc.toLowerCase();
      if (lower.includes("pay") || lower.includes("stripe")) {
        return {
          serviceName: "Stripe",
          category: "PAYMENT",
          envKeysRequired: ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"],
          clientInterface: "stripeClient.paymentIntents.create()",
          status: "INTEGRATION_REQUIRES_CONFIGURATION",
        };
      }

      if (lower.includes("mail") || lower.includes("email") || lower.includes("resend")) {
        return {
          serviceName: "Resend",
          category: "EMAIL",
          envKeysRequired: ["RESEND_API_KEY"],
          clientInterface: "resendClient.emails.send()",
          status: "INTEGRATION_REQUIRES_CONFIGURATION",
        };
      }

      return {
        serviceName: svc,
        category: "ANALYTICS",
        envKeysRequired: [`${svc.toUpperCase()}_API_KEY`],
        clientInterface: `${svc}Client.init()`,
        status: "INTEGRATION_REQUIRES_CONFIGURATION",
      };
    });
  }
}
