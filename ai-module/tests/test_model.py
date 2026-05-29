from models.asset_decision_model import AssetDecisionModel
from utils.business_rules import apply_business_rules


def test_model_loads(trained_model):
    assert trained_model.model is not None
    assert trained_model.scaler is not None


def test_predict_keys(trained_model):
    asset = {
        "asset_name": "Dell OptiPlex 7090",
        "asset_category": "Desktop Computer",
        "damage_score": 0.4,
        "damage_type": "physical",
        "asset_age_years": 3,
        "expected_lifespan_years": 6,
        "usage_count": 50,
        "estimated_repair_cost_etb": 8000,
        "current_market_price_etb": 55000,
    }
    result = trained_model.predict(asset)
    for key in (
        "decision",
        "confidence",
        "repair_probability",
        "replace_probability",
        "top_features",
        "triggered_rule",
        "explanation",
    ):
        assert key in result


def test_decision_values(trained_model):
    asset = {
        "asset_category": "Laptop",
        "damage_score": 0.3,
        "damage_type": "physical",
        "asset_age_years": 2,
        "expected_lifespan_years": 5,
        "usage_count": 10,
        "estimated_repair_cost_etb": 5000,
        "current_market_price_etb": 75000,
    }
    result = trained_model.predict(asset)
    assert result["decision"] in ("repair", "replace", "manual_review")
    assert 0 <= result["confidence"] <= 1


def test_rule_r2_fires():
    features = {
        "damage_score": 0.5,
        "repair_cost_ratio": 0.80,
        "asset_age_years": 3,
        "expected_lifespan_years": 6,
        "estimated_repair_cost_etb": 40000,
        "current_market_price_etb": 50000,
        "remaining_life_score": 0.5,
    }
    rf = {"decision": "repair", "confidence": 0.9, "explanation": ""}
    out = apply_business_rules(features, rf)
    assert out["decision"] == "replace"
    assert out["triggered_rule"] == "R2"


def test_rule_r1_fires():
    features = {
        "damage_score": 0.95,
        "repair_cost_ratio": 0.2,
        "asset_age_years": 2,
        "expected_lifespan_years": 6,
        "estimated_repair_cost_etb": 5000,
        "current_market_price_etb": 50000,
        "remaining_life_score": 0.6,
    }
    rf = {"decision": "repair", "confidence": 0.9, "explanation": ""}
    out = apply_business_rules(features, rf)
    assert out["decision"] == "replace"
    assert out["triggered_rule"] == "R1"
