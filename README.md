# 🚀 Aegis AI: Autonomous Software Engineering Platform

Aegis AI is a state-of-the-art multi-agent software engineering platform that designs, generates, validates, heals, and audits production-grade applications from natural language prompts. It combines a robust CLI runtime with a visual IDE dashboard (Aegis Studio).

---

## ⚡ Getting Started (Under 3 Minutes)

### 1. Prerequisites
Ensure you have **Node.js (v20+)** and **pnpm** installed.

### 2. Clone & Build
```bash
git clone https://github.com/gopikahemanth/aegis-ai.git
cd aegis-ai
pnpm install
pnpm build
```

### 3. Environment Variables
Create a `.env` file in `packages/ai-core` or your shell configuration:
```env
GEMINI_API_KEY=your_google_gemini_api_key
```

---

## 🗺️ Architectural Ecosystem (Aegis X)

Aegis coordinates specialized developer roles dynamically depending on project scopes:

```
                  ┌──────────────────────┐
                  │      User Request    │
                  └──────────┬───────────┘
                             ▼
                  ┌──────────────────────┐
                  │    Team Coordinator  │
                  └──────────┬───────────┘
                             ▼
        ┌────────────────────┴────────────────────┐
        ▼                    ▼                    ▼
 ┌─────────────┐      ┌─────────────┐      ┌─────────────┐
 │ CEO / PM    │      │ Architect   │      │ DevOps Lead │
 └─────────────┘      └─────────────┘      └─────────────┘
        │                    │                    │
        └────────────────────┼────────────────────┘
                             ▼
                  ┌──────────────────────┐
                  │     Planning DAG     │
                  │   (Tiers 1 to 5)     │
                  └──────────┬───────────┘
                             ▼
                  ┌──────────────────────┐
                  │   Coder & Reviewer   │
                  └──────────┬───────────┘
                             ▼
                  ┌──────────────────────┐
                  │   Validation Build   │
                  └──────────┬───────────┘
                             ▼
                  ┌──────────────────────┐
                  │  AST Self-Healing    │
                  └──────────────────────┘
```

---

## 💻 CLI Commands Guide

Aegis provides a comprehensive developer console inside `apps/cli`. To execute commands:

### 1. Generate Applications
Creates standard frameworks, sets up database networks, and builds the target:
```bash
node apps/cli/dist/index.js create "Build a modern dark-themed habits tracker"
```
To ingest visual Figma layouts or database designs:
```bash
node apps/cli/dist/index.js create "Match this dashboard template" --image /path/to/mockup.png
```

### 2. Run Security Audits (SAST Shield)
Performs static analysis on the codebase to scan for secret leakage, Cross-Site Scripting (XSS), and arbitrary code execution vectors:
```bash
node apps/cli/dist/index.js audit
```

### 3. Retrieve Live Analytics
Tracks build compilations, average healing cycles, token cost breakdowns, and optimization suggestions:
```bash
node apps/cli/dist/index.js analytics
```

### 4. Execute Competitive Benchmarks
Runs one of the **10 standard benchmark projects** (Portfolio, SaaS, E-Commerce, Chat App, CRM, LMS, Chatbot, Blog, Banking ledger, Kanban PM) and scores build time and repair cycle performance against Claude Code and Cursor:
```bash
node apps/cli/dist/index.js benchmark <id>
```

---

## 🎨 Aegis Studio IDE
Experience Aegis visually via the desktop controller interface:
```bash
pnpm --filter @aegis/desktop dev
```
Navigate to `http://localhost:5173` to explore files, review commits, inspect agent DAG tasks, and chat with the team.

---

## 🔌 Writing Plugins (Extensions Marketplace)
Add custom linting, formatting, or compiler healing hooks by writing a simple JavaScript module in `.aegis/plugins/`:

```javascript
// .aegis/plugins/my-custom-formatter.js
export default {
  name: "custom-prettier-linter",
  format(filePath, content) {
    if (filePath.endsWith(".tsx")) {
      return content + "\n// Formatted by Aegis Custom Prettifier Plugin\n";
    }
    return content;
  },
  heal(filePath, error, content) {
    // Return repaired string if matching target pattern
    return null;
  }
};
```