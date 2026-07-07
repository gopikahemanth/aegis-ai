export class PromptTemplates {
  projectGeneration(
    execution: string,
    architecture: string,
    context: string,
    framework: string,
    request: string,
    rules: string,
  ) {
    return `
${execution}

${architecture}

${context}

${framework}

${request}

${rules}
`;
  }
}
