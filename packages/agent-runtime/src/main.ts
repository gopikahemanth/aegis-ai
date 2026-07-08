import {
  GroqProvider,
  Orchestrator,
} from "@aegis/ai-core";

import { AgentRuntime } from "./runtime.js";

const provider = new GroqProvider();

const orchestrator =
  new Orchestrator(provider);

const runtime =
  new AgentRuntime(orchestrator);

runtime
  .start(
    "Create a modern landing page with HTML, CSS and JavaScript. Separate every file.",
    "./generated/runtime-demo",
  )
  .catch(console.error);
