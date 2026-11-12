# 🚀 Aegis AI — Autonomous Software Engineering Platform

Aegis AI is an autonomous, multi-agent software engineering system that researches, designs, generates, compiles, heals, and certifies production-grade web applications from natural language prompts. It features Autonomous Frontend Intelligence, technology-agnostic stack generation, and an AST self-healing compiler engine.

---

## 🌟 Core Capabilities

### 1. Autonomous Frontend Intelligence
Aegis functions as a researcher, art director, UX designer, and frontend architect before writing code:
- **Live Reference Research:** Analyzes domain vocabulary, color psychology, and ergonomic patterns.
- **Human-Readable Design Briefs:** Persists authoritative design strategies to `.aegis/design/frontend-design-brief.md`.
- **Machine-Readable Design Specs:** Locks comprehensive contracts in `.aegis/design/frontend-design-spec.json`.
- **Anti-Homogeneity & Diversity:** Rejects generic dark SaaS tropes and identical cards; synthesizes bespoke color palettes, layout balance, and responsive typography.
- **Responsive by Design:** Multi-viewport guarantees across Desktop (1920×1080), Laptop (1440×900), Tablet (768×1024), Mobile (375×667), and Small Mobile (360×800).

### 2. Supported Application Build Levels
Aegis categorizes application generation into three distinct architectural tiers:
- **Level 1 — Pure Frontend Application:** Client-side only or static websites with zero backend files, zero databases, and zero API route stubs.
- **Level 2 — Frontend with External API:** Rich client interfaces integrating directly with external SaaS/REST APIs without redundant local backends.
- **Level 3 — Full Stack Web Application:** Coordinated client interface, application server, data persistence, and database schema migrations.

### 3. Multi-Language & Technology-Agnostic Generation
Aegis supports native project generation without silent framework substitution or cross-framework contamination:
- **Frontend Frameworks:** React (Vite SPA), Vue 3 (Vite + Pinia + Vue Router), SvelteKit, Next.js (App Router), Angular 17+ (Standalone Components), HTML5/Vanilla ES6.
- **Backend Frameworks:** Node.js Express, Python FastAPI (Pydantic + APIRouter), Python Django, Java Spring Boot, PHP Laravel, ASP.NET Core, Go Standard.
- **Persistence Layers:** SQLite (with Prisma), PostgreSQL, MongoDB (with Mongoose).

### 4. AST Self-Healing & Verification Engine
- **Deterministic Sanitizer:** Eliminates syntax truncations and unresolved symbol imports.
- **In-Project Test Suite:** Automatically generates and executes isolated Vitest/Jest suites inside the generated project.
- **Headless Browser Runtime Audit:** Validates real DOM rendering, interaction provenance (NIR), and console zero-error stability via Chromium.

---

## 🏛️ System Architecture

```
                       ┌──────────────────────┐
                       │     User Prompt      │
                       └──────────┬───────────┘
                                  │
                                  ▼
                       ┌──────────────────────┐
                       │ ArchitectureResolver │
                       │ (Level & Stack Lock) │
                       └──────────┬───────────┘
                                  │
                                  ▼
                       ┌──────────────────────┐
                       │    Orchestrator      │
                       └──────────┬───────────┘
                                  │
         ┌────────────────────────┴────────────────────────┐
         ▼                                                 ▼
┌─────────────────────────┐                     ┌─────────────────────────┐
│ FrontendDesignPlanner   │                     │ AdapterRegistry         │
│ - Live Research         │                     │ - ReactViteAdapter      │
│ - Design Brief (.md)    │                     │ - VueAdapter            │
│ - Design Spec (.json)   │                     │ - SvelteAdapter         │
└────────┬────────────────┘                     │ - NextJsAdapter         │
         │                                      │ - AngularAdapter        │
         └────────────────────────┬─────────────│ - FastApiAdapter        │
                                  │             │ - NodeExpressAdapter    │
                                  ▼             └─────────────────────────┘
                       ┌──────────────────────┐
                       │ ProjectStartupAgent  │
                       │ (Contamination Guard)│
                       └──────────┬───────────┘
                                  │
                                  ▼
                       ┌──────────────────────┐
                       │ Coder & Reviewer DAG │
                       └──────────┬───────────┘
                                  │
                                  ▼
                       ┌──────────────────────┐
                       │ Build & Self-Healing │
                       └──────────────────────┘
```

---

## 📊 Verified Technology Capability Matrix

Aegis verifies technology capabilities against an honest 8-level verification standard:
`Level A (Taxonomy)` ➔ `Level B (Contract)` ➔ `Level C (Scaffolding)` ➔ `Level D (Feature Gen)` ➔ `Level E (Compilation)` ➔ `Level F (Dev Server)` ➔ `Level G (Browser Runtime)` ➔ `Level H (E2E Workflows)`.

> **Verification Rule:** A platform test or contract test passing demonstrates architectural resolution and scaffolding accuracy. It does not certify headless browser runtime execution unless explicitly verified.

| Technology | Category | Verified Levels | Support Classification | Real Verification Scope & Evidence |
| :--- | :--- | :--- | :--- | :--- |
| **React + Vite** | Frontend Framework | **A, B, C, D, E, F, G, H** | `FULLY_VERIFIED` | Full compiler, live dev server, headless Chromium DOM rendering, and API workflow verifier passed. |
| **Node.js Express** | Backend Framework | **A, B, C, D, E, F, G, H** | `FULLY_VERIFIED` | Full TypeScript compilation, process lifecycle, REST routes, and API workflow verifier passed. |
| **SQLite (Prisma)** | Database | **A, B, C, D, E, F, G, H** | `FULLY_VERIFIED` | In-process database with Prisma migrations and transactional state validation verified. |
| **HTML5 / Vanilla** | Frontend Platform | **A, B, C, D, E** | `SCAFFOLDING & SYNTAX VERIFIED` | Zero-dependency native files (`index.html`, `styles.css`, `app.js`), semantic HTML, responsive CSS, DOM handlers. |
| **Vue 3** | Frontend Framework | **A, B, C, D** | `SCAFFOLDING & CONTRACT VERIFIED` | Verified scaffolding, SFC generation (`.vue`), Vue Router, Pinia store, and Vite config. |
| **SvelteKit** | Frontend Framework | **A, B, C, D** | `SCAFFOLDING & CONTRACT VERIFIED` | Verified `+page.svelte`, `+layout.svelte`, and SvelteKit config scaffolding. |
| **Next.js** | Full-Stack Framework | **A, B, C, D** | `SCAFFOLDING & CONTRACT VERIFIED` | Verified App Router layout (`layout.tsx`), page server components, and NextConfig. |
| **Angular 17+** | Frontend Framework | **A, B, C, D** | `SCAFFOLDING & CONTRACT VERIFIED` | Standalone components (`@Component`), `RouterOutlet`, `app.routes.ts` verified; live CLI compiler pending. |
| **Python FastAPI** | Backend Framework | **A, B, C, D** | `SCAFFOLDING & SCHEMA VERIFIED` | Pydantic schemas, CORS, router verified; Level E requires host Python/uvicorn runtime. |
| **PostgreSQL** | Database | **A, B, C, D** | `SCHEMA & CONNECTION VERIFIED` | Prisma schema and PostgreSQL connection string scaffolding verified. |
| **MongoDB** | Database | **A, B, C, D** | `SCHEMA & CONNECTION VERIFIED` | Mongoose schema and MongoDB connection string scaffolding verified. |
| **Python Django** | Backend Framework | **A, B** | `CONTRACT RESOLVED ONLY` | Architecture contract and taxonomy mapped; generation adapter in progress. |
| **Java Spring Boot** | Backend Framework | **A, B** | `NOT_IMPLEMENTED` | Architecture contract mapped; Maven/Gradle toolchain integration pending. |
| **PHP Laravel** | Backend Framework | **A, B** | `NOT_IMPLEMENTED` | Architecture contract mapped; Composer toolchain integration pending. |
| **ASP.NET Core** | Backend Framework | **A, B** | `NOT_IMPLEMENTED` | Architecture contract mapped; .NET SDK toolchain integration pending. |
| **Go Standard** | Backend Framework | **A, B** | `NOT_IMPLEMENTED` | Architecture contract mapped; Go toolchain integration pending. |

---

## 📂 Repository Structure

```
aegis-ai/
├── apps/
│   ├── cli/                     # Developer CLI console (aegis create, audit, benchmark)
│   └── desktop/                 # Aegis Studio visual IDE desktop controller
├── packages/
│   ├── ai-core/                 # Agent orchestration, architecture resolver, design intelligence, adapters
│   │   ├── src/agent/           # Core Orchestrator and task DAG execution
│   │   ├── src/design/          # FrontendDesignPlanner, asset director, visual verifiers
│   │   ├── src/platform/        # Technology registry, named stacks, framework adapters
│   │   ├── src/governance/      # Architecture contracts and anti-substitution gates
│   │   └── src/healing/         # AST self-healing and symbol repair engines
│   ├── agent-runtime/           # Pipeline execution engine and budget guards
│   ├── project-builder/         # Scaffolding templates, dependency resolution, installation
│   └── workspace/               # Monorepo and file tree utilities
├── docs/
│   ├── architecture/            # Canonical architecture specifications and certification matrices
│   ├── development/             # Cleanup reports, setup guides, and development standards
│   └── audit/                   # Deep diagnostic audits and benchmark analyses
├── scripts/                     # Verification runners, patch utilities, and benchmark scripts
├── package.json                 # Monorepo package manifest
├── pnpm-workspace.yaml          # Workspace package definition
├── turbo.json                   # Turborepo task pipeline configuration
└── README.md                    # Platform documentation entry point
```

---

## ⚡ Getting Started

### 1. Prerequisites
- **Node.js**: v20+ (v24 LTS recommended)
- **pnpm**: v9+ or v10+

### 2. Installation & Build
```bash
git clone https://github.com/gopikahemanth/aegis-ai.git
cd aegis-ai
pnpm install
pnpm build
```

### 3. Environment Configuration
Create a `.env` file in the root directory (or configure shell variables):
```env
GEMINI_API_KEY=your_google_gemini_api_key
GROQ_API_KEY=your_groq_api_key          # Optional failover
OPENROUTER_API_KEY=your_openrouter_key  # Optional failover
```

### 4. Generate Applications via CLI
```bash
# Generate a React application
node apps/cli/dist/index.js create "Build a modern task management board with drag-and-drop"

# Generate with explicit technology constraints (Vue 3, FastAPI, SQLite)
node apps/cli/dist/index.js create "Build an inventory management platform in Vue and FastAPI with SQLite"

# Generate a pure static frontend (zero backend/DB)
node apps/cli/dist/index.js create "Build a portfolio using pure HTML, CSS and JavaScript"
```

---

## 📚 Essential Architecture Specifications

For in-depth architectural specifications and implementation contracts, refer to:
- [Autonomous Frontend Generation](docs/architecture/autonomous-frontend-generation.md): Authoritative specification for research-driven frontend design.
- [Multi-Language Stack Generation](docs/architecture/multi-language-stack-generation.md): Multi-language taxonomy, named stacks, and framework adapters.
- [Real Application Certification](docs/architecture/multi-language-real-application-certification.md): The 8-level technology capability verification matrix and runtime evidence.
- [Target Architecture & Vision](docs/architecture/AEGIS_TARGET_ARCHITECTURE.md): Comprehensive system architecture and agent coordination model.

---

## 📄 License & Contribution
Aegis AI is an open platform for autonomous software engineering. See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines.
