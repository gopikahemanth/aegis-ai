/**
 * OrganizationManager
 *
 * Authoritative enterprise tenancy registry managing Organizations, Teams,
 * Projects, Environments, and Resource Ownership.
 */

export interface Team {
  teamId: string;
  name: string;
  memberUserIds: string[];
}

export interface EnterpriseOrganization {
  organizationId: string;
  name: string;
  teams: Team[];
  projectIds: string[];
  createdAt: string;
  tier: "ENTERPRISE" | "BUSINESS" | "COMMUNITY";
}

export class OrganizationManager {
  private static organizations: Map<string, EnterpriseOrganization> = new Map();

  public static createOrganization(org: Omit<EnterpriseOrganization, "createdAt">): EnterpriseOrganization {
    const fullOrg: EnterpriseOrganization = {
      ...org,
      createdAt: new Date().toISOString(),
    };
    this.organizations.set(org.organizationId, fullOrg);
    return fullOrg;
  }

  public static getOrganization(organizationId: string): EnterpriseOrganization | undefined {
    return this.organizations.get(organizationId);
  }

  public static addProjectToOrg(organizationId: string, projectId: string): boolean {
    const org = this.organizations.get(organizationId);
    if (!org) return false;
    if (!org.projectIds.includes(projectId)) {
      org.projectIds.push(projectId);
    }
    return true;
  }

  public static listOrganizations(): EnterpriseOrganization[] {
    return Array.from(this.organizations.values());
  }

  public static reset(): void {
    this.organizations.clear();
  }
}
