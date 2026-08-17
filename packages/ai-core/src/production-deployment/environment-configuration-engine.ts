/**
 * EnvironmentConfigurationEngine
 *
 * Generates a production configuration contract.
 * Tracks required, optional, and secret variables.
 * Never exposes secret values in logs or certificates.
 * Missing credentials → CONFIGURATION_REQUIRED, never DEPLOYMENT_SUCCESS.
 */

export type ConfigVariableState = "PRESENT" | "MISSING" | "PLACEHOLDER";
export type ConfigVariableClass = "REQUIRED" | "OPTIONAL" | "SECRET";

export interface ConfigVariable {
  name: string;
  class: ConfigVariableClass;
  state: ConfigVariableState;
  isSecret: boolean;
  /** Value is NEVER included here — only presence is tracked */
  maskedPresence: boolean;
  description: string;
}

export interface ProductionConfigurationContract {
  isReady: boolean;
  missingRequiredCount: number;
  missingSecretCount: number;
  variables: ConfigVariable[];
  databaseConfig: { url: ConfigVariableState; poolSize: number; sslMode: string };
  apiConfig: { baseUrl: string; port: number; corsOrigin: string };
  frontendConfig: { apiEndpoint: ConfigVariableState; cdnUrl: ConfigVariableState };
  externalServiceConfig: Record<string, { state: ConfigVariableState; reason: string }>;
  configurationRequiredItems: string[];
  summary: string;
}

export class EnvironmentConfigurationEngine {
  public static generateContract(
    presentVars: string[] = [],
    requiredVars: string[] = ["DATABASE_URL", "JWT_SECRET", "NODE_ENV"],
    secretVars: string[] = ["JWT_SECRET", "STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"],
    optionalVars: string[] = ["PORT", "LOG_LEVEL", "SENTRY_DSN"]
  ): ProductionConfigurationContract {
    const allVarNames = Array.from(new Set([...requiredVars, ...secretVars, ...optionalVars]));

    const variables: ConfigVariable[] = allVarNames.map((name) => {
      const isPresent = presentVars.includes(name);
      const isSecret = secretVars.includes(name);
      const isRequired = requiredVars.includes(name);
      return {
        name,
        class: isRequired ? "REQUIRED" : isSecret ? "SECRET" : "OPTIONAL",
        state: isPresent ? "PRESENT" : "MISSING",
        isSecret,
        maskedPresence: isPresent,
        description: `${isRequired ? "Required" : isSecret ? "Secret" : "Optional"} — ${isPresent ? "present" : "MISSING"}`,
      };
    });

    const missingRequired = variables.filter((v) => v.class === "REQUIRED" && v.state === "MISSING");
    const missingSecrets = variables.filter((v) => v.isSecret && v.state === "MISSING");
    const configReqItems = [...missingRequired, ...missingSecrets].map((v) => v.name);

    const dbUrlState = presentVars.includes("DATABASE_URL") ? "PRESENT" : "MISSING";
    const frontendApiState = presentVars.includes("VITE_API_URL") ? "PRESENT" : "MISSING";
    const cdnState = presentVars.includes("CDN_URL") ? "PRESENT" : "MISSING";

    const isReady = missingRequired.length === 0;

    return {
      isReady,
      missingRequiredCount: missingRequired.length,
      missingSecretCount: missingSecrets.length,
      variables,
      databaseConfig: { url: dbUrlState, poolSize: 10, sslMode: "require" },
      apiConfig: { baseUrl: "http://localhost:3001", port: 3001, corsOrigin: "*" },
      frontendConfig: { apiEndpoint: frontendApiState, cdnUrl: cdnState },
      externalServiceConfig: {
        stripe: {
          state: presentVars.includes("STRIPE_SECRET_KEY") ? "PRESENT" : "MISSING",
          reason: "Payment processing — add STRIPE_SECRET_KEY before accepting payments",
        },
        resend: {
          state: presentVars.includes("RESEND_API_KEY") ? "PRESENT" : "MISSING",
          reason: "Email delivery — add RESEND_API_KEY before sending transactional emails",
        },
      },
      configurationRequiredItems: configReqItems,
      summary: isReady
        ? `Configuration READY: all ${requiredVars.length} required vars present. ${configReqItems.length} optional/secret items still require attention.`
        : `Configuration BLOCKED: ${missingRequired.length} required variable(s) missing — ${missingRequired.map((v) => v.name).join(", ")}.`,
    };
  }
}
