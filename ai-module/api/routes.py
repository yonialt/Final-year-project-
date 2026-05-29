"""FastAPI routes — STEP 7 & 8."""

from __future__ import annotations

import json
import logging
import os
import shutil
import threading
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from api.schemas import (
    AssetDecisionRequest,
    AssetDecisionResponse,
    FeedbackRequest,
    HealthResponse,
    RepairOption,
    ReplaceOption,
)
from db.database import (
    AssetDecisionRecord,
    DecisionFeedback,
    ModelTrainingLog,
    check_db_connected,
    get_db,
    init_db,
)
from models.asset_decision_model import AssetDecisionModel
from models.market_price_service import MarketPriceService
from utils.feature_engineering import asset_to_feature_dict

logger = logging.getLogger(__name__)

router = APIRouter()

ROOT = Path(__file__).resolve().parent.parent
CSV_PATH = ROOT / "data" / "university_asset_training_data.csv"
MODEL_DIR = ROOT / "trained_models"

# Shared singletons (set from main.py)
decision_model: AssetDecisionModel | None = None
market_service: MarketPriceService | None = None
_prediction_count = 0
_retrain_lock = threading.Lock()


def set_services(model: AssetDecisionModel, market: MarketPriceService) -> None:
    global decision_model, market_service
    decision_model = model
    market_service = market


VENDOR_BY_CATEGORY = {
    "Desktop Computer": "UoG IT Procurement",
    "Laptop": "UoG IT Procurement",
    "Projector": "Campus AV Services",
    "Laboratory Equipment": "Science Equipment Office",
    "Printer / Copier": "Document Services",
    "Furniture": "Facilities Management",
    "Network Equipment": "Network Operations Center",
    "Audio/Visual Equipment": "Campus AV Services",
}


def retrain_model_background() -> None:
    def _run():
        with _retrain_lock:
            try:
                if not CSV_PATH.exists():
                    logger.error("Cannot retrain: CSV missing")
                    return
                # Archive current model
                rf = MODEL_DIR / "asset_decision_rf.pkl"
                if rf.exists():
                    n = len(list(MODEL_DIR.glob("asset_decision_rf_v*.pkl"))) + 1
                    shutil.copy(rf, MODEL_DIR / f"asset_decision_rf_v{n}.pkl")

                model = AssetDecisionModel()
                meta = model.train_from_csv(str(CSV_PATH))
                global decision_model
                decision_model = model

                from db.database import SessionLocal

                if SessionLocal:
                    db = SessionLocal()
                    try:
                        db.add(
                            ModelTrainingLog(
                                model_version=meta.get("model_version", "1.0.0"),
                                n_samples=meta.get("n_samples"),
                                accuracy=meta.get("accuracy"),
                                f1=meta.get("f1"),
                                notes="Auto-retrain triggered by feedback threshold",
                            )
                        )
                        db.commit()
                    finally:
                        db.close()
                logger.info("Background retrain completed")
            except Exception as exc:
                logger.exception("Background retrain failed: %s", exc)

    threading.Thread(target=_run, daemon=True).start()


@router.get("/health", response_model=HealthResponse)
def health():
    model_ok = bool(decision_model and decision_model.model)
    db_ok = check_db_connected()
    all_ok = model_ok and db_ok
    return HealthResponse(
        status="ok" if all_ok else "degraded",
        model_loaded=model_ok,
        database_connected=db_ok,
        market_api_configured=bool(os.getenv("MARKET_API_BASE_URL")),
    )


@router.post("/api/v1/asset/decision", response_model=AssetDecisionResponse)
def create_decision(body: AssetDecisionRequest, db: Session = Depends(get_db)):
    global _prediction_count
    if not decision_model or not decision_model.model:
        raise HTTPException(status_code=503, detail="ML model not loaded")

    price_data = market_service.get_current_price(body.asset_name, body.asset_category)
    market_price = float(price_data["price"])

    asset = {
        "asset_id": body.asset_id,
        "asset_name": body.asset_name,
        "asset_category": body.asset_category,
        "damage_score": body.damage_score,
        "damage_type": body.damage_type,
        "asset_age_years": body.asset_age_years,
        "expected_lifespan_years": body.expected_lifespan_years,
        "usage_count": body.usage_count,
        "estimated_repair_cost_etb": body.estimated_repair_cost,
        "current_market_price_etb": market_price,
    }

    result = decision_model.predict(asset)
    features = asset_to_feature_dict(asset, market_price=market_price)
    decision = result["decision"]
    repair_cost = body.estimated_repair_cost

    repair_option = None
    replace_option = None
    if decision == "repair":
        repair_option = RepairOption(
            estimated_cost_etb=repair_cost,
            recommended_vendor=VENDOR_BY_CATEGORY.get(body.asset_category, "UoG Maintenance"),
            estimated_days=max(1, int(repair_cost / 5000) + 1),
        )
    elif decision == "replace":
        replace_option = ReplaceOption(
            market_price_etb=market_price,
            source_url=price_data.get("source_url", ""),
            savings_vs_repair_etb=round(max(0, market_price - repair_cost), 2),
            availability=bool(price_data.get("availability", True)),
        )

    created = datetime.now(timezone.utc).isoformat()
    record = AssetDecisionRecord(
        asset_id=body.asset_id,
        asset_name=body.asset_name,
        asset_category=body.asset_category,
        decision=decision,
        confidence=result["confidence"],
        explanation=result["explanation"],
        repair_probability=result["repair_probability"],
        replace_probability=result["replace_probability"],
        top_features_json=json.dumps(result["top_features"]),
        triggered_rule=result.get("triggered_rule"),
        repair_cost_etb=repair_cost,
        market_price_etb=market_price,
        technician_notes=body.technician_notes,
        reported_by_user_id=body.reported_by_user_id,
        response_json=json.dumps({"features": features}),
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    _prediction_count += 1

    return AssetDecisionResponse(
        asset_id=body.asset_id,
        decision=decision,
        confidence=result["confidence"],
        explanation=result["explanation"],
        repair_probability=result["repair_probability"],
        replace_probability=result["replace_probability"],
        top_features=result["top_features"],
        triggered_rule=result.get("triggered_rule"),
        repair_option=repair_option,
        replace_option=replace_option,
        decision_id=record.id,
        created_at=created,
    )


@router.get("/api/v1/asset/decision/history")
def decision_history(asset_id: int = Query(...), db: Session = Depends(get_db)):
    rows = (
        db.query(AssetDecisionRecord)
        .filter(AssetDecisionRecord.asset_id == asset_id)
        .order_by(AssetDecisionRecord.created_at.desc())
        .limit(50)
        .all()
    )
    return {
        "asset_id": asset_id,
        "count": len(rows),
        "decisions": [
            {
                "decision_id": r.id,
                "decision": r.decision,
                "confidence": r.confidence,
                "explanation": r.explanation,
                "created_at": r.created_at.isoformat() if r.created_at else None,
            }
            for r in rows
        ],
    }


@router.post("/api/v1/asset/decision/{decision_id}/feedback")
def submit_feedback(decision_id: int, body: FeedbackRequest, db: Session = Depends(get_db)):
    record = db.query(AssetDecisionRecord).filter(AssetDecisionRecord.id == decision_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Decision not found")

    fb = DecisionFeedback(
        decision_id=decision_id,
        actual_outcome=body.actual_outcome,
        processed=False,
    )
    db.add(fb)
    db.commit()

    unprocessed = db.query(DecisionFeedback).filter(DecisionFeedback.processed == False).count()  # noqa: E712
    if unprocessed >= 50:
        # Mark as processed when retrain starts
        db.query(DecisionFeedback).filter(DecisionFeedback.processed == False).update(  # noqa: E712
            {"processed": True}
        )
        db.commit()
        retrain_model_background()

    return {"message": "Feedback recorded", "decision_id": decision_id, "pending_retrain": unprocessed >= 50}


@router.get("/api/v1/model/stats")
def model_stats(db: Session = Depends(get_db)):
    meta = decision_model.metadata if decision_model else {}
    total_decisions = db.query(AssetDecisionRecord).count()
    feedback_count = db.query(DecisionFeedback).count()
    training_logs = db.query(ModelTrainingLog).order_by(ModelTrainingLog.created_at.desc()).limit(5).all()

    return {
        "training_metadata": meta,
        "prediction_count": _prediction_count,
        "total_decisions_stored": total_decisions,
        "feedback_count": feedback_count,
        "recent_training_logs": [
            {
                "id": log.id,
                "model_version": log.model_version,
                "accuracy": log.accuracy,
                "f1": log.f1,
                "created_at": log.created_at.isoformat() if log.created_at else None,
            }
            for log in training_logs
        ],
    }
