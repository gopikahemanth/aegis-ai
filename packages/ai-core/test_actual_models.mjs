import { GroqProvider } from "./dist/providers/groq.js";

const g = new GroqProvider();
for (const m of ["openai/gpt-oss-120b", "qwen/qwen3.8-27b", "openai/gpt-oss-20b"]) {
  try {
    const res = await g.chat([{ role: "user", content: "Say OK" }], { model: m });
    console.log(`GROQ ${m} SUCCESS:`, res.trim());
  } catch (e) {
    console.log(`GROQ ${m} FAIL:`, e.message);
  }
}
