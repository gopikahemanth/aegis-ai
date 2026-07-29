import { PromptManager } from "../prompts/prompt-manager.js";

export class ReviewPrompt {
  private readonly promptManager = new PromptManager();

  build(
    request: string,
    issues: string,
    project: string,
  ): string {
    return this.promptManager.getReviewPrompt(request, issues, project);
  }
}
