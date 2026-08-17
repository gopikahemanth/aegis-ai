/**
 * SecretProvider
 *
 * Manages runtime secrets strictly isolated from prompts, logs, and telemetry.
 */

export class SecretProvider {
  private static secrets: Map<string, string> = new Map();

  public static setSecret(key: string, value: string): void {
    this.secrets.set(key, value);
  }

  public static resolveSecret(key: string): string | undefined {
    return this.secrets.get(key);
  }

  /**
   * Sanitizes strings to prevent secret leakage in logs or telemetry.
   */
  public static maskSecrets(text: string): string {
    let result = text;
    for (const [_, val] of this.secrets) {
      if (val && val.length > 3) {
        result = result.replaceAll(val, "[REDACTED_SECRET]");
      }
    }
    return result;
  }

  public static clear(): void {
    this.secrets.clear();
  }
}
