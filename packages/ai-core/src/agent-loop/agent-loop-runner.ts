import { AgentLoop } from "./agent-loop.js";
import { AgentExecutor } from "./agent-executor.js";
import type { AgentState } from "./agent-state.js";
import { AgentStep } from "./agent-step.js";

export class AgentLoopRunner {
  private readonly loop =
    new AgentLoop();

  private readonly executor =
    new AgentExecutor();

  async run(
    state: AgentState,
  ): Promise<AgentState> {

    while (true) {

      const step =
        this.loop.next(state);

      if (
        step === AgentStep.FINISHED
      ) {
        return state;
      }

      state =
        await this.executor.execute(
          step,
          state,
        );
    }
  }
}
