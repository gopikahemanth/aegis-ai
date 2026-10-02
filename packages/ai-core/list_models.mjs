import { env } from "./dist/utils/env.js";

if (env.CEREBRAS_API_KEY) {
  try {
    const res = await fetch("https://api.cerebras.ai/v1/models", {
      headers: { Authorization: `Bearer ${env.CEREBRAS_API_KEY}` }
    });
    const data = await res.json();
    console.log("CEREBRAS MODELS:", data.data?.map(m => m.id));
  } catch (e) {
    console.log("CEREBRAS MODELS FAIL:", e.message);
  }
}

if (env.GROQ_API_KEY) {
  try {
    const res = await fetch("https://api.groq.com/openai/v1/models", {
      headers: { Authorization: `Bearer ${env.GROQ_API_KEY}` }
    });
    const data = await res.json();
    console.log("GROQ MODELS:", data.data?.map(m => m.id));
  } catch (e) {
    console.log("GROQ MODELS FAIL:", e.message);
  }
}
