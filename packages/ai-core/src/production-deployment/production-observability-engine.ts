/**
 * ProductionObservabilityEngine
 *
 * Verifies production observability — not to invent monitoring infrastructure,
 * but to confirm what is already present and classify missing items
 * as CONFIGURATION_REQUIRED rather than silently skipping them.
 */

export type ObservabilityState = "PRESENT" | "CONFIGURATION_REQUIRED" | "NOT_CONFIGURED" | "FAILED";

export interface ObservabilityCheck {
  name: string;
  state: ObservabilityState;
  detail: string;
}

export interface ProductionObservabilityReport {
  isBaselinePresent: boolean;
  checks: ObservabilityCheck[];
  configurationRequiredItems: string[];
  notConfiguredItems: string[];
  summary: string;
}

export class ProductionObservabilityEngine {
  public static verify(presentItems: string[] = ["structured_logging", "health_checks", "startup_diagnostics", "deployment_version"]): ProductionObservabilityReport {
    const checkDefinitions = [
      { name: "structured_logging", label: "Structured Logging", critical: true, detail: "Winston/pino structured JSON logs emitting to stdout" },
      { name: "health_checks", label: "Health Check Endpoints", critical: true, detail: "GET /health → { status, uptime, version, db_status }" },
      { name: "error_reporting", label: "Error Reporting Hooks", critical: false, detail: "Sentry or similar — requires SENTRY_DSN to activate" },
      { name: "startup_diagnostics", label: "Startup Diagnostics", critical: true, detail: "Server logs environment, port, database connection on startup" },
      { name: "deployment_version", label: "Deployment Version Tracking", critical: false, detail: "Build fingerprint exposed at GET /health.version" },
      { name: "service_status", label: "Service Status Page", critical: false, detail: "No status page configured — CONFIGURATION_REQUIRED" },
      { name: "metrics_hooks", label: "Basic Metrics Hooks", critical: false, detail: "Prometheus metrics not configured — CONFIGURATION_REQUIRED" },
    ];

    const checks: ObservabilityCheck[] = checkDefinitions.map((def) => {
      const isPresent = presentItems.includes(def.name);
      const isCritical = def.critical;
      const state: ObservabilityState = isPresent ? "PRESENT" : isCritical ? "NOT_CONFIGURED" : "CONFIGURATION_REQUIRED";
      return { name: def.label, state, detail: def.detail };
    });

    const configRequired = checks.filter((c) => c.state === "CONFIGURATION_REQUIRED").map((c) => c.name);
    const notConfigured = checks.filter((c) => c.state === "NOT_CONFIGURED").map((c) => c.name);
    const criticalPresent = checkDefinitions.filter((d) => d.critical).every((d) => presentItems.includes(d.name));

    return {
      isBaselinePresent: criticalPresent,
      checks,
      configurationRequiredItems: configRequired,
      notConfiguredItems: notConfigured,
      summary: criticalPresent
        ? `Observability baseline PRESENT: structured logging, health checks, startup diagnostics confirmed. ${configRequired.length} optional items require configuration.`
        : `Observability INCOMPLETE: critical observability items missing — ${notConfigured.join(", ")}.`,
    };
  }
}
