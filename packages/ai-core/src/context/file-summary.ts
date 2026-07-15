import type { GeneratedFile } from "../writer/writer.js";

export class FileSummary {
  summarize(
    files: GeneratedFile[],
  ): string {

    return files
      .map(
        (file) => {

          const preview =
            file.content
              .split("\n")
              .slice(0, 5)
              .join("\n");

          return [
            file.path,
            preview,
          ].join("\n");
        },
      )
      .join("\n\n");
  }
}
