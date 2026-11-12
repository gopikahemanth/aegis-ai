/**
 * Technology Generation Adapter Interface
 *
 * Formal interface separating technology-independent design specifications
 * from technology-dependent code generation.
 */

import { FrontendDesignSpec } from "../../design/frontend-design-spec-schema.js";
import { ResolvedTechnologyArchitectureContract } from "../stack-selection-intelligence.js";

export type FrameworkFamily =
  | "react"
  | "vue"
  | "angular"
  | "svelte"
  | "nextjs"
  | "vanilla"
  | "backend-node"
  | "backend-python"
  | "backend-java"
  | "backend-php"
  | "backend-dotnet"
  | "backend-go";

export interface AdapterGeneratedFile {
  path: string;
  content: string;
  purpose: string;
  executable?: boolean;
}

export interface ProjectScaffoldOptions {
  projectName: string;
  architecture: ResolvedTechnologyArchitectureContract;
  designSpec: FrontendDesignSpec;
}

export interface ComponentGenerationOptions {
  componentName: string;
  role: "page" | "layout" | "navigation" | "metric" | "card" | "form" | "hero" | "table" | "footer";
  props?: Record<string, string>;
  designTokens: {
    palette: {
      background: string;
      surface: string;
      text: string;
      border: string;
      primary?: string;
      secondary?: string;
    };
    typography?: {
      headingFont: string;
      bodyFont: string;
    };
  };
  htmlContent?: string;
  subComponents?: string[];
}

export interface TechnologyGenerationAdapter {
  readonly id: string;
  readonly name: string;
  readonly frameworkFamily: FrameworkFamily;
  readonly supportsLevel1: boolean;
  readonly supportsLevel2: boolean;
  readonly supportsLevel3: boolean;

  /**
   * Evaluates if this adapter can handle the target architecture contract.
   */
  canHandle(architecture: ResolvedTechnologyArchitectureContract): boolean;

  /**
   * Scaffolds initial project file structure according to the architecture & design.
   */
  scaffoldProject(options: ProjectScaffoldOptions): Promise<AdapterGeneratedFile[]>;

  /**
   * Generates a framework-native component implementing the given design specification.
   */
  generateComponent(options: ComponentGenerationOptions): Promise<AdapterGeneratedFile>;

  /**
   * Generates framework-native routing configuration.
   */
  generateRouting(pages: Array<{ path: string; componentName: string; title: string }>): Promise<AdapterGeneratedFile>;

  /**
   * Returns build, dev, and test commands for the generated framework project.
   */
  getToolingCommands(): {
    installCommand: string;
    devCommand: string;
    buildCommand: string;
    testCommand: string;
  };
}
