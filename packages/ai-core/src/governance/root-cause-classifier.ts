import { ErrorClass } from "../healing/error-root-cause-mapper.js";
import { AgentRole } from "./safe-patch-system.js";

export interface RootCauseRecord {
  rootCauseKey: string;
  errorClass: ErrorClass;
  file: string;
  attempts: number;
  lastAttemptAt: string;
}

export class RootCauseClassifier {
  private static attemptsMap = new Map<string, number>();
  private static MAX_ATTEMPTS_PER_ROOT_CAUSE = 3;

  public static getRootCauseKey(errorClass: ErrorClass, file: string, message: string): string {
    // Generate a stable key for root cause (e.g. TS2307:server/index.ts or missing-props:src/App.tsx)
    const sanitizedMsg = message.replace(/line \d+/gi, "").replace(/\d+:\d+/g, "").slice(0, 50);
    return `${errorClass}:${file.replace(/\\/g, "/")}:${sanitizedMsg}`;
  }

  public static recordAttempt(rootCauseKey: string): { allowed: boolean; currentAttempts: number } {
    const current = (this.attemptsMap.get(rootCauseKey) || 0) + 1;
    this.attemptsMap.set(rootCauseKey, current);

    if (current > this.MAX_ATTEMPTS_PER_ROOT_CAUSE) {
      return { allowed: false, currentAttempts: current };
    }
    return { allowed: true, currentAttempts: current };
  }

  public static getResponsibleAgent(errorClass: ErrorClass, file: string): AgentRole {
    const rel = file.toLowerCase();
    if (errorClass === "database" || rel.includes("prisma") || rel.includes("db")) {
      return "DatabaseAgent";
    }
    if (errorClass === "missing-module" || errorClass === "dependency") {
      return "DevOpsAgent";
    }
    if (rel.includes("server/") || rel.includes("api") || rel.includes("controller")) {
      return "BackendAgent";
    }
    if (rel.includes("src/") || rel.includes("components") || rel.includes("pages")) {
      return "FrontendAgent";
    }
    return "HealerAgent";
  }

  public static reset(): void {
    this.attemptsMap.clear();
  }
}
