export class PromptTemplates {
  projectGeneration(
    execution: string,
    architecture: string,
    request: string,
    rules: string,
  ) {
    return `
${execution}

${architecture}

${request}

${rules}
`;
  }
}
