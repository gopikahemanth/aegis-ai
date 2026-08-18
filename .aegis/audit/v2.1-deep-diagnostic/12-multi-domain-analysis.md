# Aegis V2.1 Deep Codebase Diagnostic — 12: Multi-Domain Contamination Analysis

**Audit Date:** August 18, 2026  
**Scope:** Impact of prompt domain variation on engine stability and hardcoded fallback leakage.

---

## 1. Domain Contamination Matrix

| Target Domain | Prompt Tested | Resulting Schema Models | Contaminating Artifacts Injected |
| :--- | :--- | :--- | :--- |
| **Task Management / Kanban** | Kanban board, columns, tasks, filtering | `User`, `Item`, `Activity`, `Setting` (Overwritten) | `scan.controller.ts`, `upload.middleware.ts`, `scan.service.ts`, `pdf.service.ts` |
| **E-Commerce** | Storefront, product catalog, cart, checkout | `User`, `Item`, `Activity`, `Setting` (Overwritten) | `api.ts` (ATS resume methods), `scan.routes.ts` |
| **IoT / Sensor Monitoring** | Real-time device telemetry, graphs, alerts | `User`, `Item`, `Activity`, `Setting` (Overwritten) | `AnalysisResult` / `ScanHistoryItem` types |

---

## 2. Root Mechanism of Cross-Domain Leakage

The cross-domain leakage does not originate from LLM hallucinations, but rather from **deterministic fallback routines**:
1. **Fallback Route Injectors:** `project-graph-engine.ts` and `canonical-file-graph.ts` treat ATS Resume routes as standard boilerplate.
2. **Missing File Generators:** `project-startup-agent.ts` synthesizes `uploadResume`, `analyzeResume`, and `pdf.service.ts` whenever standard API or history modules are missing.
3. **Static Schema Validator:** `orchestrator.ts` invokes `validateSchema()` without arguments, collapsing all rich domain schemas into a generic 4-model fallback (`User`, `Item`, `Activity`, `Setting`).
