export class MetricsTracker {
  private static instance: MetricsTracker;
  private totalTokens = 0;
  private promptTokens = 0;
  private completionTokens = 0;

  static getInstance(): MetricsTracker {
    if (!this.instance) {
      this.instance = new MetricsTracker();
    }
    return this.instance;
  }

  logUsage(prompt: number, completion: number) {
    this.promptTokens += prompt;
    this.completionTokens += completion;
    this.totalTokens += (prompt + completion);
  }

  getMetrics() {
    // Gemini pricing estimates: $0.075 per 1M input tokens, $0.30 per 1M output tokens
    const cost = (this.promptTokens * 0.075 / 1000000) + (this.completionTokens * 0.30 / 1000000);
    return {
      promptTokens: this.promptTokens,
      completionTokens: this.completionTokens,
      totalTokens: this.totalTokens,
      estimatedCostUsd: Number(cost.toFixed(6))
    };
  }

  reset() {
    this.promptTokens = 0;
    this.completionTokens = 0;
    this.totalTokens = 0;
  }
}
