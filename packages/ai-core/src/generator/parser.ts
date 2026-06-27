export interface GeneratedFile {
  path: string;
  content: string;
}

export class Parser {
  parse(response: string): GeneratedFile[] {
    const files: GeneratedFile[] = [];

    const regex = /===FILE:\s*(.*?)===([\s\S]*?)(?=(===FILE:|$))/g;

    let match: RegExpExecArray | null;

    while ((match = regex.exec(response)) !== null) {
      files.push({
        path: match[1].trim(),
        content: match[2].trim(),
      });
    }

    return files;
  }
}
