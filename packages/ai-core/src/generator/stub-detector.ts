export class StubDetector {
  private readonly stubPatterns = [
    /TODO/i,
    /implement\s+(here|later|this)/i,
    /\/\/.*placeholder/i,          // // ... placeholder
    /\/\*.*placeholder/i,          // /* ... placeholder
    /\b(code|logic|stub)\s+placeholder/i,
    /throw\s+new\s+Error\(['"](not\s+implemented|TODO)['"]\)/i,
    /\/\/\s*\.\.\./,               // // ...
    /\/\*\s*\.\.\.\s*\*\//        // /* ... */
  ];

  // Mock data patterns — things that look implemented but aren't
  private readonly mockDataPatterns: { pattern: RegExp; message: string }[] = [
    {
      pattern: /const\s+\w*(score|ats|match|rating|accuracy)\w*\s*=\s*\d+(\.\d+)?[^(]/i,
      message: "Mock Data: hardcoded numeric score/metric"
    },
    {
      pattern: /Math\.random\(\)\s*\*\s*\d+.*?(score|rating|percent|metric|stat)/i,
      message: "Mock Data: Math.random() used to generate a fake metric"
    },
    {
      pattern: /setTimeout\s*\(\s*\(\s*\)\s*=>\s*\{[^}]{0,120}set[A-Z][a-zA-Z]*\s*\(\s*(false|true|null)\s*\)[^}]{0,120}\}\s*,\s*[12]\d{3}\s*\)/,
      message: "Mock Data: setTimeout used to simulate fake loading"
    },
    {
      pattern: /return\s*\{\s*score\s*:\s*\d+/i,
      message: "Mock Data: function returns hardcoded score object"
    },
    {
      pattern: /const\s+\w*[Dd]ata\w*\s*=\s*\[\s*\d+\s*,\s*\d+/,
      message: "Mock Data: hardcoded numeric array likely used as chart data"
    },
    {
      pattern: /\w*(atsScore|resumeScore|matchScore|keywordScore)\w*\s*=\s*(0\.\d+|[1-9]\d?(\.\d+)?)\s*[;,]/i,
      message: "Mock Data: fixed numeric score assigned to score variable"
    }
  ];

  detect(content: string): string[] {
    const findings: string[] = [];
    const lines = content.split(/\r?\n/);

    for (let idx = 0; idx < lines.length; idx++) {
      const line = lines[idx];

      for (const pattern of this.stubPatterns) {
        if (pattern.test(line)) {
          findings.push(
            `Line ${idx + 1}: Stub pattern (${pattern.toString()}) -> "${line.trim()}"`
          );
        }
      }

      for (const { pattern, message } of this.mockDataPatterns) {
        if (pattern.test(line)) {
          findings.push(
            `Line ${idx + 1}: ${message} -> "${line.trim()}"`
          );
        }
      }
    }

    return findings;
  }
}
