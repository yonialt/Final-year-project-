import os

from fastapi.testclient import TestClient

os.environ["DATABASE_URL"] = "sqlite:///./test_srms_ai.db"

from main import app
from models.asset_decision_model import AssetDecisionModel

CSV = "data/university_asset_training_data.csv"


def test_health_ok():
    model = AssetDecisionModel()
    model.load()

    from api import routes

    routes.decision_model = model
    routes.market_service = __import__(
        "models.market_price_service", fromlist=["MarketPriceService"]
    ).MarketPriceService()

    client = TestClient(app)
    r = client.get("/health")
    assert r.status_code == 200
    data = r.json()
    assert data["model_loaded"] is True
    assert data["status"] == "ok"


def test_decision_endpoint_200():
    model = AssetDecisionModel()
    model.load()

    from api import routes
    from models.market_price_service import MarketPriceService

    routes.decision_model = model
    routes.market_service = MarketPriceService()

    client = TestClient(app)
    payload = {
        "asset_id": 101,
        "asset_name": "Epson EB-X41",
        "asset_category": "Projector",
        "damage_score": 0.35,
        "damage_type": "physical",
        "asset_age_years": 4,
        "expected_lifespan_years": 8,
        "usage_count": 120,
        "estimated_repair_cost": 4500,
        "technician_notes": "Lens assembly worn",
        "reported_by_user_id": 1,
    }
    r = client.post("/api/v1/asset/decision", json=payload)
    assert r.status_code == 200
    body = r.json()
    assert body["decision"] in ("repair", "replace", "manual_review")
    assert "decision_id" in body


def test_invalid_damage_score_422():
    client = TestClient(app)
    payload = {
        "asset_id": 1,
        "asset_name": "Test",
        "asset_category": "Laptop",
        "damage_score": 1.5,
        "damage_type": "physical",
        "asset_age_years": 1,
        "expected_lifespan_years": 5,
        "usage_count": 0,
        "estimated_repair_cost": 1000,
        "technician_notes": "",
        "reported_by_user_id": 1,
    }
    r = client.post("/api/v1/asset/decision", json=payload)
    assert r.status_code == 422
