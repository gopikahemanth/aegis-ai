/**
 * ProductionConfig & EnvironmentClassification
 *
 * Enforces production-grade configuration validation and secret visibility boundaries.
 * Distinguishes PUBLIC, SERVER_ONLY, and SECRET configuration items.
 */

export type EnvironmentMode = "development" | "test" | "staging" | "production";

export type ConfigVisibility = "PUBLIC" | "SERVER_ONLY" | "SECRET";

export interface ConfigItem {
  key: string;
  value: string;
  visibility: ConfigVisibility;
  required: boolean;
  description: string;
}

export interface ConfigValidationResult {
  valid: boolean;
  mode: EnvironmentMode;
  missingRequired: string[];
  exposedSecrets: string[];
  sanitizedConfig: Record<string, string>;
  errors: string[];
}

export class ProductionConfigManager {
  private static readonly SENSITIVE_KEY_PATTERNS = [
    /password/i,
    /secret/i,
    /api[_-]?key/i,
    /private[_-]?key/i,
    /bearer/i,
    /database[_-]?url/i,
    /jwt/i,
    /auth/i,
  ];

  /**
   * Determine configuration item visibility classification.
   */
  public static classifyVisibility(key: string): ConfigVisibility {
    for (const pattern of this.SENSITIVE_KEY_PATTERNS) {
      if (pattern.test(key)) return "SECRET";
    }
    if (key.startsWith("VITE_") || key.startsWith("NEXT_PUBLIC_") || key.startsWith("PUBLIC_")) {
      return "PUBLIC";
    }
    return "SERVER_ONLY";
  }

  /**
   * Validate configuration for target environment mode.
   */
  public static validate(
    config: Record<string, string>,
    mode: EnvironmentMode = "production",
    requiredKeys: string[] = []
  ): ConfigValidationResult {
    const missingRequired: string[] = [];
    const exposedSecrets: string[] = [];
    const sanitizedConfig: Record<string, string> = {};
    const errors: string[] = [];

    // Check required keys
    for (const key of requiredKeys) {
      if (!config[key] || config[key].trim() === "") {
        missingRequired.push(key);
      }
    }

    if (missingRequired.length > 0) {
      errors.push(`CONFIGURATION_ERROR: Missing required config keys for ${mode}: [${missingRequired.join(", ")}].`);
    }

    // Check for exposed secrets in public variables
    for (const [key, value] of Object.entries(config)) {
      const isPublicNamed = key.startsWith("VITE_") || key.startsWith("NEXT_PUBLIC_") || key.startsWith("PUBLIC_");
      const looksLikeSecret = this.SENSITIVE_KEY_PATTERNS.some((p) => p.test(key));

      if (isPublicNamed && looksLikeSecret) {
        exposedSecrets.push(key);
        errors.push(`SECURITY_ERROR: Sensitive credential "${key}" is named as public client variable.`);
      }

      // Sanitize secrets for representation
      if (looksLikeSecret) {
        sanitizedConfig[key] = "[REDACTED_SECRET]";
      } else {
        sanitizedConfig[key] = value;
      }
    }

    return {
      valid: errors.length === 0,
      mode,
      missingRequired,
      exposedSecrets,
      sanitizedConfig,
      errors,
    };
  }
}
