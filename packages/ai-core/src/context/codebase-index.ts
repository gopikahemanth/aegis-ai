export interface CodebaseEntry {
  path: string;
  type:
    | "component"
    | "page"
    | "hook"
    | "service"
    | "style"
    | "config"
    | "other";
}

export class CodebaseIndex {
  build(files: string[]): CodebaseEntry[] {
    return files.map((file) => ({
      path: file,
      type: this.detectType(file),
    }));
  }

  private detectType(
    file: string,
  ): CodebaseEntry["type"] {
    if (file.includes("/components/"))
      return "component";

    if (file.includes("/pages/"))
      return "page";

    if (file.includes("/hooks/"))
      return "hook";

    if (file.includes("/services/"))
      return "service";

    if (
      file.endsWith(".css") ||
      file.includes("/styles/")
    )
      return "style";

    if (
      file.includes("config") ||
      file.endsWith(".json")
    )
      return "config";

    return "other";
  }
}
