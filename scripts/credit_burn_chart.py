#!/usr/bin/env python3
"""
Anthropic Credit Burn Report — Terminal Output
Just run: python3 scripts/credit_burn_chart.py
"""

import json, os

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_FILE = os.path.join(SCRIPT_DIR, '..', 'data', 'terminal_analytics.json')

# Colors
R = '\033[91m'  # red
G = '\033[92m'  # green
Y = '\033[93m'  # yellow/orange
B = '\033[94m'  # blue
C = '\033[96m'  # cyan
W = '\033[97m'  # white
D = '\033[90m'  # dim
BOLD = '\033[1m'
RST = '\033[0m'

def bar(val, max_val, width=30, char='█', color=G):
    filled = int(val / max(max_val, 1) * width)
    return f"{color}{'█' * filled}{D}{'░' * (width - filled)}{RST}"

def spark(values, width=1):
    sparks = '▁▂▃▄▅▆▇█'
    mn, mx = min(values), max(values)
    rng = mx - mn or 1
    return ''.join(sparks[min(int((v - mn) / rng * 7), 7)] * width for v in values)

def flag(code):
    try:
        return ''.join(chr(0x1F1E6 + ord(c) - 65) for c in code.upper())
    except:
        return code

def main():
    with open(DATA_FILE) as f:
        data = json.load(f)

    daily = data['daily']
    countries = data['countries'][:15]
    summary = data['summary']
    api = data['api_messages']
    balance = data.get('balance', {})
    credit_events = data.get('credit_events', [])

    W_ = 72  # panel width

    # ── Header ──
    print()
    print(f"  {D}{'─' * W_}{RST}")
    print(f"  {BOLD}{W}  ⟁  Anthropic Terminal Usage Report{RST}     {G}Model: Claude Opus 4.6{RST}")
    print(f"  {D}{'─' * W_}{RST}")
    print()

    # ── Stats Row ──
    bal_amt = balance.get('amount', -0.42)
    bal_str = f"-US${abs(bal_amt):.2f}"
    print(f"  {W}{BOLD}{summary['total_requests']}{RST} requests   "
          f"{W}{BOLD}{summary['unique_users']}{RST} users   "
          f"{W}{BOLD}{len(data['countries'])}{RST} countries   "
          f"{W}{BOLD}{api['total']}{RST} AI messages   "
          f"{G}{BOLD}{api['success_rate']}%{RST} success   "
          f"{R}{BOLD}{bal_str}{RST} {R}UNPAID{RST}")
    print()

    # ── Credit Burn Timeline ──
    print(f"  {BOLD}{C}CREDIT BURN TIMELINE{RST}  {D}Jan 31 — Feb 9, 2026{RST}")
    print(f"  {D}{'─' * W_}{RST}")

    max_req = max(d['requests'] for d in daily)

    # Build balance curve
    phase1 = ['2026-02-04', '2026-02-05', '2026-02-06', '2026-02-07']
    phase2 = ['2026-02-08', '2026-02-09']
    p1_reqs = sum(d['requests'] for d in daily if d['date'] in phase1)
    p2_reqs = sum(d['requests'] for d in daily if d['date'] in phase2)

    balances = []
    bal = 0
    for d in daily:
        dt = d['date']
        if dt < '2026-02-04':
            bal = 0
        elif dt == '2026-02-04':
            bal = 1000 - (d['requests'] / max(p1_reqs, 1)) * 1000
        elif dt in ['2026-02-05', '2026-02-06']:
            bal -= (d['requests'] / max(p1_reqs, 1)) * 1000
        elif dt == '2026-02-07':
            bal = 0
        elif dt == '2026-02-08':
            bal = 1300 - (d['requests'] / max(p2_reqs, 1)) * 1300.42
        elif dt == '2026-02-09':
            bal -= (d['requests'] / max(p2_reqs, 1)) * 1300.42
        balances.append(round(bal, 2))

    # Event markers
    event_map = {ev['date']: ev for ev in credit_events}

    for i, d in enumerate(daily):
        dt = d['date']
        short = dt[5:]  # "02-07"
        reqs = d['requests']
        errs = d['errors']
        bal_v = balances[i]

        # Request bar
        req_bar = bar(reqs, max_req, width=25)

        # Error indicator
        err_str = f" {R}✖ {errs} err{RST}" if errs > 0 else ""

        # Balance display
        if bal_v > 0:
            bal_col = Y
            bal_str = f"${bal_v:,.0f}"
        elif bal_v == 0 and dt >= '2026-02-04':
            bal_col = R
            bal_str = "$0"
        elif bal_v < 0:
            bal_col = R
            bal_str = f"-${abs(bal_v):.2f}"
        else:
            bal_col = D
            bal_str = "—"

        # Event annotation
        event_str = ""
        if dt in event_map:
            ev = event_map[dt]
            if ev['type'] == 'topup':
                event_str = f"  {G}▲ {ev['label']}{RST}"
            elif ev['type'] == 'depleted':
                event_str = f"  {R}▼ {ev['label']} — 48 errors!{RST}"

        print(f"  {D}{short}{RST}  {req_bar} {W}{reqs:>4}{RST}{err_str:<16} {bal_col}bal {bal_str:>8}{RST}{event_str}")

    print(f"  {D}{'─' * W_}{RST}")

    # Sparkline
    req_vals = [d['requests'] for d in daily]
    print(f"  {D}traffic:{RST} {G}{spark(req_vals, 2)}{RST}  {D}peak: Feb 8 ({max_req} reqs){RST}")
    print()

    # ── Top Countries ──
    print(f"  {BOLD}{C}TRAFFIC BY COUNTRY{RST}  {D}{len(data['countries'])} total{RST}")
    print(f"  {D}{'─' * W_}{RST}")

    max_count = countries[0]['count']
    for i, c in enumerate(countries):
        rank = f"{i+1:>2}"
        fg = flag(c['code'])
        name = c['country'][:18].ljust(18)
        cnt = c['count']
        pct = c['percentage']
        cbar = bar(cnt, max_count, width=22)
        print(f"  {D}{rank}.{RST} {fg} {W}{name}{RST} {cbar} {W}{cnt:>4}{RST} {D}({pct}%){RST}")

    print(f"  {D}{'─' * W_}{RST}")
    print()

    # ── Credit Events Summary ──
    print(f"  {BOLD}{C}CREDIT EVENTS{RST}")
    print(f"  {D}{'─' * W_}{RST}")
    print(f"  {D}Feb 4{RST}  {G}▲ +$1,000 topped up{RST}          {D}Started serving AI terminal{RST}")
    print(f"  {D}Feb 7{RST}  {R}▼ Credits DEPLETED{RST}            {R}{BOLD}48 errors — 502/499/500{RST}")
    print(f"  {D}      {RST}  {D}$1,000 burned in ~72 hours{RST}   {Y}Users kept hammering the endpoint{RST}")
    print(f"  {D}Feb 8{RST}  {G}▲ +$1,300 topped up{RST}          {D}Emergency reload{RST}")
    print(f"  {D}Feb 9{RST}  {R}● Balance: -$0.42{RST}            {R}Still burning. Still unpaid.{RST}")
    print(f"  {D}{'─' * W_}{RST}")
    print()

    # ── API Health ──
    print(f"  {BOLD}{C}AI TERMINAL HEALTH{RST}")
    print(f"  {D}{'─' * W_}{RST}")
    sr = api['success_rate']
    sr_bar = bar(sr, 100, width=20, color=G if sr > 80 else R)
    print(f"  Messages: {W}{BOLD}{api['total']}{RST}  Success: {G}{api['success']}{RST}  Failed: {R}{api['failed']}{RST}  Timeout: {Y}{api['timeout']}{RST}")
    print(f"  Rate:     {sr_bar} {G if sr > 80 else R}{sr}%{RST}")
    print(f"  {D}{'─' * W_}{RST}")
    print()

    # ── Hourly Heatmap ──
    hourly = data['hourly']
    h_vals = [h['requests'] for h in hourly]
    print(f"  {BOLD}{C}HOURLY TRAFFIC (UTC){RST}")
    print(f"  {D}{'─' * W_}{RST}")
    print(f"  {D}00  03  06  09  12  15  18  21  24{RST}")
    print(f"  {G}{spark(h_vals, 3)}{RST}")
    peak = max(range(24), key=lambda i: h_vals[i])
    print(f"  {D}Peak: {peak}:00 UTC ({(peak+7)%24}:00 WIB) — {h_vals[peak]} requests{RST}")
    print(f"  {D}{'─' * W_}{RST}")
    print()

    # ── Footer ──
    print(f"  {D}clawshi.app/terminal{RST}                          {R}{BOLD}-US$0.42 UNPAID{RST}")
    print(f"  {D}Powered by Claude Opus 4.6 · {summary['total_requests']} requests burned through $2,300 in 6 days{RST}")
    print()


if __name__ == '__main__':
    main()
