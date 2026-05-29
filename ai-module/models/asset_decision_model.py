"""
SRMS AI Module — Asset Decision Model (Random Forest Classifier)
models/asset_decision_model.py

Usage:
  from models.asset_decision_model import AssetDecisionModel
  m = AssetDecisionModel()
  m.train_from_csv("data/university_asset_training_data.csv")
  result = m.predict({...})
"""

import os
import json
import joblib
import datetime
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")           # non-interactive backend for servers
import matplotlib.pyplot as plt
import seaborn as sns

from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    classification_report, confusion_matrix, roc_curve, auc,
)

# ── Sibling imports ──────────────────────────────────────────────────────────
import sys
_MODULE_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _MODULE_ROOT not in sys.path:
    sys.path.insert(0, _MODULE_ROOT)

from utils.data_loader import load_and_validate_dataset
from utils.feature_engineering import build_feature_vector, get_feature_names
from utils.business_rules import apply_business_rules

# ── Paths ─────────────────────────────────────────────────────────────────────
_MODULE_DIR    = os.path.dirname(os.path.abspath(__file__))
_ROOT          = os.path.dirname(_MODULE_DIR)
MODELS_DIR     = os.path.join(_ROOT, "trained_models")
REPORTS_DIR    = os.path.join(_ROOT, "reports")

MODEL_PATH     = os.path.join(MODELS_DIR, "asset_decision_rf.pkl")
ENC_DMG_PATH   = os.path.join(MODELS_DIR, "label_encoder_damage.pkl")
ENC_CAT_PATH   = os.path.join(MODELS_DIR, "label_encoder_category.pkl")
SCALER_PATH    = os.path.join(MODELS_DIR, "scaler.pkl")
METADATA_PATH  = os.path.join(MODELS_DIR, "training_metadata.json")

FEATURE_COLS = [
    "damage_score",
    "damage_type_encoded",
    "asset_age_years",
    "usage_count",
    "estimated_repair_cost_etb",
    "current_market_price_etb",
    "repair_cost_ratio",
    "age_damage_product",
    "remaining_life_score",
    "price_delta_pct",
    "category_encoded",
]

LABEL_COL = "decision"


class AssetDecisionModel:
    """
    Wrapper around a scikit-learn Random Forest for REPAIR/REPLACE decisions.

    Lifecycle:
      1. train_from_csv(csv_path) → trains + saves artefacts
      2. load()                   → loads artefacts for inference
      3. predict(asset_dict)      → returns decision dict
    """

    def __init__(self):
        self.model:    RandomForestClassifier | None = None
        self.scaler:   StandardScaler | None         = None
        self.enc_dmg:  LabelEncoder | None           = None
        self.enc_cat:  LabelEncoder | None           = None
        self.metadata: dict | None                   = None
        self._loaded   = False
        self._pred_count = 0

        # Auto-load if artefacts exist
        if all(os.path.exists(p) for p in [MODEL_PATH, SCALER_PATH]):
            try:
                self.load()
            except Exception as e:
                print(f"[AssetDecisionModel] ⚠️  Auto-load failed: {e}")

    # ── Training ──────────────────────────────────────────────────────────────

    def train_from_csv(self, csv_path: str) -> dict:
        """
        Full training pipeline from CSV → serialised artefacts.

        Returns
        -------
        dict with accuracy and f1 scores.
        """
        os.makedirs(MODELS_DIR, exist_ok=True)
        os.makedirs(REPORTS_DIR, exist_ok=True)

        # a) Load & validate
        df = load_and_validate_dataset(csv_path)

        # b) Encode categorical columns
        self.enc_dmg = LabelEncoder()
        self.enc_cat = LabelEncoder()
        df["damage_type_encoded"] = self.enc_dmg.fit_transform(df["damage_type"])
        df["category_encoded"]    = self.enc_cat.fit_transform(df["asset_category"])

        # c) Split
        X = df[FEATURE_COLS].values
        y = df[LABEL_COL].values
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )

        # d) Scale
        self.scaler = StandardScaler()
        X_train_sc = self.scaler.fit_transform(X_train)
        X_test_sc  = self.scaler.transform(X_test)

        # e) Train RF
        self.model = RandomForestClassifier(
            n_estimators      = 200,
            max_depth         = 12,
            min_samples_split = 4,
            min_samples_leaf  = 2,
            class_weight      = "balanced",
            random_state      = 42,
            n_jobs            = -1,
        )
        self.model.fit(X_train_sc, y_train)

        # f) Evaluate
        y_pred  = self.model.predict(X_test_sc)
        y_proba = self.model.predict_proba(X_test_sc)[:, 1]

        accuracy  = float(accuracy_score(y_test, y_pred))
        precision = float(precision_score(y_test, y_pred, average="macro", zero_division=0))
        recall    = float(recall_score(y_test, y_pred, average="macro", zero_division=0))
        f1        = float(f1_score(y_test, y_pred, average="macro", zero_division=0))
        cm        = confusion_matrix(y_test, y_pred)

        print("\n" + "=" * 60)
        print("SRMS AI Model — Training Results")
        print("=" * 60)
        print(f"  Training samples : {len(X_train)}")
        print(f"  Test samples     : {len(X_test)}")
        print(f"  Accuracy         : {accuracy:.4f}  ({accuracy*100:.1f}%)")
        print(f"  Precision (macro): {precision:.4f}")
        print(f"  Recall    (macro): {recall:.4f}")
        print(f"  F1        (macro): {f1:.4f}")
        print("\nConfusion Matrix:")
        print(f"  TN={cm[0,0]}  FP={cm[0,1]}")
        print(f"  FN={cm[1,0]}  TP={cm[1,1]}")
        print("\nClassification Report:")
        print(classification_report(y_test, y_pred,
              target_names=["REPAIR", "REPLACE"]))

        # g) Save artefacts
        joblib.dump(self.model,    MODEL_PATH)
        joblib.dump(self.enc_dmg,  ENC_DMG_PATH)
        joblib.dump(self.enc_cat,  ENC_CAT_PATH)
        joblib.dump(self.scaler,   SCALER_PATH)

        # h) Training metadata
        self.metadata = {
            "train_date":    datetime.datetime.utcnow().isoformat() + "Z",
            "n_samples":     int(len(df)),
            "n_train":       int(len(X_train)),
            "n_test":        int(len(X_test)),
            "accuracy":      round(accuracy, 6),
            "f1_macro":      round(f1, 6),
            "precision":     round(precision, 6),
            "recall":        round(recall, 6),
            "feature_names": FEATURE_COLS,
            "model_version": "1.0.0",
            "n_estimators":  200,
            "max_depth":     12,
        }
        with open(METADATA_PATH, "w", encoding="utf-8") as fp:
            json.dump(self.metadata, fp, indent=2)

        # i) Plots
        self._plot_feature_importances()
        self._plot_confusion_matrix(cm)
        self._plot_roc_curve(y_test, y_proba)

        self._loaded = True
        print("\n✅  Model trained and saved successfully.")
        print(f"    Artefacts in : {MODELS_DIR}")
        print(f"    Reports in   : {REPORTS_DIR}")

        return {"accuracy": accuracy, "f1": f1}

    # ── Persistence ───────────────────────────────────────────────────────────

    def load(self):
        """Load all saved artefacts from disk."""
        self.model   = joblib.load(MODEL_PATH)
        self.scaler  = joblib.load(SCALER_PATH)

        if os.path.exists(ENC_DMG_PATH):
            self.enc_dmg = joblib.load(ENC_DMG_PATH)
        if os.path.exists(ENC_CAT_PATH):
            self.enc_cat = joblib.load(ENC_CAT_PATH)
        if os.path.exists(METADATA_PATH):
            with open(METADATA_PATH, "r", encoding="utf-8") as fp:
                self.metadata = json.load(fp)

        self._loaded = True
        print(f"[AssetDecisionModel] ✅ Model loaded (v{self.metadata.get('model_version','?')})")

    # ── Prediction ────────────────────────────────────────────────────────────

    def _raw_rf_predict(self, asset: dict) -> dict:
        """Run RF and return raw probabilities + top features. No business rules."""
        if not self._loaded or self.model is None:
            raise RuntimeError("Model not loaded. Call load() or train_from_csv() first.")

        vec = build_feature_vector(asset)         # shape (1, 11)
        vec_sc = self.scaler.transform(vec)       # scaled

        proba      = self.model.predict_proba(vec_sc)[0]
        pred_class = int(self.model.predict(vec_sc)[0])

        repair_prob  = float(proba[0])
        replace_prob = float(proba[1])
        confidence   = float(max(proba))
        decision     = "repair" if pred_class == 0 else "replace"

        # Top 3 feature importances
        importances = self.model.feature_importances_
        feat_imp = sorted(
            zip(FEATURE_COLS, importances),
            key=lambda x: -x[1],
        )[:3]
        top_features = [
            {"feature": name, "importance": round(float(imp), 4)}
            for name, imp in feat_imp
        ]

        return {
            "decision":           decision,
            "confidence":         round(confidence, 4),
            "repair_probability": round(repair_prob, 4),
            "replace_probability":round(replace_prob, 4),
            "top_features":       top_features,
        }

    def predict(self, asset: dict) -> dict:
        """
        Full inference pipeline: RF → business rules override → explanation.

        Parameters
        ----------
        asset : dict  (keys match API schema fields)

        Returns
        -------
        dict with keys:
          decision, confidence, repair_probability, replace_probability,
          top_features, triggered_rule, explanation
        """
        raw = self._raw_rf_predict(asset)
        result = apply_business_rules(asset, raw)

        # ── Human-readable explanation ─────────────────────────────────
        decision    = result["decision"]
        confidence  = result["confidence"]
        top_feats   = result["top_features"]
        rule_fired  = result.get("triggered_rule")
        repair_cost = float(
            asset.get("estimated_repair_cost_etb")
            or asset.get("estimated_repair_cost", 0)
        )
        market_price = float(
            asset.get("current_market_price_etb")
            or asset.get("current_market_price", 1)
        )
        cost_pct = repair_cost / market_price * 100 if market_price > 0 else 0
        age      = float(asset.get("asset_age_years", 0))
        lifespan = float(asset.get("expected_lifespan_years", 7))
        life_rem = max(0.0, lifespan - age)

        if rule_fired:
            explanation = (
                f"{'Replace' if decision == 'replace' else 'Manual review'} required "
                f"due to business rule: {rule_fired}. "
                f"Repair cost is {cost_pct:.1f}% of market price."
            )
        elif decision == "repair":
            explanation = (
                f"Repair recommended with {confidence*100:.0f}% confidence. "
                f"Main factors: {', '.join(f['feature'] for f in top_feats)}. "
                f"Repair cost is {cost_pct:.1f}% of market value; "
                f"asset has {life_rem:.1f} years of expected life remaining."
            )
        else:
            explanation = (
                f"Replace recommended with {confidence*100:.0f}% confidence. "
                f"Main factors: {', '.join(f['feature'] for f in top_feats)}. "
                f"Repair cost ({cost_pct:.1f}% of market value) and/or "
                f"asset age ({age:.1f} yrs vs {lifespan:.0f}-yr lifespan) "
                f"make replacement more cost-effective."
            )

        result["explanation"] = explanation
        self._pred_count += 1
        return result

    # ── Plots ─────────────────────────────────────────────────────────────────

    def _plot_feature_importances(self):
        importances = self.model.feature_importances_
        feat_imp = sorted(zip(FEATURE_COLS, importances), key=lambda x: x[1])
        names = [x[0] for x in feat_imp]
        vals  = [x[1] for x in feat_imp]

        fig, ax = plt.subplots(figsize=(10, 6))
        ax.barh(names, vals, color="#4f8af7")
        ax.set_xlabel("Feature Importance")
        ax.set_title("Random Forest — Feature Importances")
        ax.set_xlim(0, max(vals) * 1.15)
        for i, v in enumerate(vals):
            ax.text(v + 0.001, i, f"{v:.4f}", va="center", fontsize=9)
        plt.tight_layout()
        plt.savefig(os.path.join(REPORTS_DIR, "feature_importances.png"), dpi=150)
        plt.close(fig)
        print(f"  📊  Saved: reports/feature_importances.png")

    def _plot_confusion_matrix(self, cm: np.ndarray):
        fig, ax = plt.subplots(figsize=(6, 5))
        sns.heatmap(
            cm, annot=True, fmt="d", cmap="Blues",
            xticklabels=["REPAIR", "REPLACE"],
            yticklabels=["REPAIR", "REPLACE"],
            ax=ax,
        )
        ax.set_ylabel("True label")
        ax.set_xlabel("Predicted label")
        ax.set_title("Confusion Matrix")
        plt.tight_layout()
        plt.savefig(os.path.join(REPORTS_DIR, "confusion_matrix.png"), dpi=150)
        plt.close(fig)
        print(f"  📊  Saved: reports/confusion_matrix.png")

    def _plot_roc_curve(self, y_true: np.ndarray, y_scores: np.ndarray):
        fpr, tpr, _ = roc_curve(y_true, y_scores)
        roc_auc     = auc(fpr, tpr)

        fig, ax = plt.subplots(figsize=(7, 5))
        ax.plot(fpr, tpr, color="#4f8af7", lw=2,
                label=f"ROC curve (AUC = {roc_auc:.4f})")
        ax.plot([0, 1], [0, 1], color="gray", linestyle="--", lw=1)
        ax.set_xlabel("False Positive Rate")
        ax.set_ylabel("True Positive Rate")
        ax.set_title("ROC Curve — Asset Decision Model")
        ax.legend(loc="lower right")
        plt.tight_layout()
        plt.savefig(os.path.join(REPORTS_DIR, "roc_curve.png"), dpi=150)
        plt.close(fig)
        print(f"  📊  Saved: reports/roc_curve.png")

    # ── Stats ──────────────────────────────────────────────────────────────────

    def get_stats(self) -> dict:
        """Return training metadata merged with runtime prediction count."""
        meta = dict(self.metadata) if self.metadata else {}
        meta["prediction_count"] = self._pred_count
        meta["model_loaded"]     = self._loaded
        return meta
