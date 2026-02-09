import Anthropic from "@anthropic-ai/sdk";

export class ClaudeModel {
  constructor(apiKey, model = "claude-haiku-4-5-20251001") {
    this.client = new Anthropic({ apiKey });
    this.model = model;
    this.name = model;
  }

  async analyze(prompt) {
    let res;
    try {
      res = await this.client.messages.create({
        model: this.model,
        max_tokens: 256,
        messages: [{ role: "user", content: prompt }],
      });
    } catch (err) {
      const msg = err.message || String(err);
      if (msg.includes("credit balance")) {
        return { position: "SKIP", confidence: 0, reasoning: "API credit balance too low" };
      }
      return { position: "SKIP", confidence: 0, reasoning: `API error: ${msg.slice(0, 100)}` };
    }

    const text = res.content[0]?.text || "";

    // Extract JSON from response
    const match = text.match(/\{[\s\S]*?\}/);
    if (!match) {
      return { position: "SKIP", confidence: 0, reasoning: "Failed to parse LLM response" };
    }

    try {
      const parsed = JSON.parse(match[0]);
      return {
        position: (parsed.position || "SKIP").toUpperCase(),
        confidence: Math.min(1, Math.max(0, Number(parsed.confidence) || 0)),
        reasoning: parsed.reasoning || "",
      };
    } catch {
      return { position: "SKIP", confidence: 0, reasoning: "JSON parse error" };
    }
  }
}
