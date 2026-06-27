export class FrameworkDetector {
  detect(dependencies: string[]): string {
    const map: Record<string, string> = {
      react: "React",
      next: "Next.js",
      vue: "Vue",
      "@angular/core": "Angular",
      svelte: "Svelte",
      express: "Express",
      "@nestjs/core": "NestJS",
      fastify: "Fastify",
      hono: "Hono",
      koa: "Koa",
    };

    for (const dep of dependencies) {
      if (map[dep]) {
        return map[dep];
      }
    }

    return "Unknown";
  }
}
