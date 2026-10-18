"""report_routes.py: adds the /report endpoint used by the "Generate Report" button on the Insights page.

It returns RAW numbers only (no analysis, no AI text, no notes, no mood) so the user can share it with a clinician.
Hooked into main.py with two lines at the bottom:
    from report_routes import register as register_report
    register_report(app, db, all_logs, periods, history)
"""
import json
from collections import Counter
from datetime import date, timedelta

SHOW = 6  # how many recent periods / cycles to list (same as the History page bars)

# Every symptom the Daily log offers. Ones never logged still show up (with 0 days) so the clinician can see them.
KNOWN_SYMPTOMS = ["Mild cramps", "Heavy cramps", "Headache", "Bloating", "Pelvic pain", "Pain during sex"]
FLOWS = ["none", "light", "medium", "heavy"]

# The yes/no items from the Insights health profile that go in the report (key in the profile, label in the PDF)
PROFILE_ITEMS = [
    ("weight_gain", "Recent weight gain"),
    ("hair_growth", "Excess hair growth (face, chin, body)"),
    ("skin_darkening", "Dark skin patches (neck, underarms)"),
    ("hair_loss", "Hair thinning or loss"),
    ("pimples", "Acne"),
    ("fast_food", "Eat fast food often"),
]


def pct(n: int, total: int) -> int:
    return round(100 * n / total) if total else 0


def register(app, db, all_logs, periods, history):
    @app.get("/report")
    def report():
        logs = all_logs()
        runs = periods(logs)          # each run = list of bleeding days, e.g. ["2026-09-01", "2026-09-02", ...]
        hist = history()              # same averages the History page shows
        total_days = len(logs)

        # ---- Periods: start, end, length, and the flow level of every day ----
        # "flows" has one entry per calendar day from start to end, so Day 1, Day 2... always line up.
        # A day with no flow logged inside the period (the app allows a 1-day gap) is "" (left blank in the PDF).
        def flows_for(run):
            first, last = date.fromisoformat(run[0]), date.fromisoformat(run[-1])
            out = []
            for n in range((last - first).days + 1):
                l = logs.get(str(first + timedelta(days=n)))
                out.append(l["flow"] if l and l["flow"] != "none" else "")
            return out

        period_list = [
            {"start": r[0], "end": r[-1], "length": len(r), "flows": flows_for(r)}
            for r in runs
        ]

        # ---- Cycles: start of one period to the start of the next ----
        starts = [r[0] for r in runs]
        cycle_list = [
            {"start": a, "next_start": b, "length": (date.fromisoformat(b) - date.fromisoformat(a)).days}
            for a, b in zip(starts, starts[1:])
        ]

        # ---- Symptoms: number of logged days each one was ticked, most frequent first ----
        counts = Counter()
        for l in logs.values():
            counts.update(set(l["symptoms"]))
        names = KNOWN_SYMPTOMS + [s for s in counts if s not in KNOWN_SYMPTOMS]
        symptoms = sorted(
            ({"name": s, "days": counts[s], "percent": pct(counts[s], total_days)} for s in names),
            key=lambda x: (-x["days"], names.index(x["name"])),   # ties keep the Daily log order
        )

        # ---- Flow: share of logged days, and share of bleeding days (light + medium + heavy) ----
        flow_counts = Counter(l["flow"] for l in logs.values())
        bleeding = sum(flow_counts[f] for f in FLOWS if f != "none")
        flow = [
            {"level": f, "days": flow_counts[f], "percent": pct(flow_counts[f], total_days),
             "percent_of_bleeding": None if f == "none" else pct(flow_counts[f], bleeding)}
            for f in FLOWS
        ]

        # ---- Health profile yes/no items (None = the user never filled the profile in) ----
        db.execute("CREATE TABLE IF NOT EXISTS profile(id INTEGER PRIMARY KEY, data TEXT)")  # same table pcos_routes uses
        row = db.execute("SELECT data FROM profile WHERE id=1").fetchone()
        profile = json.loads(row[0]) if row else None
        extras = [{"label": label, "value": (bool(profile.get(key)) if profile else None)}
                  for key, label in PROFILE_ITEMS]

        days_sorted = sorted(logs)
        return {
            "logged_days": total_days,
            "first_log": days_sorted[0] if days_sorted else None,
            "last_log": days_sorted[-1] if days_sorted else None,
            "avg_period": hist["avg_period"],
            "avg_cycle": hist["avg_cycle"],
            "period_count": len(period_list),
            "cycle_count": len(cycle_list),
            "periods": list(reversed(period_list[-SHOW:])),    # most recent first
            "cycles": list(reversed(cycle_list[-SHOW:])),
            "symptoms": symptoms,
            "flow": flow,
            "flow_bleeding_days": bleeding,
            "extras": extras,
        }
