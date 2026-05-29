"""
SRMS AI Module — Pydantic Schemas
api/schemas.py
"""

from __future__ import annotations
from typing import Any, Optional
from pydantic import BaseModel, Field, field_validator


# ── Allowed values ────────────────────────────────────────────────────────────

VALID_CATEGORIES = [
    "Desktop Computer",
    "Laptop",
    "Projector",
    "Laboratory Equipment",
    "Printer / Copier",
    "Furniture",
    "Network Equipment",
    "Audio/Visual Equipment",
]

VALID_DAMAGE_TYPES = ["physical", "electrical", "software", "structural"]


# ── Request body ──────────────────────────────────────────────────────────────

class AssetDecisionRequest(BaseModel):
    asset_id:                int
    asset_name:              str   = Field(..., min_length=2, max_length=200)
    asset_category:          str
    damage_score:            float = Field(..., ge=0.0, le=1.0)
    damage_type:             str
    asset_age_years:         float = Field(..., ge=0.0)
    expected_lifespan_years: float = Field(..., gt=0.0)
    usage_count:             int   = Field(..., ge=0)
    estimated_repair_cost:   float = Field(..., ge=0.0)
    technician_notes:        Optional[str] = None
    reported_by_user_id:     int

    @field_validator("asset_category")
    @classmethod
    def validate_category(cls, v: str) -> str:
        if v not in VALID_CATEGORIES:
            raise ValueError(
                f"asset_category must be one of: {VALID_CATEGORIES}"
            )
        return v

    @field_validator("damage_type")
    @classmethod
    def validate_damage_type(cls, v: str) -> str:
        if v.lower() not in VALID_DAMAGE_TYPES:
            raise ValueError(
                f"damage_type must be one of: {VALID_DAMAGE_TYPES}"
            )
        return v.lower()


# ── Sub-objects for response ──────────────────────────────────────────────────

class RepairOption(BaseModel):
    estimated_cost_etb:  float
    recommended_vendor:  str
    estimated_days:      int

class ReplaceOption(BaseModel):
    market_price_etb:      float
    source_url:            str
    savings_vs_repair_etb: float
    availability:          bool

class TopFeatureItem(BaseModel):
    feature:    str
    importance: float


# ── Response body ─────────────────────────────────────────────────────────────

class AssetDecisionResponse(BaseModel):
    asset_id:           int
    decision:           str
    confidence:         float
    explanation:        str
    repair_probability: float
    replace_probability:float
    top_features:       list[TopFeatureItem]
    triggered_rule:     Optional[str]
    repair_option:      Optional[RepairOption]
    replace_option:     Optional[ReplaceOption]
    decision_id:        int
    created_at:         str


# ── Feedback ──────────────────────────────────────────────────────────────────

class FeedbackRequest(BaseModel):
    actual_outcome: str

    @field_validator("actual_outcome")
    @classmethod
    def validate_outcome(cls, v: str) -> str:
        allowed = {"repair", "replace"}
        if v.lower() not in allowed:
            raise ValueError(f"actual_outcome must be one of: {allowed}")
        return v.lower()


# ── History item ──────────────────────────────────────────────────────────────

class DecisionHistoryItem(BaseModel):
    decision_id:     int
    asset_id:        int
    decision:        str
    confidence:      float
    triggered_rule:  Optional[str]
    actual_outcome:  Optional[str]
    created_at:      str


# ── Model stats ───────────────────────────────────────────────────────────────

class ModelStatsResponse(BaseModel):
    model_version:     str
    train_date:        str
    n_samples:         int
    accuracy:          float
    f1_macro:          float
    feature_names:     list[str]
    prediction_count:  int
    model_loaded:      bool


# ── Health ────────────────────────────────────────────────────────────────────

class HealthResponse(BaseModel):
    status:        str
    model_loaded:  bool
    db_connected:  bool
    api_reachable: bool
