import type { GeneratedFile } from "../writer/writer.js";

import { FileSummary } from "./file-summary.js";

export class ProjectMemory {
  private readonly files =
    new Map<string, GeneratedFile>();

  private readonly summarizer =
    new FileSummary();

  add(
    generated: GeneratedFile[],
  ) {
    for (const file of generated) {
      this.files.set(
        file.path,
        file,
      );
    }
  }

  summarize() {
    return this.summarizer.summarize(
      [...this.files.values()],
    );
  }

  getFiles() {
    return [...this.files.values()];
  }

  clear() {
    this.files.clear();
  }
}
