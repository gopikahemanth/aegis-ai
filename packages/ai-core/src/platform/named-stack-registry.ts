/**
 * Aegis AI — Named Full-Stack Registry
 *
 * Defines canonical named technology stacks, their constituent components,
 * compatibility constraints, and authoritative technology mapping.
 */

export interface NamedStackDefinition {
  id: string;
  name: string;
  alias: string[];
  description: string;
  defaultBuildLevel: "full_stack" | "pure_frontend" | "frontend_api_integration";
  frontend: {
    language: string;
    framework: string;
    styling: string;
    buildTool: string;
  };
  backend: {
    language: string;
    framework: string;
    runtime: string;
    apiType: "REST" | "GraphQL" | "tRPC";
  };
  database: {
    engine: "mongodb" | "postgresql" | "mysql" | "sqlite" | "supabase" | "firebase" | "none";
    orm: "prisma" | "mongoose" | "django_orm" | "hibernate" | "ef_core" | "eloquent" | "none";
  };
  deploymentTarget?: string;
  tags: string[];
}

export class NamedStackRegistry {
  private static readonly stacks: Map<string, NamedStackDefinition> = new Map();

  static {
    this.register({
      id: "mern",
      name: "MERN Stack",
      alias: ["mern", "mern-stack"],
      description: "MongoDB, Express, React, Node.js full-stack JavaScript architecture.",
      defaultBuildLevel: "full_stack",
      frontend: { language: "TypeScript", framework: "react", styling: "tailwind", buildTool: "vite" },
      backend: { language: "TypeScript", framework: "express", runtime: "node", apiType: "REST" },
      database: { engine: "mongodb", orm: "prisma" },
      tags: ["javascript", "nosql", "fullstack"],
    });

    this.register({
      id: "mean",
      name: "MEAN Stack",
      alias: ["mean", "mean-stack"],
      description: "MongoDB, Express, Angular, Node.js enterprise TypeScript stack.",
      defaultBuildLevel: "full_stack",
      frontend: { language: "TypeScript", framework: "angular", styling: "scss", buildTool: "angular-cli" },
      backend: { language: "TypeScript", framework: "express", runtime: "node", apiType: "REST" },
      database: { engine: "mongodb", orm: "prisma" },
      tags: ["angular", "typescript", "nosql", "fullstack"],
    });

    this.register({
      id: "mevn",
      name: "MEVN Stack",
      alias: ["mevn", "mevn-stack"],
      description: "MongoDB, Express, Vue.js, Node.js modern full-stack composition.",
      defaultBuildLevel: "full_stack",
      frontend: { language: "TypeScript", framework: "vue", styling: "tailwind", buildTool: "vite" },
      backend: { language: "TypeScript", framework: "express", runtime: "node", apiType: "REST" },
      database: { engine: "mongodb", orm: "prisma" },
      tags: ["vue", "javascript", "nosql", "fullstack"],
    });

    this.register({
      id: "pern",
      name: "PERN Stack",
      alias: ["pern", "pern-stack"],
      description: "PostgreSQL, Express, React, Node.js relational full-stack architecture.",
      defaultBuildLevel: "full_stack",
      frontend: { language: "TypeScript", framework: "react", styling: "tailwind", buildTool: "vite" },
      backend: { language: "TypeScript", framework: "express", runtime: "node", apiType: "REST" },
      database: { engine: "postgresql", orm: "prisma" },
      tags: ["postgresql", "react", "sql", "fullstack"],
    });

    this.register({
      id: "nextjs_fullstack",
      name: "React + Next.js Stack",
      alias: ["nextjs", "next.js", "next", "react-next"],
      description: "Next.js React server components, serverless route handlers, and unified SSR/SSG.",
      defaultBuildLevel: "full_stack",
      frontend: { language: "TypeScript", framework: "nextjs", styling: "tailwind", buildTool: "next" },
      backend: { language: "TypeScript", framework: "nextjs", runtime: "node", apiType: "REST" },
      database: { engine: "postgresql", orm: "prisma" },
      tags: ["nextjs", "react", "ssr", "fullstack"],
    });

    this.register({
      id: "t3",
      name: "T3 Stack",
      alias: ["t3", "t3-stack", "create-t3-app"],
      description: "Next.js, TypeScript, tRPC, Tailwind CSS, Prisma type-safe stack.",
      defaultBuildLevel: "full_stack",
      frontend: { language: "TypeScript", framework: "nextjs", styling: "tailwind", buildTool: "next" },
      backend: { language: "TypeScript", framework: "nextjs", runtime: "node", apiType: "tRPC" },
      database: { engine: "postgresql", orm: "prisma" },
      tags: ["trpc", "nextjs", "typesafe", "fullstack"],
    });

    this.register({
      id: "lamp",
      name: "LAMP Stack",
      alias: ["lamp", "lamp-stack"],
      description: "Linux, Apache, MySQL, PHP traditional web platform.",
      defaultBuildLevel: "full_stack",
      frontend: { language: "HTML", framework: "html5", styling: "css3", buildTool: "none" },
      backend: { language: "PHP", framework: "php_native", runtime: "apache_php", apiType: "REST" },
      database: { engine: "mysql", orm: "none" },
      tags: ["php", "mysql", "traditional"],
    });

    this.register({
      id: "lemp",
      name: "LEMP Stack",
      alias: ["lemp", "lemp-stack"],
      description: "Linux, Nginx, MySQL, PHP high-concurrency web platform.",
      defaultBuildLevel: "full_stack",
      frontend: { language: "HTML", framework: "html5", styling: "css3", buildTool: "none" },
      backend: { language: "PHP", framework: "php_native", runtime: "nginx_php_fpm", apiType: "REST" },
      database: { engine: "mysql", orm: "none" },
      tags: ["php", "nginx", "mysql"],
    });

    this.register({
      id: "jamstack",
      name: "JAMstack",
      alias: ["jamstack", "jam-stack"],
      description: "JavaScript, APIs, pre-rendered Markup static site architecture.",
      defaultBuildLevel: "pure_frontend",
      frontend: { language: "TypeScript", framework: "astro", styling: "tailwind", buildTool: "astro" },
      backend: { language: "none", framework: "none", runtime: "none", apiType: "REST" },
      database: { engine: "none", orm: "none" },
      tags: ["static", "cdn", "jamstack"],
    });

    this.register({
      id: "django_stack",
      name: "Django Full-Stack",
      alias: ["django", "python-django", "django-react"],
      description: "Python, Django, PostgreSQL, with optional decoupled React/Vue frontend.",
      defaultBuildLevel: "full_stack",
      frontend: { language: "TypeScript", framework: "react", styling: "tailwind", buildTool: "vite" },
      backend: { language: "Python", framework: "django", runtime: "python", apiType: "REST" },
      database: { engine: "postgresql", orm: "django_orm" },
      tags: ["python", "django", "postgresql", "enterprise"],
    });

    this.register({
      id: "fastapi_stack",
      name: "FastAPI Modern Python Stack",
      alias: ["fastapi", "python-fastapi"],
      description: "High-performance Python FastAPI async backend with React/Vue frontend and PostgreSQL.",
      defaultBuildLevel: "full_stack",
      frontend: { language: "TypeScript", framework: "react", styling: "tailwind", buildTool: "vite" },
      backend: { language: "Python", framework: "python_fastapi", runtime: "python", apiType: "REST" },
      database: { engine: "postgresql", orm: "none" },
      tags: ["python", "fastapi", "async", "high-performance"],
    });

    this.register({
      id: "laravel_stack",
      name: "Laravel Modern PHP Stack",
      alias: ["laravel", "php-laravel", "laravel-vue", "laravel-inertia"],
      description: "PHP 8.2+, Laravel, Eloquent ORM, MySQL/PostgreSQL, with Inertia.js and Vue/Tailwind.",
      defaultBuildLevel: "full_stack",
      frontend: { language: "TypeScript", framework: "vue", styling: "tailwind", buildTool: "vite" },
      backend: { language: "PHP", framework: "php_laravel", runtime: "php", apiType: "REST" },
      database: { engine: "mysql", orm: "eloquent" },
      tags: ["php", "laravel", "vue", "fullstack"],
    });

    this.register({
      id: "spring_boot_stack",
      name: "Java Spring Boot Enterprise Stack",
      alias: ["spring", "spring-boot", "spring boot", "java-spring", "spring-angular"],
      description: "Java 21, Spring Boot 3, Hibernate/JPA, PostgreSQL, with Angular or React frontend.",
      defaultBuildLevel: "full_stack",
      frontend: { language: "TypeScript", framework: "angular", styling: "scss", buildTool: "angular-cli" },
      backend: { language: "Java", framework: "spring-boot", runtime: "jvm", apiType: "REST" },
      database: { engine: "postgresql", orm: "hibernate" },
      tags: ["java", "spring-boot", "enterprise", "angular"],
    });

    this.register({
      id: "dotnet_stack",
      name: ".NET Core Enterprise Stack",
      alias: ["dotnet", ".net", "aspnet", "aspnet-core", "csharp-dotnet"],
      description: "C#, ASP.NET Core 8.0, Entity Framework Core, SQL Server / PostgreSQL, React/Blazor.",
      defaultBuildLevel: "full_stack",
      frontend: { language: "TypeScript", framework: "react", styling: "tailwind", buildTool: "vite" },
      backend: { language: "C#", framework: "dotnet_aspnet", runtime: "dotnet", apiType: "REST" },
      database: { engine: "postgresql", orm: "ef_core" },
      tags: ["dotnet", "csharp", "enterprise"],
    });

    this.register({
      id: "rails_stack",
      name: "Ruby on Rails Stack",
      alias: ["rails", "ruby-on-rails"],
      description: "Ruby on Rails, Hotwire / Turbo, PostgreSQL MVC web application.",
      defaultBuildLevel: "full_stack",
      frontend: { language: "HTML", framework: "html5", styling: "tailwind", buildTool: "vite" },
      backend: { language: "Ruby", framework: "ruby_rails", runtime: "ruby", apiType: "REST" },
      database: { engine: "postgresql", orm: "none" },
      tags: ["ruby", "rails", "mvc"],
    });

    this.register({
      id: "go_htmx_stack",
      name: "Go + HTMX Hypermedia Stack",
      alias: ["go-htmx", "htmx-go", "go+htmx"],
      description: "Go HTTP server (Chi/Gin), HTML5, HTMX hypermedia interactions, Tailwind CSS.",
      defaultBuildLevel: "full_stack",
      frontend: { language: "HTML", framework: "htmx", styling: "tailwind", buildTool: "none" },
      backend: { language: "go", framework: "go_standard", runtime: "go", apiType: "REST" },
      database: { engine: "sqlite", orm: "none" },
      tags: ["go", "htmx", "hypermedia", "lightweight"],
    });

    this.register({
      id: "supabase_stack",
      name: "Supabase BaaS Stack",
      alias: ["supabase", "react-supabase"],
      description: "React / Next.js frontend integrated with Supabase managed PostgreSQL & Auth.",
      defaultBuildLevel: "frontend_api_integration",
      frontend: { language: "TypeScript", framework: "react", styling: "tailwind", buildTool: "vite" },
      backend: { language: "none", framework: "none", runtime: "supabase_baas", apiType: "REST" },
      database: { engine: "supabase", orm: "none" },
      tags: ["supabase", "baas", "postgresql"],
    });

    this.register({
      id: "firebase_stack",
      name: "Firebase BaaS Stack",
      alias: ["firebase", "react-firebase"],
      description: "React / Vue frontend integrated with Google Firebase Firestore, Auth, and Functions.",
      defaultBuildLevel: "frontend_api_integration",
      frontend: { language: "TypeScript", framework: "react", styling: "tailwind", buildTool: "vite" },
      backend: { language: "none", framework: "none", runtime: "firebase_baas", apiType: "REST" },
      database: { engine: "firebase", orm: "none" },
      tags: ["firebase", "baas", "nosql"],
    });

    this.register({
      id: "headless_cms_stack",
      name: "Headless CMS Stack",
      alias: ["headless-cms", "sanity", "strapi", "contentful"],
      description: "Next.js / Astro frontend consuming external headless CMS content APIs.",
      defaultBuildLevel: "frontend_api_integration",
      frontend: { language: "TypeScript", framework: "nextjs", styling: "tailwind", buildTool: "next" },
      backend: { language: "none", framework: "none", runtime: "headless_cms", apiType: "REST" },
      database: { engine: "none", orm: "none" },
      tags: ["cms", "content", "headless"],
    });

    this.register({
      id: "shopify_stack",
      name: "Shopify Hydrogen / Storefront Stack",
      alias: ["shopify", "shopify-hydrogen"],
      description: "Shopify Storefront API integration via React / Hydrogen.",
      defaultBuildLevel: "frontend_api_integration",
      frontend: { language: "TypeScript", framework: "react", styling: "tailwind", buildTool: "vite" },
      backend: { language: "none", framework: "none", runtime: "shopify_api", apiType: "GraphQL" },
      database: { engine: "none", orm: "none" },
      tags: ["shopify", "ecommerce", "storefront"],
    });
  }

  public static register(stack: NamedStackDefinition): void {
    this.stacks.set(stack.id.toLowerCase(), stack);
    for (const a of stack.alias) {
      this.stacks.set(a.toLowerCase(), stack);
    }
  }

  public static get(nameOrAlias: string): NamedStackDefinition | undefined {
    return this.stacks.get(nameOrAlias.toLowerCase().trim());
  }

  public static getAll(): NamedStackDefinition[] {
    const seen = new Set<string>();
    const unique: NamedStackDefinition[] = [];
    for (const stack of this.stacks.values()) {
      if (!seen.has(stack.id)) {
        seen.add(stack.id);
        unique.push(stack);
      }
    }
    return unique;
  }
}
