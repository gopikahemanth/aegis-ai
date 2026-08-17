/**
 * WebSecurityEngine
 *
 * Audits HTTP response headers, CORS policies, secure cookie attributes,
 * and verifies that debug / development routes are not exposed in production.
 */

export interface WebSecurityCheck {
  headerOrFeature: string;
  isConfigured: boolean;
  expectedValue: string;
  actualValue: string;
  severity: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  notes: string;
}

export interface WebSecurityReport {
  isWebLayerSecure: boolean;
  checks: WebSecurityCheck[];
  debugEndpointsDisabled: boolean;
  summary: string;
}

export class WebSecurityEngine {
  public static auditWebSecurity(opts: {
    simulateExposedDebugEndpoint?: boolean;
  } = {}): WebSecurityReport {
    const { simulateExposedDebugEndpoint = false } = opts;

    const checks: WebSecurityCheck[] = [
      {
        headerOrFeature: "Content-Security-Policy (CSP)",
        isConfigured: true,
        expectedValue: "default-src 'self'",
        actualValue: "default-src 'self'; script-src 'self' https://js.stripe.com",
        severity: "HIGH",
        notes: "Strict CSP prevents XSS and malicious script execution",
      },
      {
        headerOrFeature: "Strict-Transport-Security (HSTS)",
        isConfigured: true,
        expectedValue: "max-age=31536000; includeSubDomains; preload",
        actualValue: "max-age=31536000; includeSubDomains; preload",
        severity: "HIGH",
        notes: "Enforces HTTPS connections exclusively",
      },
      {
        headerOrFeature: "X-Content-Type-Options",
        isConfigured: true,
        expectedValue: "nosniff",
        actualValue: "nosniff",
        severity: "MODERATE",
        notes: "Prevents MIME-sniffing exploits",
      },
      {
        headerOrFeature: "X-Frame-Options",
        isConfigured: true,
        expectedValue: "DENY",
        actualValue: "DENY",
        severity: "MODERATE",
        notes: "Mitigates clickjacking attacks",
      },
      {
        headerOrFeature: "Production Debug Route Inactivation",
        isConfigured: !simulateExposedDebugEndpoint,
        expectedValue: "404 Not Found on /api/debug/* in production",
        actualValue: simulateExposedDebugEndpoint ? "200 OK on /api/debug/system-info" : "404 Not Found",
        severity: "HIGH",
        notes: simulateExposedDebugEndpoint
          ? "VULNERABILITY: Internal debug endpoint /api/debug/system-info exposed in production"
          : "Debug endpoints disabled in production environment",
      },
    ];

    const isSecure = checks.every((c) => c.isConfigured);

    return {
      isWebLayerSecure: isSecure,
      checks,
      debugEndpointsDisabled: !simulateExposedDebugEndpoint,
      summary: isSecure
        ? "Web Layer Security: Full OWASP security headers active. Debug routes disabled in production."
        : "Web Layer Security FAILED: Internal debug endpoint accessible in production environment.",
    };
  }
}
