/**
 * ArchitecturePlanner
 *
 * Generates an end-to-end full-stack architectural plan prior to code generation.
 */

export interface ProductArchitecturePlan {
  planId: string;
  projectName: string;
  domain: string;
  frontend: {
    framework: "React-Vite";
    styling: "TailwindCSS";
    routing: "React Router";
    stateManagement: "Zustand/Context";
    components: string[];
  };
  backend: {
    runtime: "Node.js";
    framework: "Express";
    apiStyle: "REST";
    controllers: string[];
    middleware: string[];
  };
  database: {
    engine: "PostgreSQL";
    orm: "Prisma";
    models: string[];
  };
  auth: {
    strategy: "JWT";
    roles: string[];
  };
  testing: {
    unitRunner: "Vitest";
    browserRunner: "Playwright/InternalRunner";
  };
  createdAt: string;
}

export class ProductArchitecturePlanner {
  public static planArchitecture(projectName: string, domain: string): ProductArchitecturePlan {
    const isGym = domain.toLowerCase().includes("gym");

    const models = isGym
      ? ["User", "Member", "Trainer", "Attendance", "Payment", "MembershipPlan"]
      : ["User", "Item", "Order", "Transaction", "AuditLog"];

    const controllers = isGym
      ? ["auth.controller.ts", "member.controller.ts", "trainer.controller.ts", "attendance.controller.ts", "payment.controller.ts"]
      : ["auth.controller.ts", "item.controller.ts", "order.controller.ts"];

    const components = isGym
      ? ["DashboardView", "MemberList", "AddMemberModal", "TrainerRoster", "AttendanceScanner", "PaymentHistory", "AdminSettings"]
      : ["DashboardView", "ItemList", "AddItemModal", "OrderHistory", "AdminSettings"];

    return {
      planId: `arch_plan_${Date.now()}`,
      projectName,
      domain,
      frontend: {
        framework: "React-Vite",
        styling: "TailwindCSS",
        routing: "React Router",
        stateManagement: "Zustand/Context",
        components,
      },
      backend: {
        runtime: "Node.js",
        framework: "Express",
        apiStyle: "REST",
        controllers,
        middleware: ["authMiddleware.ts", "errorHandler.ts", "corsMiddleware.ts"],
      },
      database: {
        engine: "PostgreSQL",
        orm: "Prisma",
        models,
      },
      auth: {
        strategy: "JWT",
        roles: ["admin", "staff", "member"],
      },
      testing: {
        unitRunner: "Vitest",
        browserRunner: "Playwright/InternalRunner",
      },
      createdAt: new Date().toISOString(),
    };
  }
}
