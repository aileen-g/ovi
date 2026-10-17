"""pcos_routes.py: adds the health profile + PCOS pattern-check endpoints to the Egg backend.

Hooked in with two lines at the very bottom of main.py:
    from pcos_routes import register
    register(app, db, all_logs, insights)
"""
import json
from pydantic import BaseModel


class Profile(BaseModel):
    age: int
    height_cm: float
    weight_kg: float
    weight_gain: bool = False
    hair_growth: bool = False
    skin_darkening: bool = False
    hair_loss: bool = False
    pimples: bool = False
    fast_food: bool = False
    regular_exercise: bool = False


def register(app, db, all_logs, insights):
    db.execute("CREATE TABLE IF NOT EXISTS profile(id INTEGER PRIMARY KEY, data TEXT)")
    db.commit()

    def load():
        row = db.execute("SELECT data FROM profile WHERE id=1").fetchone()
        return json.loads(row[0]) if row else None

    @app.get("/profile")
    def get_profile():
        return load() or {}

    @app.put("/profile")
    def put_profile(p: Profile):
        data = p.model_dump() if hasattr(p, "model_dump") else p.dict()
        db.execute("INSERT OR REPLACE INTO profile VALUES (1, ?)", (json.dumps(data),))
        db.commit()
        return {"ok": True}

    @app.get("/pcos")
    def pcos():
        profile = load()
        if not profile:
            return {"ready": False, "message": "Fill in your health profile to unlock this check."}
        try:
            from pcos_model import assess_pcos
        except Exception:
            return {"ready": False, "message": "The PCOS model isn't trained yet. Run train_pcos.py in the backend folder."}

        # Two of the model's inputs are CALCULATED from the user's logs, not self-reported.
        ins = insights()
        cycles, avg_period = ins["cycle_lengths"], ins["avg_period"]
        if len(cycles) >= 2:
            irregular = int(max(cycles) - min(cycles) > 7 or max(cycles) > 35 or min(cycles) < 21)
            note = f"Cycle regularity was calculated from your logs (cycle lengths: {', '.join(map(str, cycles))} days)."
        else:
            irregular = 0
            note = "Not enough logged cycles yet to judge regularity, so it was counted as regular. Keep logging."

        bmi = profile["weight_kg"] / ((profile["height_cm"] / 100) ** 2)
        features = {
            "age": profile["age"], "bmi": round(bmi, 1),
            "irregular_cycle": irregular, "period_length": avg_period or 5,
            **{k: int(profile[k]) for k in ["weight_gain", "hair_growth", "skin_darkening",
                                            "hair_loss", "pimples", "fast_food", "regular_exercise"]},
        }
        result = assess_pcos(features)
        return {"ready": True, **result, "data_note": note}
