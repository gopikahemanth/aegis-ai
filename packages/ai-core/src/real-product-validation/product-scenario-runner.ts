/**
 * ProductScenarioRunner
 *
 * Defines and executes end-to-end real-world product specifications and acceptance scenarios.
 * Focuses on realistic multi-feature web applications (e.g. Gym Management Platform).
 */

export interface ProductScenarioRequirement {
  id: string; // REQ-001, etc.
  title: string;
  category: "AUTHENTICATION" | "FUNCTIONAL" | "DATABASE" | "UI_UX" | "SECURITY" | "REPORTING";
  description: string;
  acceptanceCriteria: string[];
  isCritical: boolean;
  endpoint?: string;
  browserStep?: string;
}

export interface ProductScenario {
  scenarioId: string;
  name: string;
  domain: string;
  description: string;
  requirements: ProductScenarioRequirement[];
  sampleDataset: Record<string, any[]>;
}

export class ProductScenarioRunner {
  public static getGymManagementScenario(): ProductScenario {
    return {
      scenarioId: "scen_gym_01",
      name: "Gym Management Platform",
      domain: "Fitness & Club Operations",
      description:
        "Full-stack gym administration portal with member enrollment, trainer scheduling, attendance tracking, billing, and role-based access control.",
      requirements: [
        {
          id: "REQ-001",
          title: "User & Staff Authentication",
          category: "AUTHENTICATION",
          description: "Staff and admin can register, log in, and receive secure JWT tokens.",
          acceptanceCriteria: [
            "POST /api/auth/register creates user",
            "POST /api/auth/login returns JWT token",
            "Unauthenticated requests to protected endpoints return 401",
          ],
          isCritical: true,
          endpoint: "/api/auth/login",
          browserStep: "Fill login form and verify redirect to dashboard",
        },
        {
          id: "REQ-002",
          title: "Admin Dashboard & Real-Time Metrics",
          category: "UI_UX",
          description: "Visual overview of active members, daily check-ins, monthly revenue, and trainers.",
          acceptanceCriteria: [
            "KPI cards render real values from database",
            "Metrics update reactively when new members or check-ins are logged",
            "Responsive layout renders on mobile and desktop",
          ],
          isCritical: true,
          endpoint: "/api/dashboard/metrics",
          browserStep: "Assert dashboard cards display non-zero statistics",
        },
        {
          id: "REQ-003",
          title: "Member Enrollment & Management",
          category: "FUNCTIONAL",
          description: "Create, view, edit, and search member profiles with membership status.",
          acceptanceCriteria: [
            "POST /api/members creates member record",
            "GET /api/members returns member list with search filters",
            "PUT /api/members/:id updates member data",
          ],
          isCritical: true,
          endpoint: "/api/members",
          browserStep: "Open Add Member modal, submit details, verify member appears in table",
        },
        {
          id: "REQ-004",
          title: "Trainer & Instructor Roster",
          category: "FUNCTIONAL",
          description: "Manage trainers, specialties, and assigned member rosters.",
          acceptanceCriteria: [
            "GET /api/trainers lists certified trainers",
            "POST /api/trainers creates trainer profile",
          ],
          isCritical: false,
          endpoint: "/api/trainers",
          browserStep: "Navigate to Trainers tab and verify instructor list",
        },
        {
          id: "REQ-005",
          title: "Attendance & Check-in Logging",
          category: "FUNCTIONAL",
          description: "Record daily gym member check-ins with automatic duplicate prevention.",
          acceptanceCriteria: [
            "POST /api/attendance/check-in logs attendance timestamp",
            "Daily check-in count increments in real-time",
          ],
          isCritical: true,
          endpoint: "/api/attendance/check-in",
          browserStep: "Click check-in button on active member and verify attendance badge updates",
        },
        {
          id: "REQ-006",
          title: "Payment Processing & Billing History",
          category: "FUNCTIONAL",
          description: "Process subscription payments and view transaction records.",
          acceptanceCriteria: [
            "POST /api/payments records transaction",
            "GET /api/payments returns payment history",
          ],
          isCritical: true,
          endpoint: "/api/payments",
          browserStep: "Submit payment form and verify receipt generation",
        },
        {
          id: "REQ-007",
          title: "Role-Based Access Control",
          category: "SECURITY",
          description: "Enforce strict role separation: member cannot access admin settings or delete records.",
          acceptanceCriteria: [
            "Member role receives 403 on admin-only routes",
            "Admin role has full CRUD capabilities",
          ],
          isCritical: true,
          endpoint: "/api/admin/settings",
          browserStep: "Assert admin settings menu is hidden for standard member accounts",
        },
      ],
      sampleDataset: {
        members: [
          { name: "Sarah Jenkins", plan: "GOLD_ANNUAL", status: "ACTIVE", email: "sarah@example.com" },
          { name: "Marcus Vance", plan: "MONTHLY_STANDARD", status: "ACTIVE", email: "marcus@example.com" },
        ],
        trainers: [
          { name: "Alex Rivers", specialty: "CrossFit & Strength", activeClients: 12 },
        ],
      },
    };
  }
}
