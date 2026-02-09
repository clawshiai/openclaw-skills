import { ClaudeModel } from "./models/claude.js";
import * as moltbook from "./skills/moltbook.js";
import * as sentimentStrategy from "./strategies/sentiment.js";
import * as contrarianStrategy from "./strategies/contrarian.js";
import * as momentumStrategy from "./strategies/momentum.js";
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
  if (name === "contrarian") return contrarianStrategy;
  if (name === "momentum") return momentumStrategy;
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
      }
    } catch (err) {
      results.push(`${skill}: error — ${err.message}`);
    }
  }

  return results.join("\n\n");
}

// ── Build LLM prompt ──

function buildPrompt(agentName, strategy, market, signals, trends, research) {
  const strategyDesc = {
    sentiment: "follow community consensus, bet with the majority sentiment",
    contrarian: "bet AGAINST the crowd — fade overconfidence, profit from mean reversion",
    momentum: "follow the TREND direction — if momentum is shifting, ride the wave",
  };

  return `You are ${agentName}, a prediction market trader on Clawshi.
Your strategy: ${strategy} — ${strategyDesc[strategy] || strategy}.

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

    // Get Clawshi signals/trends once, index by market_id
    const signalsRaw = await api.getSignals();
    const trendsRaw = await api.getTrends();
    const signalsByMarket = {};
    const trendsByMarket = {};
    for (const s of (signalsRaw?.signals || signalsRaw || [])) {
      if (s.market_id) signalsByMarket[s.market_id] = s;
    }
    for (const t of (trendsRaw?.trends || trendsRaw || [])) {
      if (t.market_id) trendsByMarket[t.market_id] = t;
    }

    // ── OPTIMIZATION 1: Rule-based pre-filter ──
    const candidates = [];
    for (const market of markets) {
      if (stakedMarketIds.has(market.id)) {
        log(name, "SKIP", `Market #${market.id}: already staked`);
        continue;
      }
      const sig = signalsByMarket[market.id] || null;
      const trend = trendsByMarket[market.id] || null;
      const ruleDecision = strategy.decide(market, sig, trend, "");
      if (ruleDecision.position !== "SKIP" && ruleDecision.confidence > 0) {
        candidates.push({ market, ruleDecision, sig, trend });
      } else {
        log(name, "FILTER", `Market #${market.id}: rule says SKIP — "${market.question.slice(0, 50)}..."`);
      }
    }

    // ── OPTIMIZATION 4: Limit to top 5 by rule confidence ──
    const MAX_LLM_CALLS = 5;
    candidates.sort((a, b) => b.ruleDecision.confidence - a.ruleDecision.confidence);
    const top = candidates.slice(0, MAX_LLM_CALLS);

    log(name, "INFO", `Pre-filter: ${candidates.length}/${markets.length} passed rules, sending top ${top.length} to LLM`);

    // 2-5. For each candidate: RESEARCH → ANALYZE → DECIDE → EXECUTE
    for (const { market, ruleDecision, sig, trend } of top) {
      log(name, "INFO", `Market #${market.id}: "${market.question}"`);

      // 2. RESEARCH
      log(name, "INFO", `  Researching via: ${skills.join(", ")}`);
      const research = await doResearch(skills, market.question);

      // 3. ANALYZE — LLM decision (pass per-market signals/trends)
      const prompt = buildPrompt(name, strategyName, market, sig, trend, research);
      log(name, "INFO", "  Querying LLM...");
      const llmDecision = await model.analyze(prompt);

      // Combine: use LLM decision but boost confidence if strategy agrees
      let finalDecision = { ...llmDecision };
      if (llmDecision.position === ruleDecision.position && ruleDecision.position !== "SKIP") {
        finalDecision.confidence = Math.min(1, llmDecision.confidence + 0.1);
        finalDecision.reasoning += " (strategy agrees)";
      }

      log(name, "INFO", `  LLM: ${llmDecision.position} (${llmDecision.confidence}) — ${llmDecision.reasoning}`);
      log(name, "INFO", `  Rule: ${ruleDecision.position} (${ruleDecision.confidence}) — ${ruleDecision.reasoning}`);
      log(name, "INFO", `  Final: ${finalDecision.position} (${finalDecision.confidence})`);

      // 4. DECIDE — apply threshold
      if (finalDecision.position === "SKIP") {
        log(name, "SKIP", `  Market #${market.id}: SKIP — ${finalDecision.reasoning}`);
        continue;
      }

      if (finalDecision.confidence < params.confidence_threshold) {
        log(name, "SKIP", `  Market #${market.id}: confidence ${finalDecision.confidence} < threshold ${params.confidence_threshold}`);
        continue;
      }

      // Scale stake by confidence
      const stakeAmount = Math.round(finalDecision.confidence * params.max_stake_usdc * 100) / 100;

      if (dryRun) {
        log(name, "DRY", `  ✓ Would stake $${stakeAmount} USDC on ${finalDecision.position} for market #${market.id}`);
        log(name, "DRY", `    Reason: ${finalDecision.reasoning}`);
      } else {
        // 5. EXECUTE — record stake via API
        log(name, "EXEC", `  Staking $${stakeAmount} on ${finalDecision.position}...`);
        const result = await api.recordStake(
          market.id,
          finalDecision.position,
          stakeAmount,
          `dry_${Date.now()}`
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
