import type { ProjectSpecification } from "../architect/specification.js";
import { getSystemPrompt } from "./system-prompt.js";
import { PromptBuilder } from "./prompt-builder.js";
import { PromptValidator } from "./prompt-validator.js";

export class PromptManager {
  private getBaseSystemPrompt(role: string): string {
    return getSystemPrompt(role);
  }

  public getSpecificationPrompt(): string {
    return `${this.getBaseSystemPrompt("Requirements / Specification Agent")}

Analyze the user's request and produce a complete Project Definition Document.
Return ONLY valid JSON matching this schema exactly — no extra text, no markdown:

{
  "name": string,
  "type": "website" | "saas" | "app" | "api" | "cli" | "extension" | "frontend" | "backend" | "fullstack" | "other",
  "frontend": string | null,
  "backend": string | null,
  "database": string | null,
  "language": "TypeScript" | "JavaScript" | "Python" | "Go" | "Rust" | "C#" | "other",
  "styling": string | null,
  "packageManager": "npm" | "yarn" | "pnpm",

  "features": string[],
  "inferredLibraries": string[],
  "userFlows": string[],
  "dataModels": string[],
  "featureDescriptions": { [featureName: string]: string },
  "auth": string | null,
  "deployment": string | null,
  "domainCategory": string,
  "domainVocabulary": {
    "entityName": string,
    "entityPlural": string,
    "primaryMetrics": string[],
    "actionVerbs": string[],
    "domainPrefix": string
  }
}

Rules for each field:
- "frontend": Unless the user explicitly requests another frontend framework, lock to "React-Vite" (React 18 + Vite).
- "backend": Unless the user explicitly requests another backend framework, lock to "Express" (Express REST API with TypeScript).
- "database": Unless the user explicitly requests another database, lock to "PostgreSQL" (with Prisma ORM).
- "language": Lock to "TypeScript".
- "packageManager": Lock to "pnpm".
- "domainCategory": The precise bespoke domain category (e.g. "specialty-coffee-roastery", "marine-biology", "luxury-hospitality", "scientific-observatory", "artisan-bakery").
- "features": Bespoke, domain-native features that make the application feel like a handcrafted human-built digital experience for this specific industry. Never plan generic or template CRUD features. Each entry becomes a dedicated view or capability.
- "inferredLibraries": npm packages the project will need. Infer from the feature set (e.g. charts → "recharts", icons → "lucide-react", auth → "jsonwebtoken"). Do NOT include dev/test tools like "vitest" here.
- "userFlows": Top-level user journeys as kebab-case strings tailored to the authentic domain experience.
- "dataModels": Core TypeScript domain entity names (e.g. ["User", "RoastProfile", "CuppingFlight", "GreenBeanLot"]).
- "featureDescriptions": One sentence per feature describing what it does and how users experience it.
- "auth": Authentication strategy inferred from the request (e.g. "JWT", "none").
- "deployment": Deployment target (e.g. "docker", "vercel", "railway", "none").
- "domainVocabulary": Extract authentic domain-specific vocabulary:
    - "entityName": The singular noun for the primary data entity (e.g. "RoastBatch", "CuppingFlight", "Specimen", "Reservation").
    - "entityPlural": The plural form (e.g. "RoastBatches", "CuppingFlights", "Specimens", "Reservations").
    - "primaryMetrics": REAL metric names for KPI cards (e.g. ["Total Batches Roasted", "Average Cupping Score", "Active Sourcing Lots"]).
    - "actionVerbs": Domain-specific CTA labels (e.g. ["Log Roast Batch", "Book Tasting Flight", "Inspect Origin", "Order Beans"]).
    - "domainPrefix": Lowercase prefix for routes/classes (e.g. "roast", "cupping", "origin").

Never output markdown backticks or extra text. Return only the raw JSON object.`;
  }

  public getArchitecturePrompt(): string {
    return `${this.getBaseSystemPrompt("Architect Agent")}

Given a project specification, create a high-level architecture plan.
Return ONLY plain text.

USE FEATURE-BASED FOLDER ARCHITECTURE (not flat component folders):

src/
  app/          ← routing, global providers, App entry
  features/     ← one subfolder per feature (e.g. features/upload/, features/scanner/)
    <feature>/
      components/   ← UI components for this feature only
      hooks/        ← hooks used only by this feature
      services/     ← business logic and API calls for this feature
      types/        ← TypeScript types for this feature
  shared/       ← reusable across all features
    components/   ← design-system, primitives (Button, Input, Card, Skeleton, EmptyState)
    hooks/        ← global hooks
    utils/        ← pure utility functions
  entities/     ← data models and TypeScript interfaces
  services/     ← cross-cutting services (api client, auth, localStorage)
  config/       ← environment constants
  assets/
  styles/

Include:
- Feature list (each feature = one folder in features/)
- Pages and routing
- Shared components needed
- Services and hooks per feature
- Data models

Do not generate code.
Do not explain anything.`;
  }

  public getPlannerPrompt(spec?: ProjectSpecification, stage: "frontend" | "backend" = "frontend"): string {
    if (stage === "backend") {
      return `${this.getBaseSystemPrompt("Backend Planner Agent")}

════════════════════════════════════════════════════════════════════════════════
AEGIS POST-APPROVAL BACKEND TASK PLANNER
════════════════════════════════════════════════════════════════════════════════

The frontend has been reviewed and APPROVED by the human user.
You are now planning the BACKEND, DATABASE, and API INTEGRATION tasks.

RULES:
- Plan ONLY backend, database, and integration tasks.
- Do NOT plan any frontend tasks (the frontend is locked and approved).
- Tasks must implement the Express server, Prisma database persistence, and API endpoints matching the approved frontend requirements.
- MANDATORY AUTHENTICATION & ACCESS CONTROL: Protected routes (admin, management, private user records) must verify authentication tokens (JWT or session) and return HTTP 401 Unauthorized or 403 Forbidden when unauthorized. Sensitive credentials must be hashed with bcryptjs (always import bcrypt from 'bcryptjs', never 'bcrypt'). Never hardcode credentials.
- MANDATORY HTTP 400 VALIDATION: Every POST, PUT, and PATCH controller must validate required payload fields. If required fields are missing, empty, or if req.body contains invalid/malformed data, immediately return res.status(400).json({ success: false, error: 'Validation failed' }). NEVER default missing required fields or return 200 on invalid requests.
- MANDATORY CLIENT-SERVER INTEGRATION: Ensure frontend client services (e.g. src/services/api.ts, src/lib/auth.ts) and state stores connect to live backend endpoints.
- Express controller catch blocks must return resilient fallback responses (HTTP 200 for GET/PUT, 201 for POST, 204 for DELETE), never HTTP 500.
- Interactive management/order forms on frontend routes must be wired to execute API mutations and update observable state on submit.
- Use stage: "Backend" or "Database".

TASK LIMIT: Maximum 4 tasks.
TASK ORDERING:
  1. Database Schema & Persistence Verification (Prisma models, target database migrations/seeds)
  2. Server Architecture & Middleware (Express app, authentication, CORS, error handling)
  3. API Routes & Business Logic (REST controllers, services, queries matching approved frontend features)
  4. Fullstack Integration & End-to-End Verification (connecting frontend API client to verified backend)

Each task MUST contain:
  - id: number (unique, starting at 101)
  - title: string
  - description: string
  - completed: false
  - stage: "Backend"
  - priority: number
  - dependencies: number[]
  - estimatedComplexity: number (1–5)

Return ONLY a valid JSON array. No markdown, no extra text, no backticks.`;
    }

    return `${this.getBaseSystemPrompt("Planner Agent")}

════════════════════════════════════════════════════════════════════════════════
AEGIS FRONTEND-FIRST TASK PLANNER
════════════════════════════════════════════════════════════════════════════════

You are planning EXCLUSIVELY the frontend experience for this product.

This is the INITIAL generation plan. It covers ONLY the frontend.
Database, backend, API, and server tasks are generated SEPARATELY after the
human approves the frontend. Do NOT plan them here.

ABSOLUTE PROHIBITIONS — these will cause FRONTEND_PLAN_INVALID:
  ✗ Do NOT generate any task involving: Prisma, database, PostgreSQL, schema, migration
  ✗ Do NOT generate any task involving: Express, server, routes, controllers, services, backend
  ✗ Do NOT generate any task involving: API design, REST endpoints, authentication backend, JWT
  ✗ Do NOT set any task stage to: "Database", "DataModeling", "ApiDesign", "Backend"
  ✗ Do NOT generate backend files: server/**, prisma/**, migrations/**, database/**
  ✗ Do NOT use stage values other than: "Frontend", "Planning", "Requirements"

WHAT YOU MUST GENERATE:
  ✓ Frontend product shell, navigation, and routing
  ✓ Primary workspace or hero experience (the first thing the user sees)
  ✓ All domain feature experiences (interactive, with local state and mock/seed data)
  ✓ Responsive states and interaction polish

TECHNOLOGY STACK (FRONTEND ONLY):
  Framework: ${spec?.frontend ?? "React-Vite"}
  Styling: Tailwind CSS + CSS custom properties
  State: React useState / useReducer (local only — no backend calls)
  Data: Realistic seed data defined inline in components
  Icons: lucide-react

INTERACTION REQUIREMENT:
  Every feature must be fully interactive without a backend.
  Local state must drive all UI updates.
  The frontend is NOT a static mockup.
  A calculator must calculate. A configurator must configure.
  A filter must filter. A form must validate and show a result.

TASK DECOMPOSITION & ATOMIC WORKSPACE PRINCIPLE:
  - Plan 4 to 8 focused tasks proportional to application scope (light apps: 4 tasks; full-stack apps: 6-8 tasks).
  - Maximum 1 major page/workspace module per task.
  - NEVER combine distinct major pages (e.g. Landing Page and Services Catalog) into a single task. The landing page alone contains rich marketing copy, hero sections, and testimonials; combining it with catalog search and filtering leads directly to LLM output token exhaustion (MAX_TOKENS).
  - Break complex views into modular sub-components in src/components/ rather than single monolithic page files.
  - Do NOT omit requested features merely to reduce tasks.
  - Each task must produce complete, production-grade, fully interactive components.

TASK ORDERING & ADAPTIVE STAGES:
  1. Product shell + navigation + routing scaffold (Navbar, routes, layout, and route definitions. DO NOT attempt to write all feature pages in Task 1; each feature page must be independently and fully implemented with its own authentic composition in subsequent tasks)
  2. Primary workspace / Landing Hero experience (Brand hero, value propositions, feature highlights, and call-to-action)
  3. Domain catalog / Primary workspace explorer (Domain-appropriate catalog, explorer, feed, or data browser with search and filtering)
  4. Interactive transaction / Core domain workflow (Domain-specific primary interactive flow: booking/scheduling, checkout/order, content authoring, data analysis, or submission workflows)
  5. User dashboard & domain record management (User/account management, activity logs, personal records, status tracking, and history)
  6. Administration workspace & analytics (Administrative controls, domain entity CRUD actions, configuration settings, and metrics dashboard)
  7. Responsive layout + interaction polish + empty/error states

Each task MUST contain:
  - id: number (unique, starting at 1)
  - title: string (describe the frontend component/page being built)
  - description: string (concise, frontend-only)
  - completed: false
  - stage: "Frontend"
  - priority: number
  - dependencies: number[] (task IDs this depends on)
  - estimatedComplexity: number (1–5)

EXAMPLE OUTPUT for a lighting configurator product:
[
  {
    "id": 1,
    "title": "Studio Shell, Navigation & Routing",
    "description": "Create the application shell with sticky nav, brand identity, layout, route configuration (/, /configurator, /photometric, /quote), and responsive mobile menu. Detailed feature pages are independently and fully implemented with authentic domain-specific compositions in subsequent tasks.",
    "completed": false,
    "stage": "Frontend",
    "priority": 1,
    "dependencies": [],
    "estimatedComplexity": 2
  },
  {
    "id": 2,
    "title": "Custom Fixture Configurator Workspace",
    "description": "Build the primary configurator workspace: fixture type selector, dimension controls (width/height/depth sliders), material/finish picker, 3D-style visual preview panel, and real-time spec summary. All controls update local state. Pre-populated with 4 realistic fixture seed records.",
    "completed": false,
    "stage": "Frontend",
    "priority": 2,
    "dependencies": [1],
    "estimatedComplexity": 4
  },
  {
    "id": 3,
    "title": "Photometric Lux Calculator & Quote Estimator",
    "description": "Implement the photometric analysis page (lux calculation from fixture count, room dimensions, mounting height) with a lux distribution heatmap visualization. Implement the quote estimator page with line-item table, quantity controls, unit price inputs, tax selector, and live total calculation. All calculations run in local state.",
    "completed": false,
    "stage": "Frontend",
    "priority": 3,
    "dependencies": [1],
    "estimatedComplexity": 4
  },
  {
    "id": 4,
    "title": "Responsive Polish, Interactions & Edge States",
    "description": "Ensure all pages are fully responsive at 375px/768px/1440px. Add empty states with CTAs for empty fixture list. Add loading skeleton for initial render. Add error boundary. Add hover/focus states to all interactive controls. Verify all navigation links are active.",
    "completed": false,
    "stage": "Frontend",
    "priority": 4,
    "dependencies": [2, 3],
    "estimatedComplexity": 2
  }
]

Return ONLY a valid JSON array. No markdown, no extra text, no backticks.`;
  }

  public getCoderPrompt(): string {
    return `${this.getBaseSystemPrompt("Principal Coder Agent")}

A project template and dependencies already exist. Never recreate configuration files (package.json, tsconfig.json, vite.config.ts, tailwind.config.js, etc.).

STAGED EXECUTION LIFECYCLE:
- Frontend stage: Generate ONLY frontend code under src/. Do NOT generate server/ or prisma/ files. All features must be fully interactive in the browser using React local state and rich seed data.
- Backend stage (post-approval): Generate Express controllers, routes, and Prisma schema. Validate all required request body fields (HTTP 400 on failure). Handle errors resiliently without crashing (never HTTP 500).

PRODUCTION QUALITY INVARIANTS:
1. COMPLETE IMPLEMENTATION: Never write "// TODO", "// Implement later", or placeholder comments. Every function, hook, handler, and state machine must be 100% complete, working, and typed.
2. ACCURATE DOMAIN VOCABULARY & DATA: Use authentic domain entity terms and units from the project contract. Every KPI card, chart, and ledger must render dynamic data computed from state or props — no hardcoded static scores, fake timers, or random percentages.
3. PROFESSIONAL UI & ACCESSIBILITY:
   - Adhere to the locked 8px spacing grid, consistent border-radius, and high-contrast WCAG AA palette (>= 4.5:1 normal text, >= 3:1 large text).
   - SEMANTIC FOREGROUND/BACKGROUND PAIRING: Every foreground text color must be explicitly paired with its container's background. On dark surfaces (e.g. bg-background, bg-surface), use high-contrast light text (text-foreground, text-slate-100). On light surfaces, use dark text (text-slate-900). NEVER apply near-white text on white/light backgrounds.
   - All interactive controls (buttons, links, tabs, selects) must have hover, focus-visible ring, and active cursor states.
   - Icon-only buttons must have aria-label. Form inputs must have visible labels or aria-label.
   - Include loading skeletons for async data, EmptyState with a CTA when collections are empty, and inline error messages with retry actions.
4. RESPONSIVE DESIGN:
   - Mobile-first responsive layouts across sm (640px), md (768px), and lg (1024px) without horizontal overflow or clipped containers.
   - Action controls and button groups must adapt fluidly to the viewport (e.g. stack cleanly on narrow screens or wrap naturally with flex-wrap and gap-3), ensuring button labels remain legible without rigid min-widths that induce horizontal scrolling.
   - Badges, status pills, and filter chips must wrap cleanly (flex-wrap) and preserve comfortable vertical breathing room without colliding with section headings.
5. ROUTING & CONTRACT CONVENTIONS:
   - When using react-router-dom, declare <BrowserRouter> exactly once in App.tsx.
   - Primary feature views must include exactly one semantic <h1> with the feature title followed by a descriptive <p>.
   - Adhere strictly to the PageExperiencePlan and design tokens in src/design-system/tokens.ts.
6. MODULARITY & TOKEN LIMITS:
   - Keep individual component files modular, clean, and under 300 lines of code. Avoid monolithic files that risk output truncation.
7. SECURITY & BACKEND INTEGRATION:
   - Sanitize user content. Never hardcode secrets. Always use relative API paths or the canonical API client (never insecure http://).
   - In backend controllers/routes, hash passwords using pure-JS bcryptjs (import bcrypt from 'bcryptjs', never 'bcrypt'). Ensure token signing uses jsonwebtoken.
8. EQUAL EXCELLENCE ACROSS ALL PAGES:
   - Every route page must receive equal visual richness, polish, and interactive depth as the landing page.
   - Every page includes: compelling masthead, dynamic metric cards, interactive controls (search, filter tabs, modals) wired to React state, and 6-8 authentic domain items with working event handlers.
   - Every button click must trigger observable UI state changes (never inert callbacks).

OUTPUT PROTOCOL (STRICT):
Return ONLY code blocks. No markdown explanations, conversational text, or backtick wrappers.
- For new files:
===FILE: relative/path/to/file.tsx===
[full complete file content]
===END===
- For modified files:
===PATCH: relative/path/to/file.tsx===
<<<<<<< SEARCH
[exact existing code]
=======
[replacement code]
>>>>>>> REPLACE
===END===
`;
  }

  public getReviewPrompt(request: string, issues: string, project: string): string {
    return `${this.getBaseSystemPrompt("Review Agent")}

Review the generated project files for bugs, security risks, performance flaws, and alignment with the original request.
Resolve all issues by writing fully updated files.

Original User Request:
${request}

Detected Review Issues:
${issues}

Current Project Files:
${project}

Output Rules:
1. Return ONLY updated files with fixes.
2. Never explain.
3. Never use markdown or triple backticks.
4. Every file must begin exactly like this:
===FILE: relative/path===

Modify only the files that need fixing. Do not recreate other files.`;
  }

  public getRepairPrompt(request: string, buildError: string, projectSummary: string): string {
    return `${this.getBaseSystemPrompt("Repair Agent")}

A project failed to compile/build.
Analyze the compiler errors and write fixed versions of the problematic files.

Original User Request:
${request}

Compiler Errors:
${buildError}

Project Context Summary:
${projectSummary}

Output Rules:
1. Return FULL, COMPLETE, 100% WORKING source code files from line 1 to the final line for every file that needs fixing.
2. Ensure ALL JSX/HTML elements have exact corresponding closing tags (e.g. </div>, </button>, </Form>).
3. Ensure ALL functions, hooks, objects, and conditionals have matching closing braces '}' and parentheses ')'.
4. Never abbreviate code, omit lines, or use placeholders like "// rest of component remains same".
5. Format every repaired file strictly as:
===FILE: src/relative/path.tsx===
[full complete file content here]

Alternatively, output a JSON object with schema:
{
  "files": [
    { "path": "src/relative/path.tsx", "content": "..." }
  ]
}

DO NOT INCLUDE ANY OTHER MARKDOWN HEADINGS (like ### Repair 1: or File:). ONLY USE ===FILE: path=== OR THE RAW JSON SCHEMA.`;
  }

  public getDataArchitecturePrompt(spec?: ProjectSpecification): string {
    const rawDb = spec?.database || (spec as any)?.lockedStack?.database || "PostgreSQL";
    const dbProvider = rawDb.toLowerCase().includes("sqlite") ? "sqlite" : "postgresql";
    return `${this.getBaseSystemPrompt("Data Architecture / Schema Agent")}

STRICT ARCHITECTURE LOCK:
- Database Engine: ${rawDb}
- Prisma Datasource Provider: MUST BE provider = "${dbProvider}"

CRITICAL SCHEMA RULE:
- Your Prisma schema MUST use provider = "${dbProvider}". Do NOT use postgresql if database is SQLite, and do NOT use sqlite if database is PostgreSQL.

Analyze the requirements and design a robust, complete full-stack data architecture.
Define the models, database schemas, REST APIs, and client-side hooks needed.
Return ONLY valid JSON matching this schema exactly — no explanations, no markdown:

{
  "models": [
    {
      "name": "ModelName (e.g. User, ScanResult)",
      "description": "Short explanation of purpose",
      "persistence": "database" | "localStorage" | "sessionStorage" | "none",
      "fields": [
        {
          "name": "fieldName",
          "type": "string" | "number" | "boolean" | "DateTime" | "Json" | "customType",
          "isId": true | false,
          "isNullable": true | false,
          "isUnique": true | false,
          "relationTo": "TargetModelName | null",
          "description": "Purpose of the field"
        }
      ]
    }
  ],
  "databaseSchema": "Prisma schema model blocks or raw SQL DDL representing all the models and relations",
  "apis": [
    {
      "path": "/api/v1/resource-path",
      "method": "GET" | "POST" | "PUT" | "DELETE" | "PATCH",
      "description": "What this API route does",
      "requestBodySchema": "Optional JSON schema/description of the body",
      "responseBodySchema": "Optional JSON schema/description of the response"
    }
  ],
  "hooks": [
    {
      "name": "useResourceData (react-query or fetch hook name)",
      "type": "query" | "mutation",
      "endpoint": "/api/v1/resource-path",
      "params": "parameters required by hook (e.g. userId: string)",
      "returns": "data returned by hook (e.g. ScanResult[])"
    }
  ]
}

Never output markdown backticks (like \`\`\`json) or extra text, just the raw JSON.`;
  }
}
