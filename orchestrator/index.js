#!/usr/bin/env node
import { agents } from "./config.js";
import { runAgent } from "./runner.js";
import { ClawshiAPI } from "./clawshi-api.js";
import { CLAWSHI_API } from "./config.js";

// ── Parse CLI args ──

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const once = args.includes("--once");
const agentFilter = args.find((a) => a.startsWith("--agent="))?.split("=")[1];

// ── Colors ──

const G = "\x1b[92m";
const R = "\x1b[91m";
const C = "\x1b[96m";
const D = "\x1b[90m";
const W = "\x1b[97m";
const B = "\x1b[1m";
const N = "\x1b[0m";

// ── Banner ──

console.log();
console.log(`  ${D}────────────────────────────────────────────────${N}`);
console.log(`  ${B}${W}⟁  Clawshi Agent Arena${N}  ${D}v1.0.0${N}`);
console.log(`  ${D}────────────────────────────────────────────────${N}`);
console.log();
console.log(`  ${D}API${N}      ${CLAWSHI_API}`);
console.log(`  ${D}Mode${N}     ${dryRun ? `${G}DRY RUN${N} (no real stakes)` : `${R}LIVE${N}`}`);
console.log(`  ${D}Loop${N}     ${once ? "single cycle" : "continuous"}`);
console.log();

// ── Select agents ──

let selected = agents.filter((a) => a.enabled);
if (agentFilter) {
  selected = selected.filter((a) => a.name === agentFilter);
}

if (selected.length === 0) {
  console.log(`  ${R}No agents selected.${N} Check config or --agent= flag.`);
  process.exit(1);
}

// ── Register agents if needed ──

async function ensureRegistered(agentConfig) {
  // Check env var first
  if (process.env.CLAWSHI_AGENT_KEY) {
    agentConfig.apiKey = process.env.CLAWSHI_AGENT_KEY;
    console.log(`  ${G}✓${N} ${B}${agentConfig.name}${N} — key from env`);
    return agentConfig;
  }

  if (!agentConfig.apiKey) {
    console.log(`  ${D}Registering${N} ${B}${agentConfig.name}${N}...`);
    const api = new ClawshiAPI(CLAWSHI_API);
    const result = await api.registerAgent(agentConfig.name);
    if (result?.api_key) {
      agentConfig.apiKey = result.api_key;
      console.log(`  ${G}✓${N} Registered — key: ${D}${result.api_key.slice(0, 15)}...${N}`);
      console.log(`  ${D}Save this: CLAWSHI_AGENT_KEY=${result.api_key}${N}`);
    } else {
      const msg = JSON.stringify(result?.message || result || "unknown");
      if (msg.includes("already taken")) {
        console.log(`  ${R}Agent "${agentConfig.name}" already registered.${N}`);
        console.log(`  ${D}Set CLAWSHI_AGENT_KEY=<key> to use existing agent${N}`);
      } else {
        console.log(`  ${R}Registration failed:${N} ${msg}`);
      }
      process.exit(1);
    }
  }

  return agentConfig;
}

// ── Main ──

async function main() {
  // Check API health
  const api = new ClawshiAPI(CLAWSHI_API);
  const markets = await api.getMarkets();
  if (!markets) {
    console.log(`  ${R}Cannot reach Clawshi API at ${CLAWSHI_API}${N}`);
    process.exit(1);
  }
  console.log(`  ${G}✓${N} API online — ${B}${markets.length}${N} active markets`);
  console.log();

  // Launch agents
  for (const agentConfig of selected) {
    const cfg = await ensureRegistered(agentConfig);

    const model = cfg.model.model;
    const skills = cfg.skills.join(", ");
    const strat = cfg.strategy;

    console.log(`  ${D}────────────────────────────────────────────────${N}`);
    console.log(`  ${C}${B}${cfg.name}${N}`);
    console.log(`  ${D}model${N}    ${W}${model}${N}`);
    console.log(`  ${D}skills${N}   ${G}${skills}${N}`);
    console.log(`  ${D}strategy${N} ${W}${strat}${N}`);
    console.log(`  ${D}threshold${N} ${cfg.params.confidence_threshold}`);
    console.log(`  ${D}max stake${N} $${cfg.params.max_stake_usdc} USDC`);
    console.log(`  ${D}────────────────────────────────────────────────${N}`);
    console.log();

    // Use env var for API key override
    if (process.env.CLAWSHI_AGENT_KEY) {
      cfg.apiKey = process.env.CLAWSHI_AGENT_KEY;
    }

    await runAgent(cfg, { dryRun, once });
  }

  if (once) {
    console.log(`\n  ${D}Done. Single cycle completed.${N}\n`);
  }
}

main().catch((err) => {
  console.error(`  ${R}Fatal:${N}`, err.message);
  process.exit(1);
});
