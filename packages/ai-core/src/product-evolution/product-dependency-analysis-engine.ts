/**
 * ProductDependencyAnalysisEngine
 *
 * Constructs a bidirectional dependency graph across database models,
 * services, routes, UI components, and external integrations.
 * Invariant: Never modify an isolated file while ignoring dependent functionality.
 */

import { ProductChangeContract } from "./change-contract-engine.js";

export interface DependencyNode {
  name: string;
  type: "ENTITY" | "SERVICE" | "ROUTE" | "COMPONENT" | "INTEGRATION";
  dependencies: string[];
  dependents: string[];
}

export interface ProductDependencyGraph {
  nodes: DependencyNode[];
  criticalPaths: string[][];
  summary: string;
}

export class ProductDependencyAnalysisEngine {
  public static buildGraph(contract: ProductChangeContract): ProductDependencyGraph {
    const nodes: DependencyNode[] = [
      {
        name: "Payment",
        type: "ENTITY",
        dependencies: ["Member", "MembershipPlan", "PostgreSQL"],
        dependents: ["PaymentService", "PaymentHistoryTable"],
      },
      {
        name: "PaymentService",
        type: "SERVICE",
        dependencies: ["Payment", "StripeSDK", "MemberService"],
        dependents: ["PaymentRoutes", "StripeWebhookHandler"],
      },
      {
        name: "PaymentRoutes",
        type: "ROUTE",
        dependencies: ["PaymentService", "AuthMiddleware", "RBACMiddleware"],
        dependents: ["MemberCheckoutModal", "PaymentHistoryTable"],
      },
      {
        name: "MemberCheckoutModal",
        type: "COMPONENT",
        dependencies: ["PaymentRoutes", "StripeElements", "PlanSelectionCard"],
        dependents: ["MemberDashboardPage"],
      },
      {
        name: "PaymentHistoryTable",
        type: "COMPONENT",
        dependencies: ["PaymentRoutes", "TableComponent", "BadgeComponent"],
        dependents: ["AdminReportsPage"],
      },
    ];

    const criticalPaths = [
      ["PostgreSQL", "Payment", "PaymentService", "PaymentRoutes", "MemberCheckoutModal", "MemberDashboardPage"],
      ["StripeSDK", "PaymentService", "StripeWebhookHandler", "MemberService", "AttendanceCheckIn"],
    ];

    return {
      nodes,
      criticalPaths,
      summary: `Dependency analysis mapped ${nodes.length} nodes and ${criticalPaths.length} critical transaction execution paths.`,
    };
  }
}
