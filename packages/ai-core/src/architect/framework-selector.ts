import type { ProjectSpecification } from "./specification.js";

export class FrameworkSelector {
  select(spec: ProjectSpecification): string {
    if (spec.frontend === "React") {
      return "react-vite";
    }

    if (spec.backend === "Express") {
      return "express";
    }

    if (spec.type === "website") {
      return "html";
    }

    return "html";
  }
}
