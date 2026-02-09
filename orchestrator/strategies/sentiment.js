// Sentiment strategy: follow community consensus
// If signals are strong in one direction, bet that way
// Confidence scales with signal strength + research alignment

export function decide(market, signals, trends, research) {
  const { yes_probability: yesProb } = market;
  let position = "SKIP";
  let confidence = 0;
  let reasoning = "";

  // Use Clawshi signals if available
  if (signals) {
    const strength = signals.signal_strength || signals.strength;
    if (strength === "strong_yes" || strength === "lean_yes") {
      position = "YES";
      confidence = strength === "strong_yes" ? 0.85 : 0.65;
      reasoning = `Clawshi signal: ${strength}`;
    } else if (strength === "strong_no" || strength === "lean_no") {
      position = "NO";
      confidence = strength === "strong_no" ? 0.85 : 0.65;
      reasoning = `Clawshi signal: ${strength}`;
    }
  }

  // Use trend direction as secondary signal
  if (trends) {
    const dir = trends.direction || trends.trending;
    if (dir === "trending_yes" && position !== "NO") {
      position = "YES";
      confidence = Math.max(confidence, 0.6);
      reasoning += ` | Trend: ${dir}`;
    } else if (dir === "trending_no" && position !== "YES") {
      position = "NO";
      confidence = Math.max(confidence, 0.6);
      reasoning += ` | Trend: ${dir}`;
    }
  }

  // Fallback to probability if no signals
  if (position === "SKIP" && yesProb != null) {
    if (yesProb > 70) {
      position = "YES";
      confidence = 0.5;
      reasoning = `High YES probability: ${yesProb}%`;
    } else if (yesProb < 30) {
      position = "NO";
      confidence = 0.5;
      reasoning = `Low YES probability: ${yesProb}%`;
    }
  }

  return { position, confidence, reasoning };
}
