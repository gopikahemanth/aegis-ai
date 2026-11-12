/**
 * Aegis AI — Technology Capability Registry
 *
 * Implements a machine-readable registry of languages, frameworks, styling systems,
 * template engines, rendering modes, and full-stack capabilities.
 *
 * Support Statuses:
 * - FULLY_SUPPORTED: Real project generation, compilation, runtime, and tests verified.
 * - PARTIALLY_SUPPORTED: Scaffolding, contracts, and core components supported.
 * - EXPERIMENTAL: Available for exploratory synthesis but non-standard.
 * - NOT_IMPLEMENTED: Known in taxonomy, adapter planned.
 * - LEGACY: Maintained for backwards-compatibility or explicit user request.
 */

export type CapabilityStatus =
  | "FULLY_SUPPORTED"
  | "PARTIALLY_SUPPORTED"
  | "EXPERIMENTAL"
  | "NOT_IMPLEMENTED"
  | "LEGACY";

export type TechCapabilityCategory =
  | "frontend_language"
  | "compiled_frontend_language"
  | "frontend_framework"
  | "meta_framework"
  | "styling_language"
  | "styling_framework"
  | "component_library"
  | "template_engine"
  | "data_config_format"
  | "graphics_visual"
  | "mobile_cross_platform"
  | "backend_language"
  | "backend_framework"
  | "database_engine"
  | "orm_data_layer"
  | "api_architecture";

export interface TechnologyCapabilityRecord {
  id: string;
  name: string;
  category: TechCapabilityCategory;
  language: string;
  runtime?: string;
  status: CapabilityStatus;
  versionsSupported: string[];
  renderingModes?: Array<"CSR" | "SSR" | "SSG" | "ISR" | "Isomorphic" | "Static">;
  stylingIntegrations: string[];
  routingIntegrations: string[];
  apiIntegrations: Array<"REST" | "GraphQL" | "tRPC" | "WebSocket" | "gRPC">;
  defaultBuildCommand?: string;
  defaultDevCommand?: string;
  defaultTestCommand?: string;
  requiredAdapterId: string;
  compatibilityConstraints?: string[];
  notes?: string;
}

export class TechnologyCapabilityRegistry {
  private static readonly records: Map<string, TechnologyCapabilityRecord> = new Map();

  static {
    // ── 1. Core Frontend Languages ──
    this.register({
      id: "html5",
      name: "HTML5",
      category: "frontend_language",
      language: "HTML",
      status: "FULLY_SUPPORTED",
      versionsSupported: ["5.0"],
      renderingModes: ["Static"],
      stylingIntegrations: ["css3", "tailwind", "postcss", "sass"],
      routingIntegrations: ["multi_page", "hash"],
      apiIntegrations: ["REST", "WebSocket"],
      defaultBuildCommand: "none",
      defaultDevCommand: "npx serve",
      defaultTestCommand: "npx html-validate",
      requiredAdapterId: "adapter_vanilla_html",
    });

    this.register({
      id: "css3",
      name: "CSS3",
      category: "frontend_language",
      language: "CSS",
      status: "FULLY_SUPPORTED",
      versionsSupported: ["3.0"],
      stylingIntegrations: ["native"],
      routingIntegrations: [],
      apiIntegrations: [],
      requiredAdapterId: "adapter_vanilla_html",
    });

    this.register({
      id: "javascript",
      name: "JavaScript (ESNext)",
      category: "frontend_language",
      language: "JavaScript",
      runtime: "Browser / Node.js",
      status: "FULLY_SUPPORTED",
      versionsSupported: ["ES2022", "ES2023", "ES2024"],
      renderingModes: ["CSR", "Static"],
      stylingIntegrations: ["css3", "tailwind", "css_modules"],
      routingIntegrations: ["vanilla_router", "page_js"],
      apiIntegrations: ["REST", "WebSocket"],
      defaultBuildCommand: "npm run build",
      defaultDevCommand: "npm run dev",
      defaultTestCommand: "npm test",
      requiredAdapterId: "adapter_vanilla_html",
    });

    this.register({
      id: "typescript",
      name: "TypeScript",
      category: "frontend_language",
      language: "TypeScript",
      runtime: "Node.js / Browser",
      status: "FULLY_SUPPORTED",
      versionsSupported: ["5.3", "5.4", "5.5"],
      renderingModes: ["CSR", "SSR", "SSG"],
      stylingIntegrations: ["tailwind", "css_modules", "styled_components"],
      routingIntegrations: ["react_router", "vue_router", "nextjs"],
      apiIntegrations: ["REST", "GraphQL", "tRPC", "WebSocket"],
      defaultBuildCommand: "tsc && vite build",
      defaultDevCommand: "vite",
      defaultTestCommand: "vitest run",
      requiredAdapterId: "adapter_react_vite",
    });

    // ── 2. Compiled & Alternative Frontend Languages ──
    this.register({
      id: "dart",
      name: "Dart",
      category: "compiled_frontend_language",
      language: "Dart",
      status: "PARTIALLY_SUPPORTED",
      versionsSupported: ["3.2+"],
      stylingIntegrations: ["flutter_material", "flutter_cupertino"],
      routingIntegrations: ["flutter_navigator"],
      apiIntegrations: ["REST", "WebSocket"],
      requiredAdapterId: "adapter_flutter",
    });

    this.register({
      id: "rust_wasm",
      name: "Rust (WebAssembly / Yew)",
      category: "compiled_frontend_language",
      language: "Rust",
      status: "PARTIALLY_SUPPORTED",
      versionsSupported: ["1.75+"],
      renderingModes: ["CSR"],
      stylingIntegrations: ["tailwind", "css3"],
      routingIntegrations: ["yew_router"],
      apiIntegrations: ["REST", "WebSocket"],
      defaultBuildCommand: "trunk build --release",
      defaultDevCommand: "trunk serve",
      requiredAdapterId: "adapter_rust_wasm",
    });

    this.register({
      id: "elm",
      name: "Elm",
      category: "compiled_frontend_language",
      language: "Elm",
      status: "EXPERIMENTAL",
      versionsSupported: ["0.19.1"],
      renderingModes: ["CSR"],
      stylingIntegrations: ["elm_ui", "css3"],
      routingIntegrations: ["elm_browser_navigation"],
      apiIntegrations: ["REST"],
      requiredAdapterId: "adapter_elm",
    });

    // ── 3. Frontend Frameworks ──
    this.register({
      id: "react",
      name: "React",
      category: "frontend_framework",
      language: "TypeScript / JavaScript",
      runtime: "Browser",
      status: "FULLY_SUPPORTED",
      versionsSupported: ["18.2", "18.3", "19.0"],
      renderingModes: ["CSR", "SSR"],
      stylingIntegrations: ["tailwind", "css_modules", "styled_components", "mui", "shadcn"],
      routingIntegrations: ["react-router-dom@6"],
      apiIntegrations: ["REST", "GraphQL", "tRPC", "WebSocket"],
      defaultBuildCommand: "vite build",
      defaultDevCommand: "vite",
      defaultTestCommand: "vitest run",
      requiredAdapterId: "adapter_react_vite",
    });

    this.register({
      id: "nextjs",
      name: "Next.js",
      category: "meta_framework",
      language: "TypeScript / JavaScript",
      runtime: "Node.js / Edge",
      status: "FULLY_SUPPORTED",
      versionsSupported: ["14.x", "15.x"],
      renderingModes: ["SSR", "SSG", "ISR", "CSR"],
      stylingIntegrations: ["tailwind", "css_modules", "shadcn"],
      routingIntegrations: ["app_router", "pages_router"],
      apiIntegrations: ["REST", "GraphQL", "tRPC"],
      defaultBuildCommand: "next build",
      defaultDevCommand: "next dev",
      defaultTestCommand: "npm test",
      requiredAdapterId: "adapter_nextjs",
    });

    this.register({
      id: "vue",
      name: "Vue.js",
      category: "frontend_framework",
      language: "TypeScript / JavaScript",
      runtime: "Browser",
      status: "FULLY_SUPPORTED",
      versionsSupported: ["3.4+"],
      renderingModes: ["CSR", "SSR"],
      stylingIntegrations: ["tailwind", "css_modules", "scss"],
      routingIntegrations: ["vue-router@4"],
      apiIntegrations: ["REST", "GraphQL", "WebSocket"],
      defaultBuildCommand: "vite build",
      defaultDevCommand: "vite",
      defaultTestCommand: "vitest run",
      requiredAdapterId: "adapter_vue",
    });

    this.register({
      id: "nuxt",
      name: "Nuxt",
      category: "meta_framework",
      language: "TypeScript / JavaScript",
      runtime: "Node.js",
      status: "PARTIALLY_SUPPORTED",
      versionsSupported: ["3.10+"],
      renderingModes: ["SSR", "SSG", "CSR"],
      stylingIntegrations: ["tailwind", "scss"],
      routingIntegrations: ["nuxt_pages"],
      apiIntegrations: ["REST", "GraphQL"],
      defaultBuildCommand: "npx nuxi build",
      defaultDevCommand: "npx nuxi dev",
      requiredAdapterId: "adapter_nuxt",
    });

    this.register({
      id: "angular",
      name: "Angular",
      category: "frontend_framework",
      language: "TypeScript",
      runtime: "Browser",
      status: "PARTIALLY_SUPPORTED",
      versionsSupported: ["17.x", "18.x"],
      renderingModes: ["CSR", "SSR"],
      stylingIntegrations: ["scss", "tailwind", "angular_material"],
      routingIntegrations: ["angular_router"],
      apiIntegrations: ["REST", "GraphQL", "WebSocket"],
      defaultBuildCommand: "ng build",
      defaultDevCommand: "ng serve",
      defaultTestCommand: "ng test",
      requiredAdapterId: "adapter_angular",
    });

    this.register({
      id: "svelte",
      name: "Svelte",
      category: "frontend_framework",
      language: "TypeScript / JavaScript",
      runtime: "Browser",
      status: "FULLY_SUPPORTED",
      versionsSupported: ["4.x", "5.x"],
      renderingModes: ["CSR"],
      stylingIntegrations: ["tailwind", "css3"],
      routingIntegrations: ["svelte_spa_router"],
      apiIntegrations: ["REST", "WebSocket"],
      defaultBuildCommand: "vite build",
      defaultDevCommand: "vite",
      defaultTestCommand: "vitest run",
      requiredAdapterId: "adapter_svelte",
    });

    this.register({
      id: "sveltekit",
      name: "SvelteKit",
      category: "meta_framework",
      language: "TypeScript",
      runtime: "Node.js",
      status: "PARTIALLY_SUPPORTED",
      versionsSupported: ["2.x"],
      renderingModes: ["SSR", "SSG", "CSR"],
      stylingIntegrations: ["tailwind"],
      routingIntegrations: ["sveltekit_filesystem"],
      apiIntegrations: ["REST", "GraphQL"],
      defaultBuildCommand: "vite build",
      defaultDevCommand: "vite dev",
      requiredAdapterId: "adapter_sveltekit",
    });

    this.register({
      id: "astro",
      name: "Astro",
      category: "meta_framework",
      language: "TypeScript / Astro",
      runtime: "Node.js / Static",
      status: "PARTIALLY_SUPPORTED",
      versionsSupported: ["4.x"],
      renderingModes: ["SSG", "SSR"],
      stylingIntegrations: ["tailwind", "css3"],
      routingIntegrations: ["astro_pages"],
      apiIntegrations: ["REST"],
      defaultBuildCommand: "astro build",
      defaultDevCommand: "astro dev",
      requiredAdapterId: "adapter_astro",
    });

    this.register({
      id: "htmx",
      name: "HTMX",
      category: "frontend_framework",
      language: "HTML / JavaScript",
      runtime: "Browser",
      status: "FULLY_SUPPORTED",
      versionsSupported: ["1.9+", "2.0"],
      renderingModes: ["SSR", "Static"],
      stylingIntegrations: ["tailwind", "css3"],
      routingIntegrations: ["server_routing"],
      apiIntegrations: ["REST"],
      requiredAdapterId: "adapter_htmx",
    });

    this.register({
      id: "alpinejs",
      name: "Alpine.js",
      category: "frontend_framework",
      language: "JavaScript",
      runtime: "Browser",
      status: "PARTIALLY_SUPPORTED",
      versionsSupported: ["3.x"],
      renderingModes: ["CSR", "Static"],
      stylingIntegrations: ["tailwind"],
      routingIntegrations: ["server_routing"],
      apiIntegrations: ["REST"],
      requiredAdapterId: "adapter_alpine",
    });

    // ── 4. Styling Systems & CSS Frameworks ──
    this.register({
      id: "tailwind",
      name: "Tailwind CSS",
      category: "styling_framework",
      language: "CSS",
      status: "FULLY_SUPPORTED",
      versionsSupported: ["3.4", "4.0"],
      stylingIntegrations: ["postcss"],
      routingIntegrations: [],
      apiIntegrations: [],
      requiredAdapterId: "common",
    });

    this.register({
      id: "bootstrap",
      name: "Bootstrap",
      category: "styling_framework",
      language: "CSS / SCSS",
      status: "PARTIALLY_SUPPORTED",
      versionsSupported: ["5.3"],
      stylingIntegrations: ["native"],
      routingIntegrations: [],
      apiIntegrations: [],
      requiredAdapterId: "common",
    });

    this.register({
      id: "sass",
      name: "Sass / SCSS",
      category: "styling_language",
      language: "SCSS",
      status: "FULLY_SUPPORTED",
      versionsSupported: ["1.70+"],
      stylingIntegrations: ["vite_plugin", "webpack"],
      routingIntegrations: [],
      apiIntegrations: [],
      requiredAdapterId: "common",
    });

    // ── 5. Backend Languages & Frameworks ──
    this.register({
      id: "node_express",
      name: "Node.js / Express",
      category: "backend_framework",
      language: "TypeScript / JavaScript",
      runtime: "Node.js 18/20/22",
      status: "FULLY_SUPPORTED",
      versionsSupported: ["4.19", "5.0"],
      stylingIntegrations: [],
      routingIntegrations: ["express_router"],
      apiIntegrations: ["REST", "WebSocket"],
      defaultBuildCommand: "tsc",
      defaultDevCommand: "node server/index.js",
      defaultTestCommand: "vitest run",
      requiredAdapterId: "adapter_backend_node",
    });

    this.register({
      id: "django",
      name: "Python / Django",
      category: "backend_framework",
      language: "Python",
      runtime: "Python 3.10+",
      status: "PARTIALLY_SUPPORTED",
      versionsSupported: ["4.2 LTS", "5.0"],
      stylingIntegrations: ["tailwind", "bootstrap"],
      routingIntegrations: ["django_urls"],
      apiIntegrations: ["REST", "GraphQL"],
      defaultBuildCommand: "python manage.py collectstatic --noinput",
      defaultDevCommand: "python manage.py runserver",
      defaultTestCommand: "python manage.py test",
      requiredAdapterId: "adapter_backend_django",
    });

    this.register({
      id: "fastapi",
      name: "Python / FastAPI",
      category: "backend_framework",
      language: "Python",
      runtime: "Python 3.10+",
      status: "PARTIALLY_SUPPORTED",
      versionsSupported: ["0.109+"],
      stylingIntegrations: [],
      routingIntegrations: ["fastapi_apirouter"],
      apiIntegrations: ["REST", "WebSocket"],
      defaultDevCommand: "uvicorn main:app --reload",
      defaultTestCommand: "pytest",
      requiredAdapterId: "adapter_backend_fastapi",
    });

    this.register({
      id: "laravel",
      name: "PHP / Laravel",
      category: "backend_framework",
      language: "PHP",
      runtime: "PHP 8.2+",
      status: "NOT_IMPLEMENTED",
      versionsSupported: ["10.x", "11.x"],
      stylingIntegrations: ["tailwind", "bootstrap"],
      routingIntegrations: ["laravel_routes"],
      apiIntegrations: ["REST"],
      defaultDevCommand: "php artisan serve",
      defaultTestCommand: "php artisan test",
      requiredAdapterId: "adapter_backend_laravel",
    });

    this.register({
      id: "spring_boot",
      name: "Java / Spring Boot",
      category: "backend_framework",
      language: "Java",
      runtime: "JDK 17/21",
      status: "NOT_IMPLEMENTED",
      versionsSupported: ["3.2+"],
      stylingIntegrations: [],
      routingIntegrations: ["spring_mvc"],
      apiIntegrations: ["REST", "WebSocket"],
      defaultBuildCommand: "./mvnw clean package",
      defaultDevCommand: "./mvnw spring-boot:run",
      defaultTestCommand: "./mvnw test",
      requiredAdapterId: "adapter_backend_spring",
    });

    this.register({
      id: "aspnet_core",
      name: "C# / ASP.NET Core",
      category: "backend_framework",
      language: "C#",
      runtime: ".NET 8.0",
      status: "NOT_IMPLEMENTED",
      versionsSupported: ["8.0"],
      stylingIntegrations: ["bootstrap", "tailwind"],
      routingIntegrations: ["aspnet_endpoints"],
      apiIntegrations: ["REST", "gRPC", "WebSocket"],
      defaultBuildCommand: "dotnet build",
      defaultDevCommand: "dotnet run",
      defaultTestCommand: "dotnet test",
      requiredAdapterId: "adapter_backend_dotnet",
    });

    this.register({
      id: "go_standard",
      name: "Go (Chi / Gin)",
      category: "backend_framework",
      language: "Go",
      runtime: "Go 1.21+",
      status: "NOT_IMPLEMENTED",
      versionsSupported: ["1.21", "1.22"],
      stylingIntegrations: [],
      routingIntegrations: ["chi_router", "gin_engine"],
      apiIntegrations: ["REST", "WebSocket"],
      defaultBuildCommand: "go build -o server .",
      defaultDevCommand: "go run main.go",
      defaultTestCommand: "go test ./...",
      requiredAdapterId: "adapter_backend_go",
    });

    // ── 6. Database Engines & ORMs ──
    this.register({
      id: "sqlite",
      name: "SQLite",
      category: "database_engine",
      language: "SQL",
      status: "FULLY_SUPPORTED",
      versionsSupported: ["3.x"],
      stylingIntegrations: [],
      routingIntegrations: [],
      apiIntegrations: [],
      requiredAdapterId: "common",
    });

    this.register({
      id: "postgresql",
      name: "PostgreSQL",
      category: "database_engine",
      language: "SQL",
      status: "FULLY_SUPPORTED",
      versionsSupported: ["14", "15", "16"],
      stylingIntegrations: [],
      routingIntegrations: [],
      apiIntegrations: [],
      requiredAdapterId: "common",
    });

    this.register({
      id: "mongodb",
      name: "MongoDB",
      category: "database_engine",
      language: "Document / BSON",
      status: "FULLY_SUPPORTED",
      versionsSupported: ["6.0", "7.0"],
      stylingIntegrations: [],
      routingIntegrations: [],
      apiIntegrations: [],
      requiredAdapterId: "common",
    });

    this.register({
      id: "prisma",
      name: "Prisma ORM",
      category: "orm_data_layer",
      language: "TypeScript / Prisma Schema",
      status: "FULLY_SUPPORTED",
      versionsSupported: ["5.x", "6.x"],
      stylingIntegrations: [],
      routingIntegrations: [],
      apiIntegrations: [],
      requiredAdapterId: "common",
    });

    this.register({
      id: "hibernate",
      name: "Hibernate ORM / JPA",
      category: "orm_data_layer",
      language: "Java",
      status: "FULLY_SUPPORTED",
      versionsSupported: ["6.x"],
      stylingIntegrations: [],
      routingIntegrations: [],
      apiIntegrations: [],
      requiredAdapterId: "adapter_backend_spring",
    });

    this.register({
      id: "django_orm",
      name: "Django ORM",
      category: "orm_data_layer",
      language: "Python",
      status: "FULLY_SUPPORTED",
      versionsSupported: ["4.x", "5.x"],
      stylingIntegrations: [],
      routingIntegrations: [],
      apiIntegrations: [],
      requiredAdapterId: "adapter_backend_django",
    });
  }

  public static register(record: TechnologyCapabilityRecord): void {
    this.records.set(record.id.toLowerCase(), record);
  }

  public static get(id: string): TechnologyCapabilityRecord | undefined {
    return this.records.get(id.toLowerCase());
  }

  public static getAll(): TechnologyCapabilityRecord[] {
    return Array.from(this.records.values());
  }

  public static getByCategory(category: TechCapabilityCategory): TechnologyCapabilityRecord[] {
    return this.getAll().filter((r) => r.category === category);
  }

  public static getSupported(): TechnologyCapabilityRecord[] {
    return this.getAll().filter((r) => r.status === "FULLY_SUPPORTED" || r.status === "PARTIALLY_SUPPORTED");
  }

  public static isSupported(id: string): boolean {
    const rec = this.get(id);
    return Boolean(rec && (rec.status === "FULLY_SUPPORTED" || rec.status === "PARTIALLY_SUPPORTED"));
  }
}
