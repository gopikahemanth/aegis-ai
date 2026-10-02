import { GoogleGenAI } from "@google/genai";
import { env } from "./dist/utils/env.js";

const client = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
try {
  const pager = await client.models.list();
  for await (const m of pager) {
    if (m.name.includes("flash")) {
      console.log(m.name);
    }
  }
} catch (e) {
  console.log("LIST FAIL:", e.message);
}
