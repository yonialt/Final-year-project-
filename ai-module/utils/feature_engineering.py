"""
SRMS AI Module — Feature Engineering
utils/feature_engineering.py
"""

import numpy as np
from typing import Any

# ── Ordered category labels (must match LabelEncoder fitted order) ─────────────
CATEGORY_ORDER = [
    "Audio/Visual Equipment",
    "Desktop Computer",
    "Furniture",
    "Laboratory Equipment",
    "Laptop",
    "Network Equipment",
    "Printer / Copier",
    "Projector",
]

DAMAGE_TYPE_ORDER = ["electrical", "physical", "software", "structural"]

# Maps for deterministic encoding (mirrors LabelEncoder alphabetical fit)
DAMAGE_TYPE_MAP: dict[str, int] = {v: i for i, v in enumerate(DAMAGE_TYPE_ORDER)}
CATEGORY_MAP:    dict[str, int] = {v: i for i, v in enumerate(CATEGORY_ORDER)}

# Feature ordering (MUST match training matrix column order)
FEATURE_NAMES = [
    "damage_score",          # 0
    "damage_type_encoded",   # 1
    "asset_age_years",       # 2
    "usage_count",           # 3
    "estimated_repair_cost_etb",  # 4
    "current_market_price_etb",   # 5
    "repair_cost_ratio",     # 6
    "age_damage_product",    # 7
    "remaining_life_score",  # 8
    "price_delta_pct",       # 9
    "category_encoded",      # 10
]


def _encode_damage_type(damage_type: str) -> int:
    """
    Encode damage_type string to integer using alphabetical LabelEncoder order.

    physical=1, electrical=0, software=2, structural=3
    """
    key = damage_type.strip().lower()
    if key not in DAMAGE_TYPE_MAP:
        raise ValueError(
            f"Unknown damage_type: '{damage_type}'. "
            f"Expected one of {list(DAMAGE_TYPE_MAP.keys())}"
        )
    return DAMAGE_TYPE_MAP[key]


def _encode_category(category: str) -> int:
    """
    Encode asset_category string to integer using alphabetical LabelEncoder order.
    """
    key = category.strip()
    if key not in CATEGORY_MAP:
        raise ValueError(
            f"Unknown category: '{category}'. "
            f"Expected one of {list(CATEGORY_MAP.keys())}"
        )
    return CATEGORY_MAP[key]


def build_feature_vector(asset: dict[str, Any]) -> np.ndarray:
    """
    Build the 11-dimensional feature vector for RF inference.

    Parameters
    ----------
    asset : dict
        Must contain keys:
          - damage_score (float 0-1)
          - damage_type (str)
          - asset_age_years (float)
          - expected_lifespan_years (float)
          - usage_count (int)
          - estimated_repair_cost_etb  or  estimated_repair_cost (float)
          - current_market_price_etb   or  current_market_price (float)
          - asset_category (str)
        Derived features are computed automatically if not provided.

    Returns
    -------
    np.ndarray shape (1, 11)
    """
    # ── Primary values ────────────────────────────────────────────────────
    damage_score        = float(asset["damage_score"])
    damage_type_enc     = _encode_damage_type(str(asset.get("damage_type", "physical")))
    asset_age_years     = float(asset["asset_age_years"])
    expected_lifespan   = float(asset.get("expected_lifespan_years", 7))
    usage_count         = int(asset.get("usage_count", 0))

    # Accept both naming conventions from the API schema and internal dicts
    repair_cost = float(
        asset.get("estimated_repair_cost_etb")
        or asset.get("estimated_repair_cost", 0)
    )
    market_price = float(
        asset.get("current_market_price_etb")
        or asset.get("current_market_price", 1)
    )

    # ── Derived features (compute if not already provided) ─────────────
    repair_cost_ratio = float(
        asset.get("repair_cost_ratio") or (repair_cost / market_price if market_price > 0 else 0)
    )
    age_damage_product = float(
        asset.get("age_damage_product") or (asset_age_years * damage_score)
    )
    remaining_life_score = float(
        asset.get("remaining_life_score")
        if asset.get("remaining_life_score") is not None
        else max(0.0, 1.0 - (asset_age_years / expected_lifespan))
    )
    price_delta_pct = float(
        asset.get("price_delta_pct")
        if asset.get("price_delta_pct") is not None
        else ((market_price - repair_cost) / market_price * 100 if market_price > 0 else 0)
    )

    category_enc = _encode_category(str(asset.get("asset_category", "Desktop Computer")))

    # ── Assemble in FEATURE_NAMES order ───────────────────────────────────
    vector = np.array([
        damage_score,
        damage_type_enc,
        asset_age_years,
        usage_count,
        repair_cost,
        market_price,
        repair_cost_ratio,
        age_damage_product,
        remaining_life_score,
        price_delta_pct,
        category_enc,
    ], dtype=np.float64).reshape(1, -1)

    return vector

def get_feature_names() -> list[str]:
    """Return ordered list of feature names matching build_feature_vector output."""
    return list(FEATURE_NAMES)
