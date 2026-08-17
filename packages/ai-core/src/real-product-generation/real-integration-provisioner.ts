/**
 * RealIntegrationProvisioner
 *
 * Classifies and verifies external service integrations.
 * Never claims a real external integration is operational without confirmed credentials.
 */

export type IntegrationVerificationState =
  | "VERIFIED"
  | "CONFIGURATION_REQUIRED"
  | "OPTIONAL"
  | "FAILED";

export interface RealIntegrationContract {
  serviceName: string;
  category: "PAYMENT" | "EMAIL" | "STORAGE" | "OAUTH" | "ANALYTICS" | "NOTIFICATIONS";
  state: IntegrationVerificationState;
  requiredEnvVars: string[];
  clientInterface: string;
  reason: string;
}

export class RealIntegrationProvisioner {
  public static classify(requestedIntegrations: string[]): RealIntegrationContract[] {
    return requestedIntegrations.map((svc) => {
      const lower = svc.toLowerCase();

      if (lower.includes("payment") || lower.includes("stripe")) {
        return {
          serviceName: "Stripe",
          category: "PAYMENT",
          state: "CONFIGURATION_REQUIRED",
          requiredEnvVars: ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET", "STRIPE_PUBLISHABLE_KEY"],
          clientInterface: "stripeClient.paymentIntents.create()",
          reason: "Stripe API credentials required. Add STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET to .env",
        };
      }

      if (lower.includes("email") || lower.includes("resend") || lower.includes("sendgrid")) {
        return {
          serviceName: "Resend",
          category: "EMAIL",
          state: "CONFIGURATION_REQUIRED",
          requiredEnvVars: ["RESEND_API_KEY"],
          clientInterface: "resendClient.emails.send()",
          reason: "Email service credentials required. Add RESEND_API_KEY to .env",
        };
      }

      if (lower.includes("s3") || lower.includes("storage") || lower.includes("upload")) {
        return {
          serviceName: "AWS S3",
          category: "STORAGE",
          state: "CONFIGURATION_REQUIRED",
          requiredEnvVars: ["AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "AWS_S3_BUCKET"],
          clientInterface: "s3Client.putObject()",
          reason: "AWS S3 credentials required for file storage.",
        };
      }

      if (lower.includes("analytics")) {
        return {
          serviceName: "Analytics",
          category: "ANALYTICS",
          state: "OPTIONAL",
          requiredEnvVars: ["ANALYTICS_API_KEY"],
          clientInterface: "analyticsClient.track()",
          reason: "Analytics integration is optional and can be configured post-deployment.",
        };
      }

      return {
        serviceName: svc,
        category: "NOTIFICATIONS",
        state: "CONFIGURATION_REQUIRED",
        requiredEnvVars: [`${svc.toUpperCase().replace(/\s+/g, "_")}_API_KEY`],
        clientInterface: `${svc.toLowerCase().replace(/\s+/g, "")}Client.send()`,
        reason: `${svc} requires API credentials. See .env.template for required variables.`,
      };
    });
  }
}
