export interface PipelineResult {
  success: boolean;
  attempts: number;
  /** Database initialization status from the DatabaseInitializationStep */
  databaseStatus?: "CONNECTED" | "BLOCKED" | "UNKNOWN" | "SKIPPED";
}
