"""Egg app backend. Run: uvicorn main:app --reload --host 0.0.0.0"""
import json, sqlite3, statistics
from datetime import date, timedelta
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from ai import ai_summary

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# SQLite = a database stored in one file (egg.db). Data survives closing the app.
db = sqlite3.connect("egg.db", check_same_thread=False)
db.execute("CREATE TABLE IF NOT EXISTS logs(day TEXT PRIMARY KEY, flow TEXT, mood TEXT, symptoms TEXT, notes TEXT)")

class Log(BaseModel):
    flow: str = "none"          # none | light | medium | heavy
    mood: str | None = None     # low | sensitive | calm | happy | anxious
    symptoms: list[str] = []    # e.g. "Mild cramps", "Headache"
    notes: str = ""

def all_logs() -> dict:
    rows = db.execute("SELECT day, flow, mood, symptoms, notes FROM logs ORDER BY day").fetchall()
    return {d: dict(flow=f, mood=m, symptoms=json.loads(s), notes=n) for d, f, m, s, n in rows}

@app.put("/logs/{day}")
def save_log(day: str, log: Log):
    db.execute("INSERT OR REPLACE INTO logs VALUES (?,?,?,?,?)",
               (day, log.flow, log.mood, json.dumps(log.symptoms), log.notes))
    db.commit()
    return {"ok": True}

@app.get("/logs")
def get_logs():
    return all_logs()

def periods(logs: dict) -> list[list[str]]:
    """Group consecutive bleeding days into periods (a gap of 2+ days starts a new one)."""
    days = sorted(d for d, l in logs.items() if l["flow"] != "none")
    runs: list[list[str]] = []
    for d in days:
        if runs and (date.fromisoformat(d) - date.fromisoformat(runs[-1][-1])).days <= 2:
            runs[-1].append(d)
        else:
            runs.append([d])
    return runs

def avg(xs): return round(statistics.mean(xs), 1) if xs else None

@app.get("/insights")
def insights():
    runs = periods(all_logs())
    starts = [date.fromisoformat(r[0]) for r in runs]
    cycles = [(b - a).days for a, b in zip(starts, starts[1:])]
    lengths = [len(r) for r in runs]
    predicted = []
    if cycles and starts:
        nxt = starts[-1] + timedelta(days=round(statistics.mean(cycles)))
        predicted = [str(nxt + timedelta(days=i)) for i in range(round(statistics.mean(lengths)))]
    return {"avg_cycle": avg(cycles), "avg_period": avg(lengths),
            "cycle_lengths": cycles, "period_lengths": lengths, "predicted_days": predicted}

# ---------------------------------------------------------------------------
# PHASES
# Day 1 = first day of a period. Everything is worked out from user's average
# cycle length and average period length, so it updates by itself as user logs.
#   Menstrual : Day 1 -> last day of bleeding
#   Ovulation : 3 days before the estimated ovulation day -> 1 day after it
#   Follicular: Day 1 -> ovulation day (so it overlaps period)
#   Luteal    : day after ovulation -> last day before the next period
# The phases overlap, so each calendar day gets ONE label. If a day is in
# several phases, the first one in PRIORITY wins.
# ---------------------------------------------------------------------------
PRIORITY = ["menstrual", "ovulation", "follicular", "luteal"]
DEFAULT_CYCLE, DEFAULT_PERIOD = 28, 5     # used until you've logged enough to average
LUTEAL_LENGTH = 14                         # ovulation is usually ~14 days before the next period
FUTURE_CYCLES = 3                          # how many cycles ahead to predict
 
def phase_days(logs: dict, avg_cycle, avg_period) -> dict:
    """Return {"YYYY-MM-DD": phase name} for every day we can label."""
    runs = periods(logs)
    if not runs:
        return {}
    cycle_len = round(avg_cycle) if avg_cycle else DEFAULT_CYCLE
    period_len = round(avg_period) if avg_period else DEFAULT_PERIOD
    ovulation_day = max(cycle_len - LUTEAL_LENGTH, 1)   # as a day number, Day 1 = period start
 
    # Logged periods use the real last bleeding day. Predicted ones use the average period length.
    cycles = [(date.fromisoformat(r[0]), date.fromisoformat(r[-1])) for r in runs]
    for _ in range(FUTURE_CYCLES):
        nxt = cycles[-1][0] + timedelta(days=cycle_len)
        cycles.append((nxt, nxt + timedelta(days=period_len - 1)))
    starts = [c[0] for c in cycles] + [cycles[-1][0] + timedelta(days=cycle_len)]  # last one = end marker
 
    out: dict[str, str] = {}
    for i, (start, period_end) in enumerate(cycles):
        cycle_end = starts[i + 1] - timedelta(days=1)       # the day before the next period
        ov = start + timedelta(days=ovulation_day - 1)
        ranges = {
            "luteal":     (ov + timedelta(days=1), cycle_end),
            "follicular": (start, ov),
            "ovulation":  (ov - timedelta(days=3), ov + timedelta(days=1)),
            "menstrual":  (start, period_end),
        }
        # Paint lowest priority first so higher priority paints over it.
        for name in reversed(PRIORITY):
            a, b = ranges[name]
            a, b = max(a, start), min(b, cycle_end)
            for n in range((b - a).days + 1):
                out[str(a + timedelta(days=n))] = name
    return out
 
@app.get("/phases")
def phases():
    logs, ins = all_logs(), insights()
    cycle_len = round(ins["avg_cycle"]) if ins["avg_cycle"] else DEFAULT_CYCLE
    period_len = round(ins["avg_period"]) if ins["avg_period"] else DEFAULT_PERIOD
    return {
        "days": phase_days(logs, ins["avg_cycle"], ins["avg_period"]),
        "cycle_length": cycle_len,
        "period_length": period_len,
        "ovulation_day": max(cycle_len - LUTEAL_LENGTH, 1),
        # True until there are 2+ logged periods, so the app can say "based on a typical cycle"
        "estimated": ins["avg_cycle"] is None or ins["avg_period"] is None,
    }

@app.get("/analysis")
def analysis():
    """Rule-based pattern spotting. Every finding is a gentle 'worth asking about', never a diagnosis."""
    logs, ins = all_logs(), insights()
    runs, cycles = periods(logs), ins["cycle_lengths"]
    period_days = [d for r in runs for d in r]
    n_pd = len(period_days) or 1
    sym = lambda d, s: s in logs[d]["symptoms"]
    out = []

    def add(title, detail, level="info"): out.append({"title": title, "detail": detail, "level": level})

    if len(cycles) < 3:
        add("Keep logging", "A few more logged cycles will make these patterns much more reliable.")
    else:
        spread = max(cycles) - min(cycles)
        if spread > 7 or max(cycles) > 35 or min(cycles) < 21:
            add("Irregular cycle length",
                f"Your cycles ranged from {min(cycles)} to {max(cycles)} days. Irregular cycles can have many causes "
                "(stress, thyroid, PCOS and others). Worth mentioning to a clinician.", "watch")
        if max(cycles) > 60:
            add("Long gaps between periods", "Very long gaps are worth checking with a clinician, especially if new for you or in your 40s+ (perimenopause).", "watch")
    if ins["avg_period"] and ins["avg_period"] > 7:
        add("Long periods", f"Your periods average {ins['avg_period']} days, longer than the typical 3-7.", "watch")

    heavy = sum(logs[d]["flow"] == "heavy" for d in period_days) / n_pd
    cramps = sum(sym(d, "Mild cramps") for d in period_days) / n_pd
    if heavy >= 0.4 and cramps >= 0.5 and len(period_days) >= 4:
        add("Heavy and painful periods",
            "Frequent heavy flow with cramps is a pattern clinicians look at for fibroids, adenomyosis or endometriosis. "
            "It's common to have this and be fine, but it's worth raising with a doctor.", "watch")
    off = [d for d in logs if d not in period_days and sym(d, "Mild cramps")]
    if len(off) >= 4:
        add("Cramps outside your period", f"You logged cramps on {len(off)} non-period days. Pelvic pain outside bleeding is worth discussing with a clinician.", "watch")
    if heavy >= 0.4 and any(sym(d, "Headache") for d in logs):
        add("Possible low iron", "Heavy bleeding plus headaches can go with low iron. A blood test (ferritin) is a simple way to check.", "info")
    low = [d for d in logs if logs[d]["mood"] in ("low", "anxious")]
    #if len(low) >= 5:
        #add("Mood patterns", f"Low or anxious mood on {len(low)} logged days. If it clusters before your period, PMS/PMDD may be worth discussing.", "info")

    if not any(o["level"] == "watch" for o in out) and len(cycles) >= 3:
        add("Nothing stands out", "Your logs don't show any of the patterns we look for. Keep logging!", "good")

    summary = "Here's what your last few logs suggest." if out else "Log a few days to get started."
    return {"summary": summary, "ai_summary": ai_summary(logs, ins, out), "findings": out,
            "disclaimer": "Patterns are based on your logs, not a diagnosis. Talk to a clinician about changes that concern you."}

from pcos_routes import register
register(app, db, all_logs, insights)