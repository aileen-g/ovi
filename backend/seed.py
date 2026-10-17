"""seed.py: fills the Egg database with realistic fake data for demos.

Run from the backend folder:
    python3 seed.py          # replaces everything with ~6 months of demo data
    python3 seed.py clear    # deletes all data (back to empty)

The fake user has irregular cycles, heavy and painful periods, cramps outside
her period, headaches, and low moods, so every part of the analysis lights up.
"""
import json
import os
import random
import sqlite3
import sys
from datetime import date, timedelta

DB_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "egg.db")

db = sqlite3.connect(DB_FILE)
db.execute(
    "CREATE TABLE IF NOT EXISTS logs(day TEXT PRIMARY KEY, flow TEXT, mood TEXT, symptoms TEXT, notes TEXT)"
)

if len(sys.argv) > 1 and sys.argv[1] == "clear":
    db.execute("DELETE FROM logs")
    db.execute("CREATE TABLE IF NOT EXISTS profile(id INTEGER PRIMARY KEY, data TEXT)")
    db.execute("DELETE FROM profile")
    db.commit()
    print("All data deleted.")
    sys.exit()

random.seed(7)  # same fake data every time, so your demo is predictable

# Days between period starts, oldest to newest. Deliberately irregular (26 to 41 days).
CYCLE_LENGTHS = [27, 34, 41, 28, 38]
# How many days each period lasted (6 periods = 5 gaps + the current one).
PERIOD_LENGTHS = [5, 6, 7, 5, 6, 6]

# The most recent period started 10 days ago; work backwards from there.
last_start = date.today() - timedelta(days=10)
starts = [last_start]
for length in reversed(CYCLE_LENGTHS):
    starts.insert(0, starts[0] - timedelta(days=length))

NOTES_PERIOD = [
    "Cramps woke me up last night",
    "So tired today, struggled to get out of bed",
    "Had to take a day off, pain was bad",
    "Soaked through a pad in a few hours",
    "Feeling drained and a bit dizzy",
]
NOTES_OTHER = [
    "Sharp pain on my left side for a while",
    "Stressed about exams this week",
    "Felt anxious and couldn't sleep well",
    "Bad headache all afternoon",
]

logs = {}
for i, start in enumerate(starts):
    period_len = PERIOD_LENGTHS[i]
    end = starts[i + 1] if i + 1 < len(starts) else date.today() + timedelta(days=1)
    day = start
    while day < end and day <= date.today():
        n = (day - start).days  # 0 = first day of period
        in_period = n < period_len
        days_until_next = (end - day).days

        # Flow: medium, then heavy for 3 days, then tapering off
        if not in_period:
            flow = "none"
        elif n == 0:
            flow = "medium"
        elif n <= 3:
            flow = "heavy"
        elif n == period_len - 1:
            flow = "light"
        else:
            flow = "medium"

        symptoms = []
        if in_period and n <= 3 and random.random() < 0.85:
            symptoms.append("Mild cramps")
        if in_period and random.random() < 0.3:
            symptoms.append("Headache")
        if in_period and random.random() < 0.3:
            symptoms.append("Bloating")
        # Cramps outside the period (around mid-cycle) show up in the analysis
        if not in_period and 12 <= n <= 16 and random.random() < 0.6:
            symptoms.append("Mild cramps")
        if not in_period and random.random() < 0.08:
            symptoms.append("Headache")
        # Tender breasts and bloating in the days before the next period
        if not in_period and days_until_next <= 5 and random.random() < 0.6:
            symptoms.append("Tender breasts")
            if random.random() < 0.5:
                symptoms.append("Bloating")

        # Moods: low or anxious in the days before and during the period
        if days_until_next <= 4 or (in_period and n <= 1):
            mood = random.choice(["low", "anxious", "anxious", "sensitive"])
        else:
            mood = random.choice(["calm", "calm", "happy", "happy", "sensitive", None])

        notes = ""
        if in_period and n <= 3 and random.random() < 0.35:
            notes = random.choice(NOTES_PERIOD)
        elif not in_period and random.random() < 0.05:
            notes = random.choice(NOTES_OTHER)

        logs[str(day)] = (flow, mood, json.dumps(sorted(set(symptoms))), notes)
        day += timedelta(days=1)

db.execute("DELETE FROM logs")
db.executemany(
    "INSERT INTO logs VALUES (?,?,?,?,?)",
    [(d, *vals) for d, vals in logs.items()],
)
# A demo health profile (for the PCOS pattern check on the Analysis tab)
db.execute("CREATE TABLE IF NOT EXISTS profile(id INTEGER PRIMARY KEY, data TEXT)")
demo_profile = dict(age=24, height_cm=162, weight_kg=76, weight_gain=True, hair_growth=True,
                    skin_darkening=False, hair_loss=True, pimples=True, fast_food=True,
                    regular_exercise=False)
db.execute("INSERT OR REPLACE INTO profile VALUES (1, ?)", (json.dumps(demo_profile),))
db.commit()
print(f"Done! Added {len(logs)} days of demo data ({len(starts)} periods) and a demo health profile.")
