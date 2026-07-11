import type { AIProvider } from "../providers/base.js";
import { ReviewPrompt } from "./review-prompt.js";

export class AIReviewer {
  private readonly prompt =
    new ReviewPrompt();

  constructor(
    private readonly provider: AIProvider,
  ) {}

  async review(
  request: string,
  issues: string,
  project: string,
){
   const prompt =
  this.prompt.build(
    request,
    issues,
    project,
  );

    return this.provider.chat([
      {
        role: "user",
        content: prompt,
      },
    ]);
  }
}
