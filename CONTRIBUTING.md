# Contributing to Aegis AI

Welcome! Thank you for helping build Aegis AI. Please follow these guidelines to get your environment configured and submit code.

---

## 🛠️ Development Setup

Aegis AI is managed via **Turborepo** and **pnpm workspaces**:

1. **Install pnpm**: Make sure pnpm is installed globally.
2. **Install Workspace Dependencies**:
   ```bash
   pnpm install
   ```
3. **Build Packages**:
   Build all packages inside the monorepo:
   ```bash
   pnpm build
   ```
4. **Link CLI Command**:
   To test CLI changes locally, execute the compiled index from `apps/cli`:
   ```bash
   node apps/cli/dist/index.js help
   ```

---

## 📁 Repository Structure

* `apps/cli/`: Console commands (create, edit, analytics, audit, benchmark).
* `apps/desktop/`: Aegis Studio React client.
* `packages/ai-core/`: Reasoning loops, agent modules, and provider configurations.
* `packages/project-builder/`: Template scaffolding and framework plugins.
* `packages/agent-runtime/`: Pipeline validator commands and AST compilation healers.

---

## 🧩 Adding a Custom Agent

To expand the **Dynamic AI Specialist Team**:
1. Create your agent class inside `packages/ai-core/src/agents/` extending `BaseAgent`.
2. Register the export in [packages/ai-core/src/agents/index.ts](file:///c:/Users/vishn/OneDrive/Desktop/Projects/aegis-ai/packages/ai-core/src/agents/index.ts).
3. Import your agent and define its enlisting parameters inside the coordinator at [packages/ai-core/src/agent/team-coordinator.ts](file:///c:/Users/vishn/OneDrive/Desktop/Projects/aegis-ai/packages/ai-core/src/agent/team-coordinator.ts).

---

## 📬 Pull Request Guidelines

1. **Create a Feature Branch**:
   Make branches off of `main` or checkout local branches.
2. **Type-Checking & Compilation**:
   Ensure all workspaces pass type safety and Turborepo checks before creating a commit:
   ```bash
   pnpm build
   ```
3. **Write Clear Commit Messages**:
   Follow conventional commits format:
   * `feat: add Dynamic QA Agent specialist`
   * `fix: prevent double React Router encapsulation in index templates`
