"""endo_model.py: endometriosis PATTERN check, built from published odds ratios.

Unlike the PCOS check (trained on a dataset), there is no open dataset that has symptoms for
women with and without endometriosis. So the weights come from a published UK primary-care
case-control study ("Can symptomatology help in the diagnosis of endometriosis? Findings from a
national case-control study": 5,540 women with diagnosed endometriosis vs matched controls)

https://researchportal.bath.ac.uk/en/publications/can-symptomatology-help-in-the-diagnosis-of-endometriosis-finding/

.

It is still a logistic model: start from the baseline risk, then each symptom pattern that shows up
in the user's logs multiplies the odds by that symptom's odds ratio (adding ln(OR) in log-odds).
Every weight can be traced to the paper, and every result can be explained.

IMPORTANT: the study used doctors' recorded diagnoses, not self-logged app entries, and it only
included people who sought care. So we never show a percentage. We show a similarity level.
"""
import math

BASE_PREVALENCE = 0.015  # diagnosed endometriosis in the study's population

# signal: (odds ratio from the study, label shown to the user)
SIGNALS = {
    "dysmenorrhea": (8.1, "Severe period pain"),
    "sex_pain":     (6.8, "Pain during sex"),
    "pelvic_pain":  (5.2, "Pelvic pain"),
    "menorrhagia":  (4.0, "Heavy periods"),
}

# Hackathon-chosen cut-offs (change them here)
MIN_CYCLES_WITH_HEAVY_CRAMPS = 2   # severe period pain must show up in at least 2 periods
MIN_PELVIC_PAIN_DAYS = 3           # "Pelvic pain" logged on at least 3 days...
MIN_OFF_PERIOD_CRAMP_DAYS = 4      # ...or cramps on at least 4 days outside the period
MIN_SEX_PAIN_DAYS = 2              # "Pain during sex" logged on at least 2 days
HEAVY_FLOW_SHARE = 0.4             # heavy flow on 40%+ of period days (with 4+ period days)
LONG_PERIOD_DAYS = 7               # ...or periods averaging more than 7 days
LOWER_BELOW, HIGHER_FROM = 0.08, 0.30  # similarity levels


def detect_signals(logs: dict, runs: list) -> dict:
    """Returns {signal: evidence sentence} for each pattern found in the logs."""
    period_days = {d for r in runs for d in r}
    has = lambda d, s: s in logs[d]["symptoms"]
    cramp = lambda d: has(d, "Mild cramps") or has(d, "Heavy cramps")
    found = {}

    # 1. Severe period pain: heavy cramps during the period, in several different periods
    periods_with_heavy = sum(any(has(d, "Heavy cramps") for d in r) for r in runs)
    if periods_with_heavy >= MIN_CYCLES_WITH_HEAVY_CRAMPS:
        found["dysmenorrhea"] = f"Heavy cramps during {periods_with_heavy} of your {len(runs)} periods"

    # 2. Pelvic pain: logged directly, or cramps repeatedly outside the period
    pelvic_days = [d for d in logs if has(d, "Pelvic pain")]
    off_cramps = [d for d in logs if d not in period_days and cramp(d)]
    if len(pelvic_days) >= MIN_PELVIC_PAIN_DAYS:
        found["pelvic_pain"] = f"Pelvic pain logged on {len(pelvic_days)} days"
    elif len(off_cramps) >= MIN_OFF_PERIOD_CRAMP_DAYS:
        found["pelvic_pain"] = f"Cramps on {len(off_cramps)} days outside your period"

    # 3. Pain during sex
    sex_days = [d for d in logs if has(d, "Pain during sex")]
    if len(sex_days) >= MIN_SEX_PAIN_DAYS:
        found["sex_pain"] = f"Pain during sex logged on {len(sex_days)} days"

    # 4. Heavy periods: lots of heavy-flow days, or long periods
    n_pd = len(period_days)
    heavy_share = sum(logs[d]["flow"] == "heavy" for d in period_days) / n_pd if n_pd else 0
    avg_len = sum(len(r) for r in runs) / len(runs) if runs else 0
    if n_pd >= 4 and heavy_share >= HEAVY_FLOW_SHARE:
        found["menorrhagia"] = f"Heavy flow on {round(heavy_share * 100)}% of your period days"
    elif avg_len > LONG_PERIOD_DAYS:
        found["menorrhagia"] = f"Periods averaging {avg_len:.0f} days"
    return found


def assess_endo(logs: dict, runs: list) -> dict:
    found = detect_signals(logs, runs)

    log_odds = math.log(BASE_PREVALENCE / (1 - BASE_PREVALENCE))
    for key in found:
        log_odds += math.log(SIGNALS[key][0])
    score = 1 / (1 + math.exp(-log_odds))
    level = "lower" if score < LOWER_BELOW else "moderate" if score < HIGHER_FROM else "higher"

    raising = sorted(found, key=lambda k: SIGNALS[k][0], reverse=True)
    if len(runs) < 2:
        data_note = "You've logged fewer than 2 periods so far, so patterns across cycles can't be judged yet."
    else:
        data_note = f"Based on {len(logs)} logged days across {len(runs)} periods."
    return {
        "level": level,
        "score": round(score, 3),
        "reasons_raising": [{"factor": SIGNALS[k][1], "evidence": found[k]} for k in raising],
        "not_seen": [SIGNALS[k][1] for k in SIGNALS if k not in found],
        "data_note": data_note,
        "note": "This compares your logged symptoms with patterns reported in women diagnosed with endometriosis. "
                "It is not a diagnosis. Endometriosis is confirmed by a clinician, often with imaging or surgery.",
    }
