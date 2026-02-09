import { ClaudeModel } from "./models/claude.js";
import * as moltbook from "./skills/moltbook.js";
import * as neynar from "./skills/neynar.js";
import * as sentimentStrategy from "./strategies/sentiment.js";
import { ClawshiAPI } from "./clawshi-api.js";
import { CLAWSHI_API } from "./config.js";
import { appendFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Logging ──

function log(agent, level, msg) {
  const ts = new Date().toISOString();
  const line = `[${ts}] [${agent}] [${level}] ${msg}`;
  console.log(line);

  mkdirSync(join(__dirname, "logs"), { recursive: true });
  appendFileSync(join(__dirname, "logs", `${agent}.log`), line + "\n");
}

// ── Model factory ──

function createModel(config) {
  if (config.provider === "anthropic") {
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) throw new Error("ANTHROPIC_API_KEY not set");
    return new ClaudeModel(key, config.model);
  }
  // Future: openai, google, local
  throw new Error(`Unknown model provider: ${config.provider}`);
}

// ── Strategy factory ──

function getStrategy(name) {
  if (name === "sentiment") return sentimentStrategy;
  // Future: contrarian, momentum
  throw new Error(`Unknown strategy: ${name}`);
}

// ── Research via OpenClaw skills ──

async function doResearch(skills, marketQuestion) {
  const results = [];

  // Extract keywords from market question for searching
  const keywords = marketQuestion
    .replace(/[?!.,]/g, "")
    .split(" ")
    .filter((w) => w.length > 3)
    .slice(0, 5)
    .join(" ");

  for (const skill of skills) {
    try {
      if (skill === "moltbook") {
        const data = await moltbook.researchTopic(keywords);
        results.push(data);
      } else if (skill === "neynar") {
        const key = process.env.NEYNAR_API_KEY;
        const data = await neynar.researchTopic(key, keywords);
        results.push(data);
      }
    } catch (err) {
      results.push(`${skill}: error — ${err.message}`);
    }
  }

  return results.join("\n\n");
}

// ── Build LLM prompt ──

function buildPrompt(agentName, strategy, market, signals, trends, research) {
  return `You are ${agentName}, a prediction market trader on Clawshi.
Your strategy: ${strategy} — follow community consensus, bet with the majority sentiment.

MARKET:
  ID: ${market.id}
  Question: ${market.question}
  Category: ${market.category || "general"}
  Current odds: YES ${market.yes_probability}% / NO ${market.no_probability || (100 - market.yes_probability)}%
  Status: ${market.status}

CLAWSHI SIGNALS:
${signals ? JSON.stringify(signals, null, 2) : "  (no signal data available)"}

CLAWSHI TRENDS:
${trends ? JSON.stringify(trends, null, 2) : "  (no trend data available)"}

RESEARCH (from OpenClaw skills):
${research || "  (no research data)"}

Based on your analysis, decide:
1. position: "YES" or "NO" or "SKIP"
2. confidence: 0.0 to 1.0
3. reasoning: brief explanation (1-2 sentences)

Respond ONLY with JSON: { "position": "...", "confidence": 0.0, "reasoning": "..." }`;
}

// ── Single agent run ──

export async function runAgent(agentConfig, options = {}) {
  const { dryRun = false, once = false } = options;
  const { name, model: modelConfig, skills, strategy: strategyName, params } = agentConfig;

  log(name, "INFO", `Starting agent — model: ${modelConfig.model}, strategy: ${strategyName}`);
  log(name, "INFO", `Skills: ${skills.join(", ")} | Dry run: ${dryRun}`);

  const model = createModel(modelConfig);
  const strategy = getStrategy(strategyName);
  const api = new ClawshiAPI(CLAWSHI_API, agentConfig.apiKey);

  async function cycle() {
    log(name, "INFO", "── Cycle start ──");

    // 1. DISCOVER — get active markets
    const markets = await api.getMarkets();
    if (!markets.length) {
      log(name, "WARN", "No active markets found");
      return;
    }
    log(name, "INFO", `Found ${markets.length} active markets`);

    // Get existing stakes to avoid re-staking
    const myStakes = await api.getMyStakes();
    const stakedMarketIds = new Set(
      Array.isArray(myStakes) ? myStakes.map((s) => s.market_id) : []
    );

    // 2-5. For each market: RESEARCH → ANALYZE → DECIDE → EXECUTE
    for (const market of markets) {
      if (stakedMarketIds.has(market.id)) {
        log(name, "SKIP", `Market #${market.id}: already staked`);
        continue;
      }

      log(name, "INFO", `Market #${market.id}: "${market.question}"`);

      // 2. RESEARCH
      log(name, "INFO", `  Researching via: ${skills.join(", ")}`);
      const research = await doResearch(skills, market.question);

      // 3. Get Clawshi signals/trends
      const signals = await api.getSignals();
      const trends = await api.getTrends();

      // 4. ANALYZE — LLM decision
      const prompt = buildPrompt(name, strategyName, market, signals, trends, research);
      log(name, "INFO", "  Querying LLM...");
      const llmDecision = await model.analyze(prompt);

      // Also get strategy's rule-based decision
      const ruleDecision = strategy.decide(market, signals, trends, research);

      // Combine: use LLM decision but boost confidence if strategy agrees
      let finalDecision = { ...llmDecision };
      if (llmDecision.position === ruleDecision.position && ruleDecision.position !== "SKIP") {
        finalDecision.confidence = Math.min(1, llmDecision.confidence + 0.1);
        finalDecision.reasoning += " (strategy agrees)";
      }

      log(
        name,
        "INFO",
        `  LLM: ${llmDecision.position} (${llmDecision.confidence}) — ${llmDecision.reasoning}`
      );
      log(
        name,
        "INFO",
        `  Rule: ${ruleDecision.position} (${ruleDecision.confidence}) — ${ruleDecision.reasoning}`
      );
      log(
        name,
        "INFO",
        `  Final: ${finalDecision.position} (${finalDecision.confidence})`
      );

      // 5. DECIDE — apply threshold
      if (finalDecision.position === "SKIP") {
        log(name, "SKIP", `  Market #${market.id}: SKIP — ${finalDecision.reasoning}`);
        continue;
      }

      if (finalDecision.confidence < params.confidence_threshold) {
        log(
          name,
          "SKIP",
          `  Market #${market.id}: confidence ${finalDecision.confidence} < threshold ${params.confidence_threshold}`
        );
        continue;
      }

      // Scale stake by confidence
      const stakeAmount = Math.round(finalDecision.confidence * params.max_stake_usdc * 100) / 100;

      if (dryRun) {
        log(
          name,
          "DRY",
          `  ✓ Would stake $${stakeAmount} USDC on ${finalDecision.position} for market #${market.id}`
        );
        log(name, "DRY", `    Reason: ${finalDecision.reasoning}`);
      } else {
        // 6. EXECUTE — record stake via API (on-chain tx would happen here)
        log(name, "EXEC", `  Staking $${stakeAmount} on ${finalDecision.position}...`);
        const result = await api.recordStake(
          market.id,
          finalDecision.position,
          stakeAmount,
          `dry_${Date.now()}` // placeholder tx hash
        );
        if (result?.error) {
          log(name, "ERROR", `  Stake failed: ${result.message}`);
        } else {
          log(name, "OK", `  ✓ Staked $${stakeAmount} on ${finalDecision.position}`);
        }
      }
    }

    log(name, "INFO", "── Cycle complete ──\n");
  }

  // Run once or loop
  await cycle();

  if (!once) {
    const interval = params.check_interval_min * 60 * 1000;
    log(name, "INFO", `Next cycle in ${params.check_interval_min} minutes`);
    setInterval(cycle, interval);
  }
}
