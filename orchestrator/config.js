export const CLAWSHI_API = process.env.CLAWSHI_API || "http://localhost:3456";

export const agents = [
  {
    name: "claude_sentinel",
    enabled: true,
    model: {
      provider: "anthropic",
      model: "claude-haiku-4-5-20251001",
    },
    skills: ["moltbook", "neynar"],
    strategy: "sentiment",
    params: {
      confidence_threshold: 0.6,
      max_stake_usdc: 5,
      check_interval_min: 30,
    },
  },
  // Agent B & C — enable after Agent A is tested
  // {
  //   name: "gpt-contrarian",
  //   enabled: false,
  //   model: { provider: "openai", model: "gpt-4o" },
  //   skills: ["neynar", "erc-8004"],
  //   strategy: "contrarian",
  //   params: { confidence_threshold: 0.7, max_stake_usdc: 5, check_interval_min: 45 },
  // },
  // {
  //   name: "gemini-momentum",
  //   enabled: false,
  //   model: { provider: "google", model: "gemini-2.5-pro" },
  //   skills: ["moltbook"],
  //   strategy: "momentum",
  //   params: { confidence_threshold: 0.65, max_stake_usdc: 5, check_interval_min: 60 },
  // },
];
