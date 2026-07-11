export class ProviderError extends Error {
  constructor(
    message: string,
    readonly retryAfter?: number,
    readonly cause?: unknown,
  ) {
    super(message);

    this.name = "ProviderError";
  }
}
