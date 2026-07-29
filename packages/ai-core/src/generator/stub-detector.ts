export class StubDetector {
  private readonly stubPatterns = [
    /TODO/i,
    /implement\s+(here|later|this)/i,
    /\/\/.*placeholder/i, // Matches // ... placeholder
    /\/\*.*placeholder/i, // Matches /* ... placeholder
    /\b(code|logic|stub)\s+placeholder/i, // Matches standalone "code placeholder"
    /throw\s+new\s+Error\(['"](not\s+implemented|TODO)['"]\)/i,
    /\/\/\s*\.\.\./, // Matches "// ..."
    /\/\*\s*\.\.\.\s*\*\// // Matches "/* ... */"
  ];

  detect(content: string): string[] {
    const findings: string[] = [];
    const lines = content.split(/\r?\n/);

    for (let idx = 0; idx < lines.length; idx++) {
      const line = lines[idx];
      for (const pattern of this.stubPatterns) {
        if (pattern.test(line)) {
          findings.push(
            `Line ${idx + 1}: Stub pattern matched (${pattern.toString()}) -> "${line.trim()}"`
          );
        }
      }
    }

    return findings;
  }
}
