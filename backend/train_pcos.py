"""train_pcos.py: trains a PCOS pattern model using ONLY things our app can collect.

Run from the backend folder:
    python3 train_pcos.py data/PCOS_data_without_infertility.xlsx

It prints honest accuracy numbers and saves pcos_model.joblib for pcos_model.py to use.
Needs:  pip install scikit-learn pandas openpyxl joblib
"""
import sys
import joblib
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import cross_validate, StratifiedKFold
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.tree import DecisionTreeClassifier

path = sys.argv[1] if len(sys.argv) > 1 else "data/PCOS_data_without_infertility.xlsx"
df = pd.read_excel(path, sheet_name="Full_new")
df.columns = [c.strip() for c in df.columns]

# ---- Map the Kaggle columns to features our app can actually get ----
# NOTE 1: In this dataset, "Cycle length(days)" is really how many days the PERIOD lasted
#         (median 5), not the gap between periods. We use it as period_length.
# NOTE 2: "Cycle(R/I)": 2 = regular, 4 = irregular (one odd row coded 5, treated as irregular).
data = pd.DataFrame({
    "age": df["Age (yrs)"],
    "bmi": df["BMI"],
    "irregular_cycle": (df["Cycle(R/I)"] != 2).astype(int),
    "period_length": df["Cycle length(days)"],
    "weight_gain": df["Weight gain(Y/N)"],
    "hair_growth": df["hair growth(Y/N)"],
    "skin_darkening": df["Skin darkening (Y/N)"],
    "hair_loss": df["Hair loss(Y/N)"],
    "pimples": df["Pimples(Y/N)"],
    "fast_food": df["Fast food (Y/N)"].fillna(0),
    "regular_exercise": df["Reg.Exercise(Y/N)"],
})
y = df["PCOS (Y/N)"]
FEATURES = list(data.columns)

# ---- Compare a few models with 5-fold cross-validation ----
cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=0)
models = {
    "Logistic regression": make_pipeline(StandardScaler(), LogisticRegression(max_iter=1000)),
    "Decision tree (depth 4)": DecisionTreeClassifier(max_depth=4, random_state=0),
}
print(f"{len(data)} patients, {int(y.sum())} with PCOS ({y.mean():.0%}). Features: {FEATURES}\n")
print("Trackable-features only (5-fold cross-validation):")
for name, model in models.items():
    s = cross_validate(model, data, y, cv=cv, scoring=["roc_auc", "recall", "precision"])
    print(f"  {name:26s} AUC {s['test_roc_auc'].mean():.2f}   recall {s['test_recall'].mean():.2f}   precision {s['test_precision'].mean():.2f}")

# ---- For comparison: what if we also had ultrasound follicle counts? ----
with_scan = data.copy()
with_scan["follicles_l"] = df["Follicle No. (L)"]
with_scan["follicles_r"] = df["Follicle No. (R)"]
s = cross_validate(models["Logistic regression"], with_scan, y, cv=cv, scoring=["roc_auc"])
print(f"\nSame model + ultrasound follicle counts: AUC {s['test_roc_auc'].mean():.2f}"
      "  <- why we say 'worth getting checked', not 'you have PCOS'")

# ---- Train the final explainable model on all the data and save it ----
final = make_pipeline(StandardScaler(), LogisticRegression(max_iter=1000))
final.fit(data, y)
joblib.dump({"model": final, "features": FEATURES}, "pcos_model.joblib")

coefs = pd.Series(final[-1].coef_[0], index=FEATURES).sort_values(key=abs, ascending=False)
print("\nWhat the model pays attention to (positive = raises the score):")
for f, c in coefs.items():
    print(f"  {f:18s} {c:+.2f}")
print("\nSaved pcos_model.joblib")
