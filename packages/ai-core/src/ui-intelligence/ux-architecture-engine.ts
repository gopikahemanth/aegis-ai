/**
 * UXArchitectureEngine
 *
 * Synthesizes structured Information Architecture (IA), user journeys, role-specific navigations,
 * and page hierarchies from product requirements.
 */

export interface PageNode {
  id: string;
  path: string;
  title: string;
  roleAccess: string[];
  layoutType: "DASHBOARD" | "LANDING" | "DATA_TABLE" | "DETAIL" | "FORM" | "SETTINGS";
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
  publicPages: PageNode[];
  authenticatedPages: PageNode[];
  adminPages: PageNode[];
  navigationStructure: {
    sidebarItems: { label: string; path: string; icon: string; role: string }[];
    topbarItems: { label: string; path: string }[];
  };
  userJourneys: UserJourney[];
  createdAt: string;
}

export class UXArchitectureEngine {
  public static planUX(productName: string, domain: string): UXArchitecturePlan {
    const isEcom = domain.toLowerCase().includes("ecom") || domain.toLowerCase().includes("shop");
    const isEdu = domain.toLowerCase().includes("edu") || domain.toLowerCase().includes("lms") || domain.toLowerCase().includes("learn");
    const isGym = domain.toLowerCase().includes("gym");

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

    const authenticatedPages: PageNode[] = [
      {
        id: "page_dashboard",
        path: "/dashboard",
        title: "Dashboard Overview",
        roleAccess: ["USER", "ADMIN", "MEMBER", "STUDENT", "CUSTOMER"],
        layoutType: "DASHBOARD",
        primaryActions: ["Quick Action", "View Analytics"],
        secondaryActions: ["Export Report", "Filter Timeline"],
      },
      {
        id: "page_directory",
        path: isEcom ? "/products" : isEdu ? "/courses" : isGym ? "/members" : "/items",
        title: isEcom ? "Product Catalog" : isEdu ? "Course Catalog" : isGym ? "Member Directory" : "Directory",
        roleAccess: ["USER", "ADMIN"],
        layoutType: "DATA_TABLE",
        primaryActions: ["Create New Record", "Search & Filter"],
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
      { label: isEcom ? "Catalog" : isEdu ? "Courses" : isGym ? "Members" : "Items", path: authenticatedPages[1].path, icon: "Layers", role: "*" },
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
        name: "Primary Resource Management",
        userRole: "ADMIN",
        flowSteps: [
          { stepOrder: 1, pagePath: "/dashboard", goal: "View KPIs" },
          { stepOrder: 2, pagePath: authenticatedPages[1].path, goal: "Search, create, and update records" },
        ],
      },
    ];

    return {
      planId: `ux_plan_${Date.now()}`,
      productName,
      domain,
      publicPages,
      authenticatedPages,
      adminPages,
      navigationStructure: {
        sidebarItems,
        topbarItems: [{ label: "Profile", path: "/profile" }, { label: "Sign Out", path: "/logout" }],
      },
      userJourneys,
      createdAt: new Date().toISOString(),
    };
  }
}
