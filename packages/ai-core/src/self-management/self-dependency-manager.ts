/**
 * SelfDependencyManager
 *
 * Continuously evaluates AEGIS's own direct and workspace dependencies for security,
 * breaking change risk, and upgrade compatibility.
 */

import { DependencyLifecycleManager, type DependencyUpgradePlan } from "../intelligence/dependency-lifecycle-manager.js";

export class SelfDependencyManager {
  /**
   * Evaluate a proposed self-dependency upgrade for AEGIS.
   */
  public static evaluateUpgrade(
    packageName: string,
    currentVersion: string,
    targetVersion: string,
    isSecurityVulnerability: boolean = false
  ): DependencyUpgradePlan {
    return DependencyLifecycleManager.planUpgrade(
      packageName,
      currentVersion,
      targetVersion,
      isSecurityVulnerability
    );
  }
}
