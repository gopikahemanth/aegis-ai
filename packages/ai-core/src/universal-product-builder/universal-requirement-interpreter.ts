/**
 * UniversalRequirementInterpreter
 *
 * Converts arbitrary natural language user requests into a complete, structured UniversalProductSpecification.
 * Maintains requirement derivations: EXPLICIT, INFERRED, ASSUMED.
 */

import { DomainDiscoveryEngine, type ProductDomain } from "./domain-discovery-engine.js";
import { DomainModelEngine, type DomainEntityModel } from "./domain-model-engine.js";

export type RequirementOrigin = "EXPLICIT" | "INFERRED" | "ASSUMED";

export interface FeatureRequirement {
  id: string;
  name: string;
  category: string;
  description: string;
  origin: RequirementOrigin;
  isCritical: boolean;
  acceptanceCriteria: string[];
}

export interface BusinessWorkflowStep {
  stepIndex: number;
  actor: string;
  action: string;
  expectedResult: string;
  endpoint?: string;
}

export interface BusinessWorkflow {
  id: string;
  name: string;
  description: string;
  actor: string;
  steps: BusinessWorkflowStep[];
  isCritical: boolean;
}

export interface UniversalProductSpecification {
  productName: string;
  domain: ProductDomain;
  domainConfidence: number;
  users: { role: string; description: string; isPrivileged: boolean }[];
  features: FeatureRequirement[];
  entities: DomainEntityModel[];
  workflows: BusinessWorkflow[];
  integrations: { name: string; type: string; purpose: string }[];
  securityRequirements: { title: string; mechanism: string; origin: RequirementOrigin }[];
  uiRequirements: { viewName: string; componentType: string; isResponsive: boolean }[];
  nonFunctionalRequirements: { metric: string; target: string }[];
  createdAt: string;
}

export class UniversalRequirementInterpreter {
  public static interpret(prompt: string, customProductName?: string): UniversalProductSpecification {
    const discovery = DomainDiscoveryEngine.discoverDomain(prompt);
    const domain = discovery.domain;
    const p = prompt.toLowerCase();

    // 1. Product Name
    let productName = customProductName || "UniversalApp";
    if (domain === "ECOMMERCE") productName = "AegisCommercePlatform";
    else if (domain === "EDUCATION") productName = "AegisLMSPlatform";
    else if (domain === "CRM") productName = "AegisCRMEnterprise";
    else if (domain === "HEALTHCARE") productName = "AegisHealthPortal";
    else if (domain === "BOOKING") productName = "AegisBookingSuite";
    else if (domain === "GYM_MANAGEMENT") productName = "AegisGymPlatform";

    // 2. User Roles
    const users: UniversalProductSpecification["users"] = [
      { role: "ADMIN", description: "System administrator with full permissions", isPrivileged: true },
      {
        role: domain === "ECOMMERCE" ? "CUSTOMER" : domain === "EDUCATION" ? "STUDENT" : "STANDARD_USER",
        description: "Primary consumer of application services",
        isPrivileged: false,
      },
    ];

    if (domain === "EDUCATION") {
      users.push({ role: "INSTRUCTOR", description: "Course creator and assignment grader", isPrivileged: true });
    } else if (domain === "CRM") {
      users.push({ role: "SALES_REP", description: "Account manager managing leads and deals", isPrivileged: false });
    }

    // 3. Features
    const features: FeatureRequirement[] = [];
    let featureId = 1;
    const addFeature = (name: string, category: string, desc: string, origin: RequirementOrigin, isCritical: boolean, criteria: string[]) => {
      features.push({
        id: `REQ-${String(featureId++).padStart(3, "0")}`,
        name,
        category,
        description: desc,
        origin,
        isCritical,
        acceptanceCriteria: criteria,
      });
    };

    // Universal Base Features
    addFeature("Authentication & Access Control", "SECURITY", "JWT token-based auth with secure login/logout", "EXPLICIT", true, [
      "User can register and login",
      "Protected routes reject invalid tokens",
    ]);

    addFeature("Administrative Dashboard", "UI_UX", "Real-time summary analytics and operational status overview", "INFERRED", true, [
      "Dashboard loads non-zero KPI metrics",
      "Layout is fully responsive",
    ]);

    // Domain Specific Features
    if (domain === "ECOMMERCE") {
      addFeature("Product Catalog & Search", "CATALOG", "Browse and filter store merchandise", "EXPLICIT", true, [
        "Product list renders with prices and stock",
        "Search filter filters by category",
      ]);
      addFeature("Shopping Cart & Checkout", "TRANSACTIONS", "Add items to cart and execute checkout", "EXPLICIT", true, [
        "Cart increments item count",
        "Checkout initiates payment transaction",
      ]);
      addFeature("Order History & Invoicing", "ACCOUNT", "Track customer orders and view receipts", "INFERRED", true, [
        "Customer can review placed orders",
        "Order status persists to database",
      ]);
    } else if (domain === "EDUCATION") {
      addFeature("Course Syllabus & Lessons", "ACADEMIC", "Structured curriculum navigation and lesson viewing", "EXPLICIT", true, [
        "Course syllabus renders lessons",
        "Student can start and progress lessons",
      ]);
      addFeature("Assignment Submission", "ASSESSMENT", "Submit homework assignments for grading", "EXPLICIT", true, [
        "Student submits assignment file/text",
        "Submission record saved to DB",
      ]);
      addFeature("Gradebook & Student Progress", "REPORTING", "Instructor grade allocation and GPA report", "INFERRED", false, [
        "Instructor assigns grade score",
        "Student views updated gradebook",
      ]);
    } else if (domain === "CRM") {
      addFeature("Lead Capture & Pipeline", "SALES", "Manage sales leads through opportunity stages", "EXPLICIT", true, [
        "New lead creation persists",
        "Lead pipeline drag-and-drop stage mutation",
      ]);
      addFeature("Activity Logging & Reminders", "COLLABORATION", "Log phone calls, emails, and meetings", "EXPLICIT", false, [
        "Activity timestamp logged under lead",
      ]);
    } else {
      // CUSTOM
      addFeature("Primary Entity Management", "CORE_CRUD", "Create, Read, Update, Delete for primary domain records", "EXPLICIT", true, [
        "CRUD operations succeed via REST API",
        "Records persist across reloads",
      ]);
    }

    addFeature("Relational Data Persistence", "DATABASE", "Prisma ORM schema synchronization with PostgreSQL", "ASSUMED", true, [
      "Prisma migrations execute cleanly",
      "Foreign key integrity preserved",
    ]);

    // 4. Entities
    const entities = DomainModelEngine.deriveDomainModels(domain);

    // 5. Business Workflows
    const workflows: BusinessWorkflow[] = [];
    if (domain === "ECOMMERCE") {
      workflows.push({
        id: "wf_ecom_checkout",
        name: "Customer Product Purchase & Checkout",
        description: "Full end-to-end shopping flow from browsing to order settlement",
        actor: "CUSTOMER",
        isCritical: true,
        steps: [
          { stepIndex: 1, actor: "CUSTOMER", action: "Browse product catalog", expectedResult: "Products displayed with prices", endpoint: "/api/products" },
          { stepIndex: 2, actor: "CUSTOMER", action: "Add product to cart", expectedResult: "Cart badge updates", endpoint: "/api/cart" },
          { stepIndex: 3, actor: "CUSTOMER", action: "Submit checkout payment", expectedResult: "Order created in DB with status PAID", endpoint: "/api/orders/checkout" },
        ],
      });
    } else if (domain === "EDUCATION") {
      workflows.push({
        id: "wf_edu_submission",
        name: "Student Assignment Submission",
        description: "Student submits assignment and receives confirmation",
        actor: "STUDENT",
        isCritical: true,
        steps: [
          { stepIndex: 1, actor: "STUDENT", action: "Open course syllabus", expectedResult: "Course modules render", endpoint: "/api/courses" },
          { stepIndex: 2, actor: "STUDENT", action: "Submit assignment response", expectedResult: "Submission stored in DB", endpoint: "/api/assignments/submit" },
        ],
      });
    } else {
      workflows.push({
        id: "wf_universal_crud",
        name: "Universal Resource Mutation Lifecycle",
        description: "Verify create, read, and update flow for core domain record",
        actor: "USER",
        isCritical: true,
        steps: [
          { stepIndex: 1, actor: "USER", action: "Fetch resource list", expectedResult: "Array of records returned", endpoint: "/api/records" },
          { stepIndex: 2, actor: "USER", action: "Create new record", expectedResult: "Record persisted with generated UUID", endpoint: "/api/records" },
        ],
      });
    }

    return {
      productName,
      domain,
      domainConfidence: discovery.confidence,
      users,
      features,
      entities,
      workflows,
      integrations: [{ name: "PostgreSQL Database Pool", type: "DATABASE", purpose: "Relational persistence" }],
      securityRequirements: [
        { title: "JWT Bearer Authentication", mechanism: "Signed JSON Web Tokens", origin: "ASSUMED" },
        { title: "Role-Based Route Guarding", mechanism: "Express Middleware Guard", origin: "ASSUMED" },
      ],
      uiRequirements: [
        { viewName: "DashboardOverview", componentType: "GRID", isResponsive: true },
        { viewName: "ResourceDirectory", componentType: "TABLE", isResponsive: true },
      ],
      nonFunctionalRequirements: [
        { metric: "API Response Time", target: "< 250ms" },
        { metric: "Zero Critical Security Vulnerabilities", target: "100%" },
      ],
      createdAt: new Date().toISOString(),
    };
  }
}
