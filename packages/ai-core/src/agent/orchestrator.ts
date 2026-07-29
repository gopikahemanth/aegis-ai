import { Memory } from "./memory.js";
import { FrameworkSelector } from "../architect/index.js";
import { FrameworkValidator } from "../validator/framework-validator.js";
import type { GeneratedFile } from "../writer/writer.js";
import {
  ArchitectAgent,
  PlannerAgent,
  CoderAgent,
  ReviewerAgent,
} from "../agents/index.js";
import { FileWriter } from "../writer/writer.js";
import { Parser } from "../generator/parser.js";
import {
  ArchitecturePlanner,
} from "../architect/index.js";
import {
  ExecutionController,
  ExecutionPhase,
} from "../orchestrator/index.js";
import type { AIProvider } from "../providers/base.js";
import { ExecutionLoop } from "../execution/index.js";
import {
  BuildOrchestrator,
} from "../build/index.js";
import {
  RepairCoordinator,
} from "../build/index.js";
import { DeploymentGenerator } from "../deploy/index.js";

export class Orchestrator {


  private readonly buildOrchestrator = new BuildOrchestrator();

  private readonly memory = new Memory();

  private readonly architect = new ArchitecturePlanner();

  private readonly validator = new FrameworkValidator();

  private readonly writer = new FileWriter();

  private readonly parser = new Parser();

  private readonly deployGenerator = new DeploymentGenerator();

  private readonly selector =new FrameworkSelector();

  private readonly execution = new ExecutionController();

  private readonly architectAgent: ArchitectAgent;

  private readonly plannerAgent: PlannerAgent;

  private readonly coderAgent: CoderAgent;

  private readonly reviewerAgent: ReviewerAgent;

  private readonly executionLoop = new ExecutionLoop();

private readonly repairCoordinator: RepairCoordinator;

constructor(
  private readonly provider: AIProvider,
) {
  this.architectAgent =
    new ArchitectAgent(provider);

  this.plannerAgent =
    new PlannerAgent(provider);

  this.coderAgent =
    new CoderAgent(provider);

  this.reviewerAgent =
    new ReviewerAgent(provider);

  this.repairCoordinator =
    new RepairCoordinator(provider);
}


private validate(
  framework: string,
  files: GeneratedFile[],
) {
  return this.validator.validate(
    framework,
    files,
  );
}
private write(
  files: ReturnType<FrameworkValidator["validate"]>,
  outputDirectory: string,
) {
  this.writer.write(
    files,
    outputDirectory,
  );
}
async generateProject(
  request: string,
  outputDirectory: string,
) {
  this.memory.add(request);



  this.execution.enter(
  ExecutionPhase.Requirements,
);

const {
  specification,
} =
  await this.architectAgent.execute(
    request,
  );
    this.execution.enter(
  ExecutionPhase.Planning,
);
 const tasks =
  await this.plannerAgent.execute(
    specification,
  );

console.log(
  "Implementation Tasks:",
);

console.table(
  tasks,
);

await this.executionLoop.execute(
  {
    request,
    outputDirectory,
    coder: this.coderAgent,
  },
  tasks,
  async (task) => {
    console.log(
      `Executing: ${task.title}`,
    );

    return {
      taskId: task.id,
      success: true,
      message: "Completed",
    };
  },
);

this.execution.enter(
  ExecutionPhase.Architecture,
);

console.log(
  "AI Specification:",
);

console.dir(
  specification,
  { depth: null },
);

const architecture =
  this.architect.plan(specification);

  const framework =
    this.selector.select(architecture);

  console.log(
    "Framework:",
    framework,
  );

return {
  framework,
  tasks,
  specification,
  outputDirectory,
};
}

async generateApplication(
  request: string,
  outputDirectory: string,
) {


this.execution.enter(
  ExecutionPhase.Requirements,
);

const {
  specification,
  architecturePlan,
} =
  await this.architectAgent.execute(
    request,
  );

const tasks =
  await this.plannerAgent.execute(
    specification,
  );
await this.executionLoop.execute(
  {
    request,
    outputDirectory,
    coder: this.coderAgent,
  },
  tasks,
  async (task) => {
    console.log(
      `Executing: ${task.title}`,
    );

    return {
      taskId: task.id,
      success: true,
      message: "Completed",
    };
  },
);

  this.execution.enter(
  ExecutionPhase.Architecture,
);

const architecture =
  this.architect.plan(specification);

  this.execution.enter(
  ExecutionPhase.Planning,
);


  const framework =
  this.selector.select(architecture);

console.log("Framework:", framework);

 this.execution.enter(
  ExecutionPhase.Implementation,
);
const existingFiles: string[] = [];
let response = "";

let parsedFiles: GeneratedFile[] = [];
console.log("Starting implementation loop...");
for (const task of tasks) {
  console.log("Current task:", task.title);

  console.log("Calling CoderAgent...");

    let result: { response: string; files: GeneratedFile[] } = { response: "", files: [] };
    try {
      result = await this.coderAgent.execute(
        task,
        architecture,
        architecturePlan,
        request,
        outputDirectory,
        existingFiles,
      );
    } catch (coderError: any) {
      console.warn(`[Orchestrator] CoderAgent failed: ${coderError.message}`);
      console.log(`[Orchestrator] Launching inline Coder self-healing loop...`);
      let repairAttempts = 0;
      let success = false;
      let lastError = coderError;

      while (repairAttempts < 3 && !success) {
        repairAttempts++;
        console.log(`[Self-Healing] Inline Coder repair attempt ${repairAttempts}/3...`);
        try {
          const repairResponse = await this.repairCoordinator.repair(
            request,
            lastError.message,
            response + `\nAttempted output for task "${task.title}":\n` + (lastError.stack || lastError.message)
          );

          const repairedFiles = this.parser.parse(repairResponse);
          if (repairedFiles.length > 0) {
            result = {
              response: repairResponse,
              files: repairedFiles
            };
            success = true;
            console.log(`[Self-Healing] ✓ Coder repair succeeded! Resolved placeholders.`);
          } else {
            throw new Error("No file changes parsed from repair response.");
          }
        } catch (repairErr: any) {
          lastError = repairErr;
          console.error(`[Self-Healing] Inline repair attempt ${repairAttempts} failed:`, repairErr.message);
        }
      }

      if (!success) {
        throw coderError;
      }
    }

  console.log("CoderAgent finished.");

  response +=
    result.response + "\n";

  parsedFiles.push(
    ...result.files,
  );
  existingFiles.push(
  ...result.files.map(
    (file) => file.path,
  ),
);
}
this.execution.enter(
  ExecutionPhase.Review,
);
const mergedFiles =
  await this.reviewerAgent.execute(
    request,
    response,
    parsedFiles,
  );
this.execution.enter(
  ExecutionPhase.Validation,
);
const files =
  this.validate(
    framework,
    mergedFiles,
  );
this.write(
  files,
  outputDirectory,
);
let build =
  await this.buildOrchestrator.verify(
    outputDirectory,
  );

if (!build.success) {
  let attempts = 0;
  const maxRepairAttempts = 3;

  while (!build.success && attempts < maxRepairAttempts) {
    attempts++;
    console.log();
    console.log(`[Self-Healing] Attempting automatic repair ${attempts}/${maxRepairAttempts}...`);

    try {
      const repairResponse =
        await this.repairCoordinator.repair(
          request,
          build.stderr,
          response,
        );

      const repairedFiles = this.parser.parse(repairResponse);
      if (repairedFiles.length > 0) {
        console.log(`[Self-Healing] Parsed ${repairedFiles.length} corrected files. Writing to disk...`);
        const validatedRepairedFiles = this.validate(framework, repairedFiles);
        this.write(validatedRepairedFiles, outputDirectory);

        build = await this.buildOrchestrator.verify(outputDirectory);
        if (build.success) {
          console.log("[Self-Healing] ✓ Build succeeded after automatic repair!");
          break;
        }
      } else {
        console.warn("[Self-Healing] No file changes were parsed from the repair response.");
        break;
      }
    } catch (error: any) {
      console.error(`[Self-Healing] Error occurred during repair attempt ${attempts}:`, error.message);
      break;
    }
  }
}

if (!build.success) {
  console.log();
  console.log("❌ Self-Healing: Build is still failing after maximum repair attempts.");
}

console.log("Generating deployment configurations...");
const deployFiles = this.deployGenerator.generate(specification);
this.write(deployFiles, outputDirectory);

this.execution.complete();
  return {
    filesCreated: files.length + deployFiles.length,
  };
}
getProvider() {
  return this.provider;
}
}
