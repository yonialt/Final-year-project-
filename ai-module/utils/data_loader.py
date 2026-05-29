"""
SRMS AI Module — Data Loader & Validator
utils/data_loader.py
"""

import pandas as pd

REQUIRED_COLUMNS = [
    "asset_id",
    "asset_name",
    "asset_category",
    "damage_score",
    "damage_type",
    "asset_age_years",
    "expected_lifespan_years",
    "usage_count",
    "estimated_repair_cost_etb",
    "current_market_price_etb",
    "repair_cost_ratio",
    "age_damage_product",
    "remaining_life_score",
    "price_delta_pct",
    "decision",
]

FEATURE_COLUMNS = [
    "damage_score",
    "damage_type",
    "asset_age_years",
    "expected_lifespan_years",
    "usage_count",
    "estimated_repair_cost_etb",
    "current_market_price_etb",
    "repair_cost_ratio",
    "age_damage_product",
    "remaining_life_score",
    "price_delta_pct",
]


def load_and_validate_dataset(path: str) -> pd.DataFrame:
    """
    Load the SRMS training CSV, run structural and semantic assertions,
    print a summary, and return the cleaned DataFrame.

    Parameters
    ----------
    path : str
        Absolute or relative path to university_asset_training_data.csv

    Returns
    -------
    pd.DataFrame
        Validated, cleaned DataFrame ready for feature engineering.

    Raises
    ------
    AssertionError
        If any validation rule is violated.
    """
    print(f"[DataLoader] Loading dataset from: {path}")
    df = pd.read_csv(path)

    # ── 1. Column presence ────────────────────────────────────────────────
    missing_cols = [c for c in REQUIRED_COLUMNS if c not in df.columns]
    assert not missing_cols, (
        f"Missing columns: {missing_cols}. "
        f"Expected all of: {REQUIRED_COLUMNS}"
    )
    assert len(df.columns) == len(REQUIRED_COLUMNS), (
        f"Expected exactly {len(REQUIRED_COLUMNS)} columns, got {len(df.columns)}: {list(df.columns)}"
    )

    # ── 2. No nulls in feature or label columns ───────────────────────────
    null_report = df[FEATURE_COLUMNS + ["decision"]].isnull().sum()
    cols_with_nulls = null_report[null_report > 0]
    assert cols_with_nulls.empty, (
        f"Null values found in columns:\n{cols_with_nulls}"
    )

    # ── 3. Label integrity ────────────────────────────────────────────────
    bad_labels = df[~df["decision"].isin([0, 1])]
    assert bad_labels.empty, (
        f"decision column must contain only 0 or 1, found: {df['decision'].unique()}"
    )

    # ── 4. Numeric range checks ───────────────────────────────────────────
    assert df["repair_cost_ratio"].between(0, 5).all(), (
        "repair_cost_ratio must be between 0 and 5 for all rows. "
        f"Range found: [{df['repair_cost_ratio'].min():.4f}, {df['repair_cost_ratio'].max():.4f}]"
    )
    assert df["damage_score"].between(0, 1).all(), (
        "damage_score must be between 0 and 1 for all rows. "
        f"Range found: [{df['damage_score'].min():.4f}, {df['damage_score'].max():.4f}]"
    )

    # ── 5. Print summary ──────────────────────────────────────────────────
    n          = len(df)
    n_repair   = int((df["decision"] == 0).sum())
    n_replace  = int((df["decision"] == 1).sum())

    print(f"[DataLoader] ✅ Validation passed.")
    print(f"[DataLoader]    Shape      : {df.shape[0]} rows × {df.shape[1]} columns")
    print(f"[DataLoader]    REPAIR (0) : {n_repair} ({n_repair/n*100:.1f}%)")
    print(f"[DataLoader]    REPLACE(1) : {n_replace} ({n_replace/n*100:.1f}%)")
    print(f"[DataLoader]    Categories : {df['asset_category'].nunique()} unique")
    print(f"[DataLoader]    damage_score  range : "
          f"[{df['damage_score'].min():.3f}, {df['damage_score'].max():.3f}]")
    print(f"[DataLoader]    cost_ratio    range : "
          f"[{df['repair_cost_ratio'].min():.3f}, {df['repair_cost_ratio'].max():.3f}]")

    return df
