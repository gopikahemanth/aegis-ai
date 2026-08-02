import { helpCommand } from "./commands/help.js";
import { versionCommand } from "./commands/version.js";
import { createCommand } from "./commands/create.js";
import { editCommand } from "./commands/edit.js";
import { analyticsCommand } from "./commands/analytics.js";
import { auditCommand } from "./commands/audit.js";
import { benchmarkCommand } from "./commands/benchmark.js";
import { queryCommand } from "./commands/query.js";
import { auditTrailCommand } from "./commands/audit-trail.js";
import { chatCommand } from "./commands/chat.js";
import { doctorCommand } from "./commands/doctor.js";

const KNOWN_COMMANDS = new Set([
  "create", "edit", "chat", "doctor",
  "analytics", "audit", "audit-trail",
  "benchmark", "query", "version", "help",
  "--help", "-h", "--version", "-v",
]);

export async function runCLI() {
  const arg = process.argv[2];

  // If no argument given → show help
  if (!arg) return helpCommand();

  // If argument is a known subcommand → dispatch normally
  if (KNOWN_COMMANDS.has(arg)) {
    switch (arg) {
      case "create":      return createCommand();
      case "edit":        return editCommand();
      case "chat":        return chatCommand();
      case "doctor":      return doctorCommand();
      case "analytics":   return analyticsCommand();
      case "audit":       return auditCommand();
      case "audit-trail": return auditTrailCommand();
      case "benchmark":   return benchmarkCommand();
      case "query":       return queryCommand();
      case "version":
      case "--version":
      case "-v":          return versionCommand();
      case "help":
      case "--help":
      case "-h":          return helpCommand();
    }
  }

  // Default: treat bare prompt as `aegis create "<prompt>"`
  // e.g.  aegis "Build a Netflix clone"
  // Inject argv so createCommand() sees it as process.argv[3]
  process.argv.splice(2, 0, "create");
  return createCommand();
}
