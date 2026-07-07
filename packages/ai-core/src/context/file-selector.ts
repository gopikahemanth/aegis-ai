import type {
  CodebaseEntry,
} from "./codebase-index.js";

export class FileSelector {
  select(
    request: string,
    files: CodebaseEntry[],
  ) {
    const text =
      request.toLowerCase();

    const ranked = files.map((file) => ({
      file,
      score: this.score(
        text,
        file,
      ),
    }));

    return ranked
      .filter((item) => item.score > 0)
      .sort(
        (a, b) =>
          b.score - a.score,
      )
      .slice(0, 5)
      .map((item) => item.file);
  }

  private score(
    request: string,
    file: CodebaseEntry,
  ) {
    let score = 0;

    switch (file.type) {
      case "component":
        if (
          request.includes("component")
        )
          score += 5;

        if (
          request.includes("navbar")
        )
          score += 10;

        if (
          request.includes("button")
        )
          score += 10;

        if (
          request.includes("card")
        )
          score += 10;

        break;

      case "page":
        if (
          request.includes("page")
        )
          score += 5;

        if (
          request.includes("dashboard")
        )
          score += 15;

        if (
          request.includes("login")
        )
          score += 15;

        break;

      case "service":
        if (
          request.includes("api")
        )
          score += 10;

        if (
          request.includes("service")
        )
          score += 10;

        break;

      case "hook":
        if (
          request.includes("hook")
        )
          score += 10;

        break;

      case "style":
        if (
          request.includes("css")
        )
          score += 5;

        if (
          request.includes("theme")
        )
          score += 10;

        if (
          request.includes("style")
        )
          score += 5;

        break;
    }

    return score;
  }
}
