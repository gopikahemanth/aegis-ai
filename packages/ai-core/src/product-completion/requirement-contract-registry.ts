/**
 * RequirementContractRegistry
 *
 * Canonical registry for parsed user product requirements, user roles, functional specifications,
 * workflows, and their end-to-end implementation and verification states.
 */

export type RequirementCategory =
  | "FUNCTIONAL"
  | "NON_FUNCTIONAL"
  | "UI_UX"
  | "API"
  | "DATABASE"
  | "AUTHENTICATION"
  | "INTEGRATION"
  | "SECURITY"
  | "DEPLOYMENT";

export type RequirementStatus =
  | "PENDING"
  | "PLANNED"
  | "IMPLEMENTED"
  | "VERIFIED"
  | "REPAIR_REQUIRED"
  | "BLOCKED";

export interface ProductRequirementItem {
  requirementId: string; // REQ-001, REQ-002, etc.
  category: RequirementCategory;
  title: string;
  description: string;
  acceptanceCriteria: string[];
  userRoles: string[];
  isCritical: boolean;
  status: RequirementStatus;
  targetFiles: string[];
  apiEndpoints: string[];
  dbModels: string[];
  verifiedEvidenceIds: string[];
  createdAt: string;
  updatedAt: string;
}

export class RequirementContractRegistry {
  private static requirements: Map<string, ProductRequirementItem> = new Map();

  public static registerRequirement(
    req: Omit<ProductRequirementItem, "status" | "verifiedEvidenceIds" | "createdAt" | "updatedAt">
  ): ProductRequirementItem {
    const now = new Date().toISOString();
    const item: ProductRequirementItem = {
      ...req,
      status: "PENDING",
      verifiedEvidenceIds: [],
      createdAt: now,
      updatedAt: now,
    };
    this.requirements.set(req.requirementId, item);
    return item;
  }

  public static getRequirement(id: string): ProductRequirementItem | undefined {
    return this.requirements.get(id);
  }

  public static getAllRequirements(): ProductRequirementItem[] {
    return Array.from(this.requirements.values());
  }

  public static updateStatus(
    id: string,
    status: RequirementStatus,
    evidenceId?: string
  ): boolean {
    const r = this.requirements.get(id);
    if (!r) return false;
    r.status = status;
    if (evidenceId && !r.verifiedEvidenceIds.includes(evidenceId)) {
      r.verifiedEvidenceIds.push(evidenceId);
    }
    r.updatedAt = new Date().toISOString();
    return true;
  }

  public static getCriticalRequirements(): ProductRequirementItem[] {
    return Array.from(this.requirements.values()).filter((r) => r.isCritical);
  }

  public static reset(): void {
    this.requirements.clear();
  }
}
