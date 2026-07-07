export interface ReviewIssue {
  file: string;
  message: string;
}

export interface ReviewReport {
  passed: boolean;
  issues: ReviewIssue[];
}
