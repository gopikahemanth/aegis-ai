import type { ProjectSpecification } from "./specification.js";

export class FrameworkSelector {
  private readonly supported =
    new Set([
      "react-vite",
      "express",
      "next",
      "html",
    ]);

  select(
    spec: ProjectSpecification,
  ): string {

    let framework = "html";

    switch (spec.frontend) {
      case "React":
        framework = "react-vite";
        break;

      case "Next.js":
        framework = "next";
        break;

      case "Angular":
        framework = "angular";
        break;

      case "Vue":
        framework = "vue";
        break;

      case "Svelte":
        framework = "svelte";
        break;
    }

    if (
      framework === "html" &&
      spec.backend
    ) {
      switch (spec.backend) {
        case "Express":
          framework = "express";
          break;

        case "NestJS":
          framework = "nestjs";
          break;
      }
    }

    if (
      !this.supported.has(framework)
    ) {

      return "html";
    }

    return framework;
  }
}
