# Aegis AI — Technology-Agnostic Multi-Language & Multi-Stack Architecture

> **Authoritative Specification Document**
> **Status:** Active & Implemented
> **Target Version:** Aegis AI 2.2.0+
> **Initiative:** Autonomous Frontend & Full-Stack Intelligence

---

## Executive Summary

Aegis AI has evolved from a single-framework generator into a **design-agnostic and technology-agnostic autonomous software engineer**.

While the design intelligence pipeline (`ProductUnderstanding`, `ReferenceResearch`, `DesignPipeline`, `ThemeGenerator`, `DesignSystemGenerator`, `PageDesignSpecificationEngine`, and `AssetDirector`) formulates framework-independent design tokens and architectural specifications, the **Technology Generation Layer** maps those decisions into native idioms across frontend frameworks, backend runtimes, database engines, and full-stack combinations.

Aegis is permanently unbound from assumptions that every project must use React, Vite, TypeScript, Tailwind, Node.js, or Express.

---

## 1. Core Architectural Separation

```
                   USER REQUIREMENTS & CONSTRAINTS
                                  │
                                  ▼
      ┌────────────────────────────────────────────────────────┐
      │         AUTONOMOUS FRONTEND DESIGN INTELLIGENCE        │
      │   (Product Identity, Visual Direction, Design Tokens,  │
      │    Page Specs, Section Topology, Responsive Rules)     │
      │          .aegis/design/frontend-design-spec.json       │
      └───────────────────────────┬────────────────────────────┘
                                  │ (Framework-Agnostic Contract)
                                  ▼
      ┌────────────────────────────────────────────────────────┐
      │           STACK SELECTION INTELLIGENCE ENGINE          │
      │   (Resolves Build Level 1 / 2 / 3 & Stack Contract)    │
      └───────────────────────────┬────────────────────────────┘
                                  │
             ┌────────────────────┼────────────────────┐
             ▼                    ▼                    ▼
      [Situation A]        [Situation B]        [Situation C]
      User Explicit        User Explicit        Autonomous
      Named Stack          Individual Techs     Requirement-Driven
             │                    │                    │
             └────────────────────┬────────────────────┘
                                  ▼
      ┌────────────────────────────────────────────────────────┐
      │          TECHNOLOGY GENERATION ADAPTER REGISTRY        │
      └──────┬────────────┬─────────────┬────────────┬─────────┘
             │            │             │            │
             ▼            ▼             ▼            ▼
       React/Vite    Vue 3 (SFC)     Svelte 4/5    Next.js   Vanilla HTML5
        Adapter        Adapter        Adapter      Adapter      Adapter
```

1. **Design Tokens & Specifications Are Framework-Agnostic:**
   - Palettes, fluid font clamps, section hierarchies, grid rules, accessibility targets, and asset manifests reside in `.aegis/design/frontend-design-spec.json`.
2. **Adapters Translate to Framework-Native Patterns:**
   - React adapters emit functional components with TypeScript/JSX and Tailwind/CSS variables.
   - Vue adapters emit Single File Components (`.vue`) utilizing `<script setup lang="ts">` and `<template>`.
   - Svelte adapters emit idiomatic `<script lang="ts">` components with reactive props.
   - Next.js adapters emit React Server Components (RSC) and App Router configurations (`app/layout.tsx`, `app/page.tsx`).
   - Vanilla HTML adapters emit clean, semantic HTML5, pure CSS custom properties, and zero-dependency ES6 scripts.

---

## 2. Technology Classification & Capability Registry

Aegis maintains an authoritative `TechnologyCapabilityRegistry` (`packages/ai-core/src/platform/technology-capability-registry.ts`) classifying technologies across categories and capability statuses:

| Category | Registered Technologies | Status |
| :--- | :--- | :--- |
| **Frontend Languages** | HTML5, CSS3, JavaScript, TypeScript, Dart, Elm, ReScript, Kotlin/JS, Rust/WASM, Go/WASM | `FULLY_SUPPORTED` / `PARTIALLY_SUPPORTED` |
| **Frontend Frameworks** | React, Next.js, Remix, Gatsby, Preact, Vue 3, Nuxt 3, Angular 17+, Svelte, SvelteKit, Solid, Qwik, Astro, HTMX, Alpine.js | `FULLY_SUPPORTED` |
| **Styling Systems** | CSS3, Sass/SCSS, Less, Tailwind CSS, Bootstrap 5, Bulma, Material UI, Chakra UI, Ant Design, shadcn/ui | `FULLY_SUPPORTED` |
| **Template Technologies**| TSX/JSX, Vue SFC, Svelte SFC, Handlebars, EJS, Pug, Liquid, Jinja2, Blade, Twig, MDX | `FULLY_SUPPORTED` |
| **Backend Frameworks** | Node/Express, Python Django, Python FastAPI, PHP Laravel, Java Spring Boot, C# ASP.NET Core, Go (Chi/Gin), Ruby on Rails | `FULLY_SUPPORTED` |
| **Databases & ORMs** | SQLite, PostgreSQL, MongoDB, MySQL, Supabase, Firebase; Prisma, Hibernate, Django ORM, EF Core, Eloquent | `FULLY_SUPPORTED` |

---

## 3. The 3 Application Build Levels

To eliminate over-engineering and prevent unsolicited backend or database generation, Aegis strictly classifies and executes applications at one of three distinct build levels:

### Level 1 — Pure Frontend Application
* **Characteristics:** Landing page, personal portfolio, brochure site, interactive documentation, client-side calculator, or interactive prototype.
* **Architecture Rules:**
  - `buildLevel: "pure_frontend"`
  - Emits zero backend code, zero database configuration, and zero server runtimes.
  - Generates optimized static assets ready for CDN deployment (Vercel, Netlify, Cloudflare Pages, GitHub Pages).

### Level 2 — Frontend + External API Integration
* **Characteristics:** Storefront connecting to Shopify, media portal reading from headless CMS (Sanity, Contentful, Strapi), or app backed by Supabase/Firebase BaaS.
* **Architecture Rules:**
  - `buildLevel: "frontend_api_integration"`
  - Connects directly to external API endpoints or managed services.
  - Never spins up a duplicate local Express/Node backend when connecting to an external API.

### Level 3 — Complete Full-Stack Application
* **Characteristics:** SaaS platform, multi-tenant portal, authenticated dashboard with custom database models and transactions.
* **Architecture Rules:**
  - `buildLevel: "full_stack"`
  - Configures complete frontend, backend API server, database engine, schema migrations, and cross-origin security (CORS).

---

## 4. Stack Selection Intelligence: The 3 Resolution Situations

The `StackSelectionIntelligence` engine (`packages/ai-core/src/platform/stack-selection-intelligence.ts`) handles any incoming prompt through 3 mutually exclusive, deterministic paths:

```
                  USER PROMPT INVOCATION
                             │
            ┌────────────────┴────────────────┐
            ▼                                 ▼
   Contains Multiple Explicit          Contains Explicit
   Disparate Technologies?             Named Stack Key?
   (e.g., Vue + FastAPI + SQLite)      (e.g., "MEAN", "LAMP")
            │                                 │
     YES ───┤                          YES ───┤
            ▼                                 ▼
      [Situation B]                     [Situation A]
   Explicit Individual               Explicit Prepackaged
   Technology Locking                 Named Stack Locking
            │                                 │
            └───────────────┬─────────────────┘
                            │ NO TO BOTH
                            ▼
                      [Situation C]
               Autonomous Requirement &
               Domain-Driven Recommendation
```

### Situation A — Explicit Named Stack
When the user specifies a prepackaged stack name (e.g. "Create an app using the MEAN stack", "Build a site with LAMP", "Use T3 stack"):
- Aegis retrieves the canonical definition from `NamedStackRegistry`.
- Binds constituent technologies directly without substitution.
- Emits `selectionMode: "USER_NAMED_STACK"`.

### Situation B — Explicit Individual Technologies
When the user requests specific technologies (e.g. "Build this with Vue 3, a FastAPI backend, and SQLite"):
- Aegis validates technology compatibility across layers.
- Locks the exact specified technologies without substituting React or Express.
- Emits `selectionMode: "USER_EXPLICIT_TECH"`.

### Situation C — Autonomous Requirement-Driven Recommendation
When the user provides no technology preference (e.g. "Build a customer feedback portal"):
- Aegis analyzes product domain, data persistence requirements, and audience profile.
- Determines the appropriate Build Level (1, 2, or 3).
- Synthesizes the optimal technology stack with an explicit engineering rationale.
- Emits `selectionMode: "AUTONOMOUS_REQUIREMENT_DRIVEN"`.

---

## 5. Canonical Named Stacks Registry (20 Supported Stacks)

| Stack ID | Stack Name | Frontend | Backend | Database / ORM | Default Level |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `mern` | MERN Stack | React (TSX) | Node/Express | MongoDB + Prisma | Full-Stack |
| `mean` | MEAN Stack | Angular | Node/Express | MongoDB + Mongoose | Full-Stack |
| `mevn` | MEVN Stack | Vue 3 | Node/Express | MongoDB + Prisma | Full-Stack |
| `pern` | PERN Stack | React (TSX) | Node/Express | PostgreSQL + Prisma | Full-Stack |
| `nextjs_stack`| Next.js Full-Stack | Next.js (App Router) | Next.js Server Actions | PostgreSQL + Prisma | Full-Stack |
| `t3` | T3 Stack | Next.js + Tailwind | Next.js (tRPC) | PostgreSQL + Prisma | Full-Stack |
| `lamp` | LAMP Stack | HTML5 / CSS3 | PHP Native (Apache) | MySQL | Full-Stack |
| `lemp` | LEMP Stack | HTML5 / CSS3 | PHP (Nginx / FPM) | MySQL | Full-Stack |
| `jamstack` | JAMstack | Astro / Static | None / Serverless APIs | None | Pure Frontend |
| `django_stack`| Django Full-Stack | React / TSX | Python Django | PostgreSQL + Django ORM | Full-Stack |
| `fastapi_stack`| FastAPI Python Stack | React / Vue | Python FastAPI | PostgreSQL | Full-Stack |
| `laravel_stack`| Laravel PHP Stack | Vue 3 (Inertia) | PHP Laravel | MySQL + Eloquent | Full-Stack |
| `spring_boot_stack`| Spring Boot Stack | Angular / React | Java Spring Boot | PostgreSQL + Hibernate | Full-Stack |
| `dotnet_stack`| .NET Core Stack | React / Blazor | C# ASP.NET Core | PostgreSQL + EF Core | Full-Stack |
| `rails_stack`| Ruby on Rails Stack | HTML5 / Hotwire | Ruby on Rails | PostgreSQL | Full-Stack |
| `go_htmx_stack`| Go + HTMX Stack | HTML5 + HTMX | Go (Chi/Gin) | SQLite | Full-Stack |
| `supabase_stack`| Supabase BaaS Stack | React / Next.js | Supabase BaaS | PostgreSQL (Managed) | API Integration |
| `firebase_stack`| Firebase BaaS Stack | React / Vue | Firebase BaaS | Firestore | API Integration |
| `headless_cms_stack`| Headless CMS Stack | Next.js / Astro | Headless CMS | None | API Integration |
| `shopify_stack`| Shopify Storefront Stack | React / Hydrogen | Shopify API | None | API Integration |

---

## 6. Verification and Test Matrix

The multi-language and multi-stack architecture is protected by automated vitest suites running deterministically in offline environments:

* **Platform Test Suite:** `packages/ai-core/src/platform/__tests__/multi-language-stack-generation.test.ts`
  - 18 passing tests verifying capability lookup, named stack resolution, explicit tech locking, autonomous recommendation, build level assignment, adapter registry dispatch, and code generation.
* **Design Test Suite:** `packages/ai-core/src/design/__tests__/`
  - 19 test files, 188 passing tests confirming that design tokens, anti-convergence, and layout rules remain intact across domains.
* **Turbo Monorepo Build:** `pnpm turbo build`
  - 6/6 packages built with zero TypeScript errors (`@aegis/ai-core`, `@aegis/agent-runtime`, `@aegis/cli`, `@aegis/desktop`, `@aegis/project-builder`, `@aegis/workspace`).
