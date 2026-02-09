// Momentum strategy: follow the TREND direction, not the current odds
// If sentiment is shifting YES, ride it. If shifting NO, ride it.
// Key signal: trend delta and direction, not static probability.

export function decide(market, signal, trend, research) {
  let position = "SKIP";
  let confidence = 0;
  let reasoning = "";

  // Primary: per-market trend direction and delta
  if (trend) {
    const dir = trend.direction;
    const delta = trend.delta || 0;
    const recentRate = trend.recent_yes_rate;

    if (dir === "trending_yes" && delta > 0) {
      position = "YES";
      confidence = delta >= 20 ? 0.8 : 0.6;
      reasoning = `Momentum YES: delta +${delta}, recent ${recentRate}%`;
    } else if (dir === "trending_no" && delta < 0) {
      position = "NO";
      confidence = Math.abs(delta) >= 20 ? 0.8 : 0.6;
      reasoning = `Momentum NO: delta ${delta}, recent ${recentRate}%`;
    } else if (dir === "stable" && Math.abs(delta) >= 10) {
      // Stable but with slight drift — weak signal
      position = delta > 0 ? "YES" : "NO";
      confidence = 0.5;
      reasoning = `Weak drift ${delta > 0 ? "YES" : "NO"}: delta ${delta}, labeled stable`;
    }
  }

  // Boost if signal aligns with trend
  if (signal && position !== "SKIP") {
    const strength = signal.signal || signal.signal_strength;
    if (
      (strength === "strong_yes" && position === "YES") ||
      (strength === "strong_no" && position === "NO")
    ) {
      confidence = Math.min(1, confidence + 0.1);
      reasoning += " | Signal confirms momentum";
    }
    if (
      (strength === "strong_yes" && position === "NO") ||
      (strength === "strong_no" && position === "YES")
    ) {
      confidence = Math.max(0, confidence - 0.15);
      reasoning += " | Signal diverges (caution)";
    }
  }

  if (position === "SKIP") {
    reasoning = "No trend momentum detected";
  }

  return { position, confidence, reasoning };
}
