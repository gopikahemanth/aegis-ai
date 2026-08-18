# Aegis V2.1 Deep Codebase Diagnostic — 07: Build & Runtime Analysis

**Audit Date:** August 18, 2026  
**Scope:** Build verification, bundling, TypeScript typecheck, dev server execution, and browser runtime validation.

---

## 1. Build Verification (`tsc && vite build`)

During live generation, the initial static TypeScript build completed successfully:
```
[Orchestrator] Running build verification in apps/cli/generated/project...
✓ Build succeeded.
```

However, subsequent self-healing attempts triggered TypeScript compilation errors:
```
src/features/kanban-board/hooks/useTaskStore.tsx(5,10): error TS2304: Cannot find name 'useTaskStore'.
 ELIFECYCLE  Command failed with exit code 2.
```
This demonstrated that while the core AST transformer prevented syntax crashes, semantic type references between newly generated modules and re-export shims can introduce build regressions.

---

## 2. Dev Server Lifecycle

- **Command:** `pnpm dev` (`vite --host 0.0.0.0 --port 5173`)
- **Port Conflict Management:** `SandboxVerifier` successfully cleaned up stale processes on port 5173 before binding.
- **Server Startup Time:** 530 ms.
- **Network Interface:** Bound to `http://localhost:5173/` and `http://10.181.202.202:5173/`.

---

## 3. Sandbox Headless Browser Review

- **Browser Engine:** Puppeteer (Chromium headless)
- **Screenshot:** Captured at `apps/cli/generated/project/screenshot.png`
- **Result:** FAILED with 4 fatal console errors:
  ```
  useRoutes() may be used only in the context of a <Router> component.
  useRoutes() may be used only in the context of a <Router> component.
  The above error occurred in the <Routes> component:
      at Routes (http://localhost:5173/node_modules/.vite/deps/react-router-dom.js)
      at AppRoutes
      at div
      at QueryClientProvider
      at App
  ```

---

## 4. Root Cause of Runtime Crash

The runtime crash was caused by an architectural discrepancy between entrypoint templates:
1. `src/main.tsx` rendered `<App />` directly inside React DOM root without enclosing it in `<BrowserRouter>`.
2. `src/App.tsx` rendered `<AppRoutes />` which internally called `useRoutes()`.
3. Because no parent `<Router>` context existed above `useRoutes()`, React Router v6 threw a fatal invariant exception during mount.
4. While `FastDeterministicSanitizer` attempted to normalize route trees, its AST transform only wrapped `App.tsx` with `<QueryClientProvider>`, omitting the necessary `<BrowserRouter>` component.
