"""endo_routes.py: adds the /endo endpoint. Hooked into main.py with two lines at the bottom:
    from endo_routes import register as register_endo
    register_endo(app, all_logs, periods)
"""
from endo_model import assess_endo


def register(app, all_logs, periods):
    @app.get("/endo")
    def endo():
        logs = all_logs()
        if not logs:
            return {"ready": False, "message": "Log a few days to run this check."}
        return {"ready": True, **assess_endo(logs, periods(logs))}
