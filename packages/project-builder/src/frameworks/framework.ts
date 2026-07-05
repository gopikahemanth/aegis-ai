export interface FrameworkTemplate {
  readonly name: string;

  create(
    projectName: string,
    output: string,
  ): Promise<void>;
}
