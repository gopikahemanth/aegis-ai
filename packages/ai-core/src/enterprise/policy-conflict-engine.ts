/**
 * PolicyConflictEngine
 *
 * Resolves multi-tiered policy hierarchies (Platform -> Org -> Project -> Environment)
 * ensuring that lower-level policies can NEVER weaken higher-level mandatory platform safety rules.
 */

export interface PolicyRule {
  level: "PLATFORM" | "ORGANIZATION" | "PROJECT" | "ENVIRONMENT";
  requireHumanApprovalForDestructiveMigrations: boolean;
  maxConcurrentJobs: number;
}

export interface ResolvedPolicy {
  requireHumanApprovalForDestructiveMigrations: boolean;
  maxConcurrentJobs: number;
  conflictsResolved: string[];
}

export class PolicyConflictEngine {
  public static resolve(rules: PolicyRule[]): ResolvedPolicy {
    const conflicts: string[] = [];

    // Platform policy is absolute supreme baseline
    let requireApproval = true;
    let maxJobs = 10;

    for (const rule of rules) {
      if (rule.level === "PLATFORM") {
        requireApproval = rule.requireHumanApprovalForDestructiveMigrations;
        maxJobs = rule.maxConcurrentJobs;
      } else {
        // If lower level attempts to disable mandatory approval, override and record conflict
        if (!rule.requireHumanApprovalForDestructiveMigrations && requireApproval) {
          conflicts.push(`OVERRIDE_PREVENTED: ${rule.level} attempted to weaken destructive migration approval.`);
        }
        // Take stricter concurrency limit
        if (rule.maxConcurrentJobs < maxJobs) {
          maxJobs = rule.maxConcurrentJobs;
        }
      }
    }

    return {
      requireHumanApprovalForDestructiveMigrations: requireApproval,
      maxConcurrentJobs: maxJobs,
      conflictsResolved: conflicts,
    };
  }
}
