# 🏛️ Aegis AI — System Architecture

Aegis is an autonomous software engineering operating system designed to plan, implement, review, heal, and deploy applications. This document outlines its multi-agent coordinating runtime, memory schema, and extensible boundary designs.

---

## 1. Package Dependencies & Boundaries

Aegis is structured as a monorepo utilizing `pnpm workspaces` and `turbo` pipeline compilation:

```
                  ┌──────────────────────┐
                  │      apps/cli        │ (CLI Command Entrypoints)
                  └──────────┬───────────┘
                             │
                             ▼
                  ┌──────────────────────┐
                  │    apps/desktop      │ (Visual Monaco IDE Dashboard)
                  └──────────┬───────────┘
                             │
                             ▼
             ┌────────────────────────────────┐
             │    packages/project-builder    │ (File formatters & Extensions)
             └───────────────┬────────────────┘
                             │
                             ▼
                  ┌──────────────────────┐
                  │   packages/ai-core   │ (Orchestrator & Agent specialists)
                  └──────────────────────┘
```

*   `apps/cli`: CLI interface querying metrics, SAST audits, and benchmarks.
*   `apps/desktop`: Dashboard UI demonstrating layout trees and Monaco code editor windows.
*   `packages/project-builder`: Manages post-generation file writing and format plugins.
*   `packages/ai-core`: The brain containing orchestrators, self-healers, providers, and git integrations.

---

## 2. Distributed Agent Runtime (Pillar 1)

Instead of a single process, the runtime delegates tasks to a message-queue worker broker (`DistributedRuntimeEngine`):

*   **Enqueuing**: Tasks are transformed into `AgentJob` payloads detailing target roles and instructions.
*   **Worker Registry**: Agents subscribe to target channels (e.g., Coder, Database Lead).
*   **Fault Tolerance**: Failed execution tasks automatically trigger retry routines incorporating exponential backoff delays.

---

## 3. Knowledge Graph Memory System (Pillar 2)

Aegis records project evolution inside a semantic queryable Knowledge Graph (`knowledge-graph.json`):

*   **Nodes**: Projects, Features, Components, APIs, Decisions, and Commit timeline milestones.
*   **Edges**: Relational connections such as `DEPENDS_ON`, `IMPLEMENTS`, or `EXPLAINS`.
*   **Semantic Queries**: Developers can query history using natural language:
    *   *Why did we choose PostgreSQL?* -> Resolves relational decision reasoning nodes.
    *   *What depends on auth?* -> Traces inverse edge pathways.

---

## 4. Execution Pipeline (Prompt to Deployment)

```
[Prompt Ingest] ──> [Architect Specification] ──> [Dynamic Specialist Crew Enlist]
                                                               │
                                                               ▼
[Git Commit & PR Auditor] <── [Self-Healing & QA] <── [Planning DAG Execution]
```

1.  **Requirements**: `ArchitectAgent` maps specifications (frameworks, database boundaries) and image mockups.
2.  **Coordination**: `TeamCoordinator` enlists necessary leads (Frontend, Database, Security) including custom specialists dynamically loaded from `.aegis/plugins/`.
3.  **Planning**: `PlannerAgent` schedules parallel DAG execution tiers.
4.  **Implementation**: `CoderAgent` writes source files onto disk.
5.  **Validation & Self-Healing**: `BuildOrchestrator` compiles, runs linter checks, and starts headless Puppeteer visual reviewers. Fails trigger `RepairCoordinator` healing loops.
6.  **Git & PR Audit**: Commits changes to Git and generates an AI-powered regression audit PR template.
