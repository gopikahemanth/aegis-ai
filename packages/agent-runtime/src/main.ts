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

runtime.start().catch(console.error);
