/**
 * ExternalObservabilityAdapter
 *
 * Normalizes third-party metrics, logs, and alerts into AEGIS telemetry format.
 */

export interface ExternalTelemetryEvent {
  source: string;
  metricName: string;
  value: number;
  unit: string;
  timestamp: string;
}

export class ExternalObservabilityAdapter {
  public static ingestMetric(event: ExternalTelemetryEvent): { status: "INGESTED"; normalizedLatencyMs: number } {
    return {
      status: "INGESTED",
      normalizedLatencyMs: event.unit === "s" ? event.value * 1000 : event.value,
    };
  }
}
