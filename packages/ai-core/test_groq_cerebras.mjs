import { CerebrasProvider } from "./dist/providers/cerebras.js";
import { GroqProvider } from "./dist/providers/groq.js";

try {
  const c = new CerebrasProvider();
  const cRes = await c.chat([{ role: "user", content: "Say OK" }], { model: "llama-3.3-70b" });
  console.log("CEREBRAS llama-3.3-70b SUCCESS:", cRes.trim());
} catch (e) {
  console.log("CEREBRAS FAIL:", e.message);
}

try {
  const g = new GroqProvider();
  const gRes = await g.chat([{ role: "user", content: "Say OK" }], { model: "llama-3.3-70b-versatile" });
  console.log("GROQ llama-3.3-70b-versatile SUCCESS:", gRes.trim());
} catch (e) {
  console.log("GROQ FAIL:", e.message);
}
