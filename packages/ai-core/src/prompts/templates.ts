export class PromptTemplates {
  projectGeneration(
  execution: string,
  architecture: string,
  architecturePlan: string,
  fullContext: string,
  framework: string,
  user: string,
  rules: string,
){
   return `
${execution}

${architecture}

${architecturePlan}

${fullContext}

${framework}

${user}

${rules}
`;
  }
}
