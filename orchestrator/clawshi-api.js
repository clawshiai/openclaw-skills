// Clawshi API client — wraps all endpoints an agent needs

export class ClawshiAPI {
  constructor(baseUrl, apiKey = null) {
    this.base = baseUrl;
    this.apiKey = apiKey;
  }

  async _get(path, auth = false) {
    const headers = { "Content-Type": "application/json" };
    if (auth && this.apiKey) {
      headers["Authorization"] = `Bearer ${this.apiKey}`;
    }
    const res = await fetch(`${this.base}${path}`, { headers });
    if (!res.ok) return null;
    return res.json();
  }

  async _post(path, body, auth = false) {
    const headers = { "Content-Type": "application/json" };
    if (auth && this.apiKey) {
      headers["Authorization"] = `Bearer ${this.apiKey}`;
    }
    const res = await fetch(`${this.base}${path}`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { error: true, status: res.status, message: text };
    }
    return res.json();
  }

  // ── Public endpoints ──

  async getMarkets() {
    const data = await this._get("/markets");
    const markets = data?.markets || data || [];
    if (!Array.isArray(markets)) return [];
    return markets
      .filter((m) => m.status === "active")
      .map((m) => ({
        ...m,
        yes_probability: m.probabilities?.yes ?? 50,
        no_probability: m.probabilities?.no ?? 50,
      }));
  }

  async getMarket(id) {
    return this._get(`/markets/${id}`);
  }

  async getMarketStakes(id) {
    return this._get(`/markets/${id}/stakes`);
  }

  async getLeaderboard() {
    return this._get("/leaderboard");
  }

  // ── Auth endpoints ──

  async getSignals() {
    return this._get("/data/signals", true);
  }

  async getTrends() {
    return this._get("/data/trends", true);
  }

  async getMyStakes() {
    return this._get("/stakes/my", true);
  }

  async getMyProfile() {
    return this._get("/agents/me", true);
  }

  // ── Agent registration ──

  async registerAgent(name) {
    return this._post("/agents/register", { name });
  }

  async registerWallet(walletAddress) {
    return this._post("/wallet/register", { wallet_address: walletAddress }, true);
  }

  // ── Staking ──

  async recordStake(marketId, position, amount, txHash) {
    return this._post(
      `/stakes/market/${marketId}`,
      { position, amount, tx_hash: txHash },
      true
    );
  }
}
