// Sentiment strategy: follow community consensus
// If signals are strong in one direction, bet that way
// Confidence scales with signal strength + trend alignment

export function decide(market, signal, trend, research) {
  const { yes_probability: yesProb } = market;
  let position = "SKIP";
  let confidence = 0;
  let reasoning = "";

  // Use per-market signal
  if (signal) {
    const strength = signal.signal || signal.signal_strength;
    if (strength === "strong_yes" || strength === "lean_yes") {
      position = "YES";
      confidence = strength === "strong_yes" ? 0.85 : 0.65;
      reasoning = `Signal: ${strength} (${signal.yes_probability}%)`;
    } else if (strength === "strong_no" || strength === "lean_no") {
      position = "NO";
      confidence = strength === "strong_no" ? 0.85 : 0.65;
      reasoning = `Signal: ${strength} (${signal.no_probability}%)`;
    }
  }

  // Use per-market trend as secondary
  if (trend) {
    const dir = trend.direction;
    if (dir === "trending_yes" && position !== "NO") {
      position = "YES";
      confidence = Math.max(confidence, 0.6);
      reasoning += ` | Trend: ${dir} (delta +${trend.delta})`;
    } else if (dir === "trending_no" && position !== "YES") {
      position = "NO";
      confidence = Math.max(confidence, 0.6);
      reasoning += ` | Trend: ${dir} (delta ${trend.delta})`;
    }
  }

  // Fallback to probability
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
