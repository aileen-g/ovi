"""pcos_model.py: loads the trained model and explains each prediction.

    from pcos_model import assess_pcos
    result = assess_pcos({...profile...})

IMPORTANT: the training data came from a clinic where ~1 in 3 patients had PCOS. Real-world
rates are much lower, so the score is NOT "your chance of having PCOS". We show a pattern-match
level instead: "similar to patterns seen in clinic patients who had PCOS

Dataset:
author = {Prasoon Kottarathil},
title = {Polycystic ovary syndrome (PCOS)},
year = {2020},
publisher = {kaggle},
journal = {Kaggle Dataset},
how published = {\url{https://www.kaggle.com/prasoonkottarathil/polycystic-ovary-syndrome-pcos}}

".
"""
import os
import joblib
import pandas as pd

_HERE = os.path.dirname(os.path.abspath(__file__))
_bundle = joblib.load(os.path.join(_HERE, "pcos_model.joblib"))
MODEL, FEATURES = _bundle["model"], _bundle["features"]

LABELS = {
    "age": "Age", "bmi": "Body mass index",
    "irregular_cycle": "Irregular cycles (calculated from your logs)",
    "period_length": "Period length", "weight_gain": "Recent weight gain",
    "hair_growth": "Excess hair growth (face/body)", "skin_darkening": "Dark skin patches",
    "hair_loss": "Hair thinning or loss", "pimples": "Acne", "fast_food": "Frequent fast food",
    "regular_exercise": "Regular exercise",
}


def assess_pcos(profile: dict) -> dict:
    """profile: dict with the 11 FEATURES as numbers (yes/no questions are 1 or 0)."""
    row = pd.DataFrame([[float(profile.get(f, 0)) for f in FEATURES]], columns=FEATURES)
    score = float(MODEL.predict_proba(row)[0][1])

    # Explain: each feature's push on the score, relative to the average patient
    scaler, lr = MODEL[0], MODEL[-1]
    z = scaler.transform(row)[0]
    pushes = sorted(zip(FEATURES, lr.coef_[0] * z), key=lambda p: p[1], reverse=True)
    raising = [{"factor": LABELS[f], "push": round(v, 2)} for f, v in pushes if v > 0.15][:4]
    lowering = [{"factor": LABELS[f], "push": round(v, 2)} for f, v in reversed(pushes) if v < -0.15][:2]

    level = "lower" if score < 0.3 else "moderate" if score < 0.6 else "higher"  # hackathon thresholds
    return {
        "level": level,
        "score": round(score, 2),
        "reasons_raising": raising,
        "reasons_lowering": lowering,
        "note": "This compares your patterns with clinic patients. It is not a diagnosis. "
                "PCOS is confirmed with a clinician, usually using blood tests and/or an ultrasound.",
    }


if __name__ == "__main__":
    import json
    example = dict(age=24, bmi=29, irregular_cycle=1, period_length=3, weight_gain=1,
                   hair_growth=1, skin_darkening=1, hair_loss=1, pimples=1, fast_food=1,
                   regular_exercise=0)
    print(json.dumps(assess_pcos(example), indent=2))
