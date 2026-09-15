/**
 * UXArchitectureEngine
 *
 * Synthesizes structured Information Architecture (IA), user journeys, role-specific navigations,
 * and page hierarchies driven by DomainVisualDesignContract.
 */

import { DomainVisualContractGenerator, type DomainVisualDesignContract } from "../design/domain-visual-contract.js";

export interface PageNode {
  id: string;
  path: string;
  title: string;
  roleAccess: string[];
  layoutType: "DASHBOARD" | "LANDING" | "DATA_TABLE" | "DETAIL" | "FORM" | "SETTINGS" | "WORKSPACE" | "TIMELINE" | "SHOWCASE";
  primaryActions: string[];
  secondaryActions: string[];
  children?: PageNode[];
}

export interface UserJourney {
  journeyId: string;
  name: string;
  userRole: string;
  flowSteps: { stepOrder: number; pagePath: string; goal: string }[];
}

export interface UXArchitecturePlan {
  planId: string;
  productName: string;
  domain: string;
  visualContract: DomainVisualDesignContract;
  publicPages: PageNode[];
  authenticatedPages: PageNode[];
  adminPages: PageNode[];
  navigationStructure: {
    strategy: DomainVisualDesignContract["navigation"]["strategy"];
    sidebarItems: { label: string; path: string; icon: string; role: string }[];
    topbarItems: { label: string; path: string }[];
  };
  userJourneys: UserJourney[];
  createdAt: string;
}

export class UXArchitectureEngine {
  public static planUX(productName: string, domain: string): UXArchitecturePlan {
    const visualContract = DomainVisualContractGenerator.deriveContract(domain);

    const publicPages: PageNode[] = [
      {
        id: "page_home",
        path: "/",
        title: `${productName} — Home`,
        roleAccess: ["*"],
        layoutType: "LANDING",
        primaryActions: ["Explore Features", "Sign In"],
        secondaryActions: ["Documentation", "Pricing"],
      },
      {
        id: "page_auth",
        path: "/login",
        title: "Sign In & Registration",
        roleAccess: ["*"],
        layoutType: "FORM",
        primaryActions: ["Sign In", "Create Account"],
        secondaryActions: ["Forgot Password"],
      },
    ];

    const directoryPath = visualContract.dashboardComposition.heroAction.targetRoute && visualContract.dashboardComposition.heroAction.targetRoute !== "/"
      ? visualContract.dashboardComposition.heroAction.targetRoute
      : "/directory";

    const authenticatedPages: PageNode[] = [
      {
        id: "page_dashboard",
        path: "/dashboard",
        title: `${productName} Control Center`,
        roleAccess: ["USER", "ADMIN", "MEMBER", "GUEST", "OPERATOR"],
        layoutType: "DASHBOARD",
        primaryActions: [visualContract.dashboardComposition.heroAction.label, "View Operational Metrics"],
        secondaryActions: ["Filter Events", "Audit Log"],
      },
      {
        id: "page_directory",
        path: directoryPath,
        title: `${visualContract.domain} Resource Management`,
        roleAccess: ["USER", "ADMIN"],
        layoutType: "DATA_TABLE",
        primaryActions: [visualContract.dashboardComposition.heroAction.label, "Search & Filter"],
        secondaryActions: ["Batch Export", "Bulk Edit"],
      },
    ];

    const adminPages: PageNode[] = [
      {
        id: "page_admin_settings",
        path: "/admin/settings",
        title: "Administration & Security",
        roleAccess: ["ADMIN"],
        layoutType: "SETTINGS",
        primaryActions: ["Save Configuration", "Manage Roles"],
        secondaryActions: ["View Audit Logs"],
      },
    ];

    const sidebarItems = [
      { label: "Dashboard", path: "/dashboard", icon: "LayoutDashboard", role: "*" },
      { label: "Directory", path: directoryPath, icon: "Layers", role: "*" },
      { label: "Settings", path: "/admin/settings", icon: "Settings", role: "ADMIN" },
    ];

    const userJourneys: UserJourney[] = [
      {
        journeyId: "jrn_onboarding",
        name: "User Authentication & Dashboard Land",
        userRole: "USER",
        flowSteps: [
          { stepOrder: 1, pagePath: "/", goal: "Explore platform landing page" },
          { stepOrder: 2, pagePath: "/login", goal: "Authenticate credentials" },
          { stepOrder: 3, pagePath: "/dashboard", goal: "Access personal overview" },
        ],
      },
      {
        journeyId: "jrn_primary_task",
        name: `${visualContract.domain} Core Execution Flow`,
        userRole: "OPERATOR",
        flowSteps: [
          { stepOrder: 1, pagePath: "/dashboard", goal: "Review primary operational KPIs & telemetry" },
          { stepOrder: 2, pagePath: directoryPath, goal: visualContract.dashboardComposition.heroAction.label },
        ],
      },
    ];

    return {
      planId: `ux_plan_${Date.now()}`,
      productName,
      domain,
      visualContract,
      publicPages,
      authenticatedPages,
      adminPages,
      navigationStructure: {
        strategy: visualContract.navigation.strategy,
        sidebarItems,
        topbarItems: [{ label: "Profile", path: "/profile" }, { label: "Sign Out", path: "/logout" }],
      },
      userJourneys,
      createdAt: new Date().toISOString(),
    };
  }
}
