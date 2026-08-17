/**
 * FeatureDependencyEngine
 *
 * Constructs and resolves directed feature dependency graphs to prevent downstream features
 * from false-completion when prerequisite capabilities (e.g. Authentication, Database) fail.
 */

export interface FeatureDependencyNode {
  featureId: string;
  name: string;
  prerequisites: string[]; // IDs of features required first
  dependents: string[];
  status: "READY" | "BLOCKED_BY_DEPENDENCY" | "IN_PROGRESS" | "SATISFIED";
}

export class FeatureDependencyEngine {
  public static buildDependencyGraph(featureNames: string[]): FeatureDependencyNode[] {
    const nodes: FeatureDependencyNode[] = [];

    const hasAuth = featureNames.some((f) => f.toLowerCase().includes("auth") || f.toLowerCase().includes("user"));
    const authId = hasAuth ? "feat_auth" : undefined;

    for (let i = 0; i < featureNames.length; i++) {
      const name = featureNames[i];
      const lower = name.toLowerCase();
      const featureId = `feat_${i + 1}`;
      const isAuthFeat = lower.includes("auth") || lower.includes("user");

      const prereqs: string[] = [];
      if (!isAuthFeat && authId) {
        prereqs.push(authId);
      }

      nodes.push({
        featureId: isAuthFeat ? "feat_auth" : featureId,
        name,
        prerequisites: prereqs,
        dependents: [],
        status: prereqs.length === 0 ? "READY" : "BLOCKED_BY_DEPENDENCY",
      });
    }

    return nodes;
  }

  public static resolveGraph(
    nodes: FeatureDependencyNode[],
    completedFeatureIds: string[]
  ): FeatureDependencyNode[] {
    return nodes.map((node) => {
      const isCompleted = completedFeatureIds.includes(node.featureId);
      if (isCompleted) {
        return { ...node, status: "SATISFIED" };
      }

      const allPrereqsMet = node.prerequisites.every((req) => completedFeatureIds.includes(req));
      return {
        ...node,
        status: allPrereqsMet ? "READY" : "BLOCKED_BY_DEPENDENCY",
      };
    });
  }
}
