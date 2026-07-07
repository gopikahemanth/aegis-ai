import { ProjectScanner } from "./project-scanner.js";
import { CodebaseIndex } from "./codebase-index.js";
import { FileSelector } from "./file-selector.js";
import { ProjectContext } from "./project-context.js";

export class ContextEngine {
  private readonly scanner =
    new ProjectScanner();

  private readonly index =
    new CodebaseIndex();

  private readonly selector =
    new FileSelector();

  private readonly context =
    new ProjectContext();

  build(
    request: string,
    projectPath: string,
  ) {
    const files =
      this.scanner.scan(projectPath);

    const indexed =
      this.index.build(files);

    const selected =
      this.selector.select(
        request,
        indexed,
      );

    const selectedFiles =
      selected.map(file => file.path);

    return this.context.build(
      projectPath,
      selectedFiles,
    );
  }
}
