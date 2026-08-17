/**
 * RepositoryProvider
 *
 * Unified abstraction for Git and local workspace providers.
 */

export interface RepositoryProvider {
  clone(url: string, targetPath: string): Promise<boolean>;
  commit(message: string, files: string[]): Promise<string>;
  diff(): Promise<string[]>;
  status(): Promise<"CLEAN" | "MODIFIED">;
}

export class LocalWorkspaceRepositoryProvider implements RepositoryProvider {
  constructor(private workspacePath: string) {}

  public async clone(url: string, targetPath: string): Promise<boolean> {
    return true;
  }

  public async commit(message: string, files: string[]): Promise<string> {
    return `commit_${Date.now()}`;
  }

  public async diff(): Promise<string[]> {
    return [];
  }

  public async status(): Promise<"CLEAN" | "MODIFIED"> {
    return "CLEAN";
  }
}
