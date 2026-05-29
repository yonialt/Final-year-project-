"""
SRMS AI Module — Business Rules Override Layer
utils/business_rules.py

Rules run AFTER the Random Forest prediction.
First matching rule wins (R1 → R6).
"""

from typing import Any


# ── Rule definitions ──────────────────────────────────────────────────────────

RULES = [
    {
        "id":    "R1",
        "label": "Critical damage — asset non-functional",
        "check": lambda f: f["damage_score"] >= 0.90,
        "force": "replace",
    },
    {
        "id":    "R2",
        "label": "Repair cost exceeds 75% of replacement value",
        "check": lambda f: f["repair_cost_ratio"] >= 0.75,
        "force": "replace",
    },
    {
        "id":    "R3",
        "label": "Asset has exceeded expected lifespan by 20%",
        "check": lambda f: f["asset_age_years"] > f["expected_lifespan_years"] * 1.2,
        "force": "replace",
    },
    {
        "id":    "R4",
        "label": "Repair cost equals or exceeds purchase price",
        "check": lambda f: f.get("estimated_repair_cost_etb", 0)
                          >= f.get("current_market_price_etb", float("inf")),
        "force": "replace",
    },
    {
        "id":    "R5",
        "label": "Less than 5% useful life remaining",
        "check": lambda f: f.get("remaining_life_score", 1.0) <= 0.05,
        "force": "replace",
    },
    {
        "id":    "R6",
        "label": "Model confidence below threshold",
        "check": lambda f, rf: rf.get("confidence", 1.0) < 0.55,
        "force": "manual_review",
        "uses_rf": True,
    },
]


def apply_business_rules(
    features: dict[str, Any],
    rf_result: dict[str, Any],
) -> dict[str, Any]:
    """
    Evaluate hard business rules against asset features and RF output.

    Parameters
    ----------
    features : dict
        Asset attribute dictionary (same keys as API request body).
        Must include at minimum:
          - damage_score
          - repair_cost_ratio
          - asset_age_years
          - expected_lifespan_years
          - estimated_repair_cost_etb (or estimated_repair_cost)
          - current_market_price_etb  (or current_market_price)
          - remaining_life_score
    rf_result : dict
        Output of AssetDecisionModel._raw_rf_predict(), must include:
          - decision (str)
          - confidence (float)
          - repair_probability (float)
          - replace_probability (float)
          - top_features (list)

    Returns
    -------
    dict
        Updated result dict with:
          - decision (str)       — possibly overridden
          - triggered_rule (str) — rule ID + label, or None
        All other RF keys are preserved.
    """
    result = dict(rf_result)

    # Normalize cost keys so rules work with both API schema and CSV schema
    features = dict(features)
    if "estimated_repair_cost" in features and "estimated_repair_cost_etb" not in features:
        features["estimated_repair_cost_etb"] = features["estimated_repair_cost"]
    if "current_market_price" in features and "current_market_price_etb" not in features:
        features["current_market_price_etb"] = features["current_market_price"]

    # Derive remaining_life_score if missing
    if "remaining_life_score" not in features:
        age     = float(features.get("asset_age_years", 0))
        lifespan = float(features.get("expected_lifespan_years", 1))
        features["remaining_life_score"] = max(0.0, 1.0 - age / lifespan)

    triggered: str | None = None

    for rule in RULES:
        try:
            if rule.get("uses_rf"):
                fired = rule["check"](features, rf_result)
            else:
                fired = rule["check"](features)
        except (KeyError, ZeroDivisionError, TypeError):
            fired = False

        if fired:
            result["decision"]      = rule["force"]
            result["triggered_rule"] = f"{rule['id']}: {rule['label']}"
            triggered = result["triggered_rule"]
            break

    if not triggered:
        result["triggered_rule"] = None

    return result
