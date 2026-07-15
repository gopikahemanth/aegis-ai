import { BaseAgent } from "./base-agent.js";

import { Reviewer } from "../reviewer/reviewer.js";
import { AIReviewer } from "../reviewer/ai-reviewer.js";
import { mergeReviewedFiles } from "../reviewer/merge-reviewed-files.js";

import type { GeneratedFile } from "../writer/writer.js";
import { Parser } from "../generator/parser.js";
export class ReviewerAgent extends BaseAgent {
  readonly name = "Reviewer Agent";

  private readonly reviewer =
    new Reviewer();

  private readonly aiReviewer =
    new AIReviewer(
      this.provider,
    );
  private readonly parser =
  new Parser();

  async execute(
    request: string,
    project: string,
    files: GeneratedFile[],
  ) {
    const report =
      this.reviewer.review(
        files,
      );

    if (report.passed) {
      return files;
    }

    const issues =
      report.issues
        .map(
          (issue) =>
            `${issue.file}: ${issue.message}`,
        )
        .join("\n");

    const aiResponse =
      await this.aiReviewer.review(
        request,
        issues,
        project,
      );

   const reviewedFiles =
  this.parser.parse(
    aiResponse,
  );

return mergeReviewedFiles(
  files,
  reviewedFiles,
);
  }
}
