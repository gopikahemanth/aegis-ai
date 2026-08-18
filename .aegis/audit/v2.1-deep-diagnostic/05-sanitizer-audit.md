# Aegis V2.1 Deep Codebase Diagnostic — 05: Sanitizer & AST Transformer Audit

**Audit Date:** August 18, 2026  
**Scope:** `FastDeterministicSanitizer`, `ASTSafeTransformer`, import reconcilers, and deterministic fixup routines.

---

## 1. Subsystem Architecture

Aegis uses a two-tier sanitization architecture to fix LLM-generated code errors before compiling:

1. **`FastDeterministicSanitizer` (`packages/ai-core/src/governance/fast-sanitizer.ts`):**
   - Resolves casing collisions on case-insensitive filesystems (Windows/macOS).
   - Injects missing UI dependencies (`@tanstack/react-table`, `lucide-react`, `clsx`, `tailwind-merge`).
   - Normalizes React Router imports (`Routes`, `Route`, `BrowserRouter`, `useNavigate`).
   - Fixes duplicate default exports and cleans broken markdown fences (` ```tsx `).

2. **`ASTSafeTransformer` (`packages/ai-core/src/governance/ast-safe-transformer.ts`):**
   - Parses TypeScript source files into TypeScript compiler ASTs (`ts.createSourceFile`).
   - Safely renames mismatched identifier bindings and replaces unsafe expressions without regex corruption.

---

## 2. Strengths & High-Value Mechanics

- **Casing Collision Resolver:** Detects when the LLM generates both `Navbar.tsx` and `navbar.tsx`, merging them into a single canonical file to prevent Windows git checkout collisions.
- **Import Normalization:** Auto-reconciles broken `.js` extension imports in TypeScript files (`import './components/Card.js'` -> `import './components/Card'`).
- **AST-Based Syntax Verification:** Rejects unclosed JSX tags and unclosed function braces before attempting disk writes.

---

## 3. Vulnerabilities & Discovered Faults

### 3.1 The Router Wrapping Race Condition
In React apps using React Router v6, components calling `useRoutes()` or `<Routes>` must be enclosed within a `<Router>` (such as `<BrowserRouter>`).
- In `FastDeterministicSanitizer.sanitizeProject()`, a transformation rule attempts to wrap `AppRoutes` in `App.tsx`:
  ```tsx
  <QueryClientProvider client={queryClient}>
    <AppRoutes />
  </QueryClientProvider>
  ```
- **The Defect:** The sanitizer injects `QueryClientProvider` but **omits `<BrowserRouter>`**, assuming `<BrowserRouter>` is placed inside `main.tsx`. However, `main.tsx` rendered `<App />` directly without `<BrowserRouter>`.
- **Runtime Consequence:** This exact flaw triggered the runtime crash observed in our live audit:
  ```
  useRoutes() may be used only in the context of a <Router> component.
  ```

### 3.2 Case-Insensitive Regex False Positive in Validator
- In `GeneratedFileValidator`, stub detection utilized:
  ```ts
  const STUB_REGEX = /\/\/\s*TODO/i;
  ```
- In Kanban applications, valid state definitions like `// todo, in-progress, done` matched this regex case-insensitively, incorrectly flagging complete feature modules as incomplete stubs and triggering unnecessary file regenerations.
