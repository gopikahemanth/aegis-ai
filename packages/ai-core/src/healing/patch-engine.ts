import { Parser } from "../generator/parser.js";
import { FileWriter } from "../writer/writer.js";

export class PatchEngine {
  private readonly parser = new Parser();

  private readonly writer = new FileWriter();

  apply(
    response: string,
    projectPath: string,
  ) {
    const files = this.parser.parse(response);

    this.writer.write(files, projectPath);

    return files.length;
  }
}
