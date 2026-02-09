export const CLAWSHI_API = process.env.CLAWSHI_API || "http://localhost:3456";

export const agents = [
  {
    name: "claude_sentinel",
    enabled: true,
    model: {
      provider: "anthropic",
      model: "claude-haiku-4-5-20251001",
    },
    skills: ["moltbook"],
    strategy: "sentiment",
    params: {
      confidence_threshold: 0.6,
      max_stake_usdc: 5,
      check_interval_min: 30,
    },
  },
  {
    name: "claude_contrarian",
    enabled: true,
    model: {
      provider: "anthropic",
      model: "claude-haiku-4-5-20251001",
    },
    skills: ["moltbook"],
    strategy: "contrarian",
    params: {
      confidence_threshold: 0.65,
      max_stake_usdc: 5,
      check_interval_min: 30,
    },
  },
  {
    name: "claude_momentum",
    enabled: true,
    model: {
      provider: "anthropic",
      model: "claude-haiku-4-5-20251001",
    },
    skills: ["moltbook"],
    strategy: "momentum",
    params: {
      confidence_threshold: 0.6,
      max_stake_usdc: 5,
      check_interval_min: 30,
    },
  },
];
