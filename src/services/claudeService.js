import { API_URL, CLAUDE_MODEL } from "../config.js";

export async function askClaude(prompt, systemPrompt = "") {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: CLAUDE_MODEL, max_tokens: 4000,
      system: systemPrompt || "You are Fang, a MongoDB finance assistant. Respond in Spanish, brief and direct.",
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const data = await res.json();
  return data.content?.map((b) => (b.type === "text" ? b.text : "")).join("") || "";
}
