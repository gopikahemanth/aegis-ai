# Aegis V2.1 Deep Codebase Diagnostic — 04: Hardcoded Domain Contamination Audit

**Audit Date:** August 18, 2026  
**Scope:** Systematic search and evaluation of domain-specific hardcodings (e.g. ATS Resume Scanner leaks, Resume uploaders, AnalysisResult types) across all engine layers.

---

## 1. Executive Finding: ATS Resume Scanner Contamination

A major architectural defect in Aegis V2.1 is the widespread contamination of generic generation layers with code originally authored for an ATS Resume Scanner / Keyword Matcher application.

When the LLM omits certain standard files, fallback generators and recovery agents automatically synthesize hardcoded Resume Scanner artifacts instead of domain-neutral or prompt-inferred implementations.

---

## 2. Inventory of Hardcoded Domain Leaks

### 2.1 `packages/ai-core/src/agent/orchestrator.ts`
- **Lines 704–710 & 765–770:**
  In the schema generation and API contract prompt templates, the prompt string includes hardcoded ATS Resume relationships as "examples":
  ```ts
  // User 1:N Resume, User 1:N JobDescription, User 1:N MatchAnalysis
  // POST /api/analysis/analyze { resumeText, jobDescriptionText }
  ```
  This biases coder models toward generating resume parsing logic even when building unrelated applications (e-commerce, IoT dashboards, Kanban boards).

### 2.2 `packages/ai-core/src/startup/project-startup-agent.ts`
- **Lines 215–275 (`ensureRequiredCanonicalFiles`):**
  If `src/services/api.ts` is missing, it writes a hardcoded client:
  ```ts
  export async function analyzeScan(data: any): Promise<AnalysisResult> {
    const res = await apiClient.post<AnalysisResult>("/api/scans/analyze", data);
    return res.data;
  }
  export async function uploadResume(formData: FormData): Promise<{ text: string }> { ... }
  ```
- **Lines 305–337:** Injects `AnalysisResult` and `ScanHistoryItem` interfaces into `src/types/index.ts`.
- **Lines 339–395:** Injects `server/controllers/scan.controller.ts` with `uploadResume`, `analyzeResume`, and `keywordAnalyzeResume`.
- **Lines 397–413:** Injects `server/middleware/upload.middleware.ts` (Multer memory storage for resume uploads).

### 2.3 `packages/ai-core/src/validation/project-graph-engine.ts`
- **Lines 611–640, 804–840, 1245–1255 (`createCanonicalModuleOnDisk`):**
  When resolving missing imports for `scan.routes.ts`, `pdf.service.ts`, or `keyword.service.ts`, the engine writes hardcoded ATS resume keyword extractors and PDF parsing controllers to disk.

### 2.4 `packages/ai-core/src/governance/canonical-file-graph.ts`
- **Lines 934–970:**
  Fallback file graph explicitly defines ATS routes (`/api/scans/upload`, `/api/scans/analyze`, `/api/scans/history`) as mandatory baseline routes for any fullstack application.

---

## 3. Real-World Observation in Live Kanban Test

During our live generation test (`pnpm cli create "Build a modern Task Management Application..."`), the following Resume Scanner files were injected into the generated project:
1. `src/services/scan.service.ts` (containing `uploadResume` and `analyzeResume`)
2. `src/services/api.ts` (containing `analyzeScan` and `uploadResume`)
3. `server/controllers/scan.controller.ts` (containing `analyzeResume` and `uploadResume`)
4. `server/routes/scan.routes.ts`
5. `server/services/pdf.service.ts`
6. `src/features/history/services/historyService.ts`

These files had zero relevance to the user's Task Management / Kanban prompt, causing immediate domain contamination and compiler confusion during reconciliation.
