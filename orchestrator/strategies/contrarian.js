// Contrarian strategy: bet AGAINST community consensus
// When the crowd is too bullish, go NO. When too bearish, go YES.
// Profit from overreactions and mean reversion.

export function decide(market, signal, trend, research) {
  const { yes_probability: yesProb } = market;
  let position = "SKIP";
  let confidence = 0;
  let reasoning = "";

  // Contrarian on strong signals — fade the crowd
  if (signal) {
    const strength = signal.signal || signal.signal_strength;
    if (strength === "strong_yes") {
      position = "NO";
      confidence = 0.7;
      reasoning = `Fading strong_yes (${signal.yes_probability}% YES = overconfident)`;
    } else if (strength === "strong_no") {
      position = "YES";
      confidence = 0.7;
      reasoning = `Fading strong_no (${signal.no_probability}% NO = oversold)`;
    }
  }

  // Boost if trend also extreme (crowd doubling down = bigger fade opportunity)
  if (trend && position !== "SKIP") {
    const dir = trend.direction;
    if (dir === "trending_yes" && position === "NO") {
      confidence = Math.min(1, confidence + 0.15);
      reasoning += ` | Trend confirms overreach (delta +${trend.delta})`;
    } else if (dir === "trending_no" && position === "YES") {
      confidence = Math.min(1, confidence + 0.15);
      reasoning += ` | Trend confirms overreach (delta ${trend.delta})`;
    }
    // If trend disagrees with our fade, less edge
    if (dir === "trending_no" && position === "NO") {
      confidence = Math.max(0, confidence - 0.2);
      reasoning += " | Trend agrees with fade (less contrarian edge)";
    }
  }

  // Fallback to extreme probabilities
  if (position === "SKIP" && yesProb != null) {
    if (yesProb > 85) {
      position = "NO";
      confidence = 0.55;
      reasoning = `Extreme YES: ${yesProb}% — fading overconfidence`;
    } else if (yesProb < 15) {
      position = "YES";
      confidence = 0.55;
      reasoning = `Extreme NO: ${yesProb}% — fading overdoom`;
    }
  }

  return { position, confidence, reasoning };
}
