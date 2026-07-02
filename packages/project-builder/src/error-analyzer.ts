export interface BuildError {
  summary: string;
  details: string;
}

export class ErrorAnalyzer {
  analyze(stderr: string, stdout: string): BuildError {
    const output = stderr.trim() || stdout.trim();

    return {
      summary: output.split("\n")[0] ?? "Unknown build error",
      details: output,
    };
  }
}
