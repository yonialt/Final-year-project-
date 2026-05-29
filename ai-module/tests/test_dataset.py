from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parent.parent
CSV = ROOT / "data" / "university_asset_training_data.csv"

COLUMNS = [
    "asset_id", "asset_name", "asset_category", "damage_score", "damage_type",
    "asset_age_years", "expected_lifespan_years", "usage_count",
    "estimated_repair_cost_etb", "current_market_price_etb", "repair_cost_ratio",
    "age_damage_product", "remaining_life_score", "price_delta_pct", "decision",
]


def test_csv_shape_and_columns():
    df = pd.read_csv(CSV)
    assert len(df) == 1500
    assert list(df.columns) == COLUMNS


def test_no_nulls():
    df = pd.read_csv(CSV)
    assert not df.isnull().any().any()


def test_decision_values():
    df = pd.read_csv(CSV)
    assert set(df["decision"].unique()).issubset({0, 1})


def test_repair_cost_ratio_range():
    df = pd.read_csv(CSV)
    assert df["repair_cost_ratio"].min() >= 0
    assert df["repair_cost_ratio"].max() <= 5


def test_damage_score_range():
    df = pd.read_csv(CSV)
    assert df["damage_score"].min() >= 0
    assert df["damage_score"].max() <= 1
