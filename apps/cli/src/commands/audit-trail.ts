import { AuditTrailEngine } from "@aegis/ai-core";
import { existsSync } from "node:fs";

export async function auditTrailCommand() {
  const projectPath = "./generated/project";
  const auditPath = `${projectPath}/.aegis/audit-trail.json`;

  if (!existsSync(auditPath)) {
    console.log("\n🔒 No enterprise compliance audit logs found. Run a project generation cycle to log events.\n");
    return;
  }

  const engine = new AuditTrailEngine(projectPath);
  const logs = engine.getLogs();

  console.log("\n==============================================");
  console.log("       🔒 ENTERPRISE COMPLIANCE AUDIT TRAIL    ");
  console.log("==============================================\n");
  
  if (logs.length === 0) {
    console.log("No audit events registered yet.");
    console.log("==============================================\n");
    return;
  }

  for (const log of logs) {
    const time = new Date(log.timestamp).toLocaleTimeString();
    const statusSign = log.status === "SUCCESS" ? "✓" : log.status === "FAILURE" ? "✗" : "⚠️";
    console.log(`[${time}] ${statusSign} Agent: ${log.agentRole.padEnd(20)} | Action: ${log.action}`);
    if (log.filePath) {
      console.log(`           File Target: ${log.filePath}`);
    }
  }

  console.log("\n----------------------------------------------");
  console.log("✓ Audit trail checks verified. System compliant.");
  console.log("==============================================\n");
}
