import { ProjectMemory } from "./project-memory.js";
import { BuildMemory } from "./build-memory.js";
import { ContextBuilder } from "./context-builder.js";

export class ExecutionContext {
  readonly projectMemory =
    new ProjectMemory();

  readonly buildMemory =
    new BuildMemory();

  readonly contextBuilder =
    new ContextBuilder(
      this.projectMemory,
    );
}
