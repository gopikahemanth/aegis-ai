/**
 * DependencyLifecycleManager
 *
 * Evaluates package version lifecycle, security patches, and upgrade risks.
 */

export type UpgradeRisk =
  | "PATCH_SAFE"
  | "MINOR_SAFE"
  | "MINOR_REVIEW"
  | "MAJOR_BREAKING"
  | "SECURITY_CRITICAL"
  | "BLOCKED";

export interface DependencyUpgradePlan {
  packageName: string;
  currentVersion: string;
  targetVersion: string;
  risk: UpgradeRisk;
  hasVulnerabilities: boolean;
  requiresAuthorization: boolean;
  summary: string;
}

export class DependencyLifecycleManager {
  /**
   * Plan and evaluate dependency upgrade safety.
   */
  public static planUpgrade(
    packageName: string,
    currentVersion: string,
    targetVersion: string,
    isVulnerable: boolean = false
  ): DependencyUpgradePlan {
    const currentMajor = parseInt(currentVersion.replace(/^[^0-9]*/, "").split(".")[0], 10);
    const targetMajor = parseInt(targetVersion.replace(/^[^0-9]*/, "").split(".")[0], 10);

    let risk: UpgradeRisk = "PATCH_SAFE";
    let requiresAuthorization = false;

    if (isVulnerable) {
      risk = "SECURITY_CRITICAL";
      requiresAuthorization = targetMajor > currentMajor;
    } else if (targetMajor > currentMajor) {
      risk = "MAJOR_BREAKING";
      requiresAuthorization = true;
    } else if (targetVersion !== currentVersion) {
      risk = "MINOR_SAFE";
      requiresAuthorization = false;
    }

    return {
      packageName,
      currentVersion,
      targetVersion,
      risk,
      hasVulnerabilities: isVulnerable,
      requiresAuthorization,
      summary: `Upgrade ${packageName} ${currentVersion} -> ${targetVersion}: Risk is ${risk}. ${
        requiresAuthorization ? "Authorization required." : "Safe to apply."
      }`,
    };
  }
}
