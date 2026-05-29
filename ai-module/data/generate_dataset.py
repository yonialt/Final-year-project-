"""
SRMS AI Module — Dataset Generator
University of Gondar

Generates 1500 synthetic university asset records with REPAIR/REPLACE labels.
Run FIRST before any model training:
  python data/generate_dataset.py
"""

import numpy as np
import pandas as pd
import json
import os
import random

# ── Reproducibility ─────────────────────────────────────────────────────────
np.random.seed(42)
random.seed(42)

# ── Output paths ─────────────────────────────────────────────────────────────
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
CSV_PATH   = os.path.join(SCRIPT_DIR, "university_asset_training_data.csv")
JSON_PATH  = os.path.join(SCRIPT_DIR, "dataset_summary.json")

# ── Category definitions ──────────────────────────────────────────────────────
CATEGORIES = {
    "Desktop Computer": {
        "lifespan": 6,
        "market_min": 35000,  "market_max": 85000,
        "repair_min": 3000,   "repair_max": 25000,
        "allow_software": True,
        "names": [
            "Dell OptiPlex 7090", "HP EliteDesk 800 G8", "Lenovo ThinkCentre M90q",
            "Acer Veriton X2680G", "ASUS ProArt Station PA90", "HP Z2 Tower G5",
            "Dell Precision 3650", "Lenovo IdeaCentre 5", "HP EliteDesk 705 G8",
            "Dell OptiPlex 3090", "Acer Aspire TC-1660", "HP ProDesk 400 G7",
            "Lenovo ThinkCentre Neo 50t", "Dell OptiPlex 5090", "HP Z4 G4 Workstation",
            "ASUS ExpertCenter D7 Tower", "Dell OptiPlex 7000", "HP EliteDesk 600 G9",
            "Lenovo ThinkCentre M80q", "Acer Nitro N50-640",
        ],
    },
    "Laptop": {
        "lifespan": 5,
        "market_min": 45000,  "market_max": 120000,
        "repair_min": 4000,   "repair_max": 30000,
        "allow_software": True,
        "names": [
            "HP EliteBook 840 G9", "Dell Latitude 5540", "Lenovo ThinkPad X1 Carbon",
            "Apple MacBook Pro 14", "ASUS ExpertBook B7 Flip", "Dell Inspiron 15 3530",
            "HP ProBook 450 G9", "Lenovo IdeaPad Slim 5i", "Acer TravelMate P4",
            "Microsoft Surface Pro 9", "HP Spectre x360 14", "Dell XPS 15 9530",
            "Lenovo ThinkPad T14s", "Acer Swift 3 SF314", "HP EliteBook 1040 G9",
            "Dell Latitude 7440", "ASUS VivoBook Pro 15", "Lenovo ThinkPad L14",
            "HP Pavilion 15-eh2", "Acer Aspire 5 A515",
        ],
    },
    "Projector": {
        "lifespan": 8,
        "market_min": 25000,  "market_max": 70000,
        "repair_min": 2000,   "repair_max": 18000,
        "allow_software": False,
        "names": [
            "Epson EB-X41", "BenQ MH535A", "Optoma HD146X", "ViewSonic PA503S",
            "Sony VPL-PHZ10", "Panasonic PT-VMW60", "Casio XJ-UT310WN",
            "NEC NP-PA804UL", "Acer P1387W", "BenQ TH585P",
            "Epson EH-TW7400", "Optoma GT1090HDR", "ViewSonic LS740W",
            "Panasonic PT-MZ770", "Sony VPL-EX435", "BenQ LU935",
            "Epson EB-L200F", "Dell S718QL", "Casio XJ-V110W",
            "NEC NP-M402H",
        ],
    },
    "Laboratory Equipment": {
        "lifespan": 10,
        "market_min": 60000,  "market_max": 300000,
        "repair_min": 5000,   "repair_max": 80000,
        "allow_software": True,
        "names": [
            "Mettler Toledo ME204 Balance", "Sartorius Analytical Balance AX224",
            "OHAUS Pioneer PA514", "Shimadzu AUX220", "Thermo Fisher Hot Plate HP130",
            "Eppendorf Centrifuge 5430", "Heidolph Rotary Evaporator",
            "VELP Scientifica Magnetic Stirrer", "Thermo Scientific Incubator",
            "Cole-Parmer Peristaltic Pump", "Memmert UFE 700 Oven",
            "Nuve EC 160 Centrifuge", "Eppendorf Pipette Research Plus",
            "Kern ABJ 120-4M Balance", "Boeco Germany BT-300 Microcentrifuge",
            "Stuart SHM10 Orbital Shaker", "Julabo F12 Circulator",
            "Buchi Rotavapor R-300", "Hettich MIKRO 200 Centrifuge",
            "Raypa AES-75 Autoclave",
        ],
    },
    "Printer / Copier": {
        "lifespan": 5,
        "market_min": 15000,  "market_max": 55000,
        "repair_min": 1500,   "repair_max": 12000,
        "allow_software": True,
        "names": [
            "Canon iR2625", "HP LaserJet Pro MFP M428fdw", "Epson WorkForce Pro WF-7840",
            "Brother MFC-L8900CDW", "Kyocera ECOSYS M2640idw", "Ricoh IM 350F",
            "Xerox VersaLink C405", "Canon imageCLASS MF644Cdw", "HP OfficeJet Pro 9015e",
            "Lexmark MB3442adw", "Sharp MX-3071", "Konica Minolta bizhub 4050i",
            "Toshiba e-Studio 2518A", "OKI MC563dn", "Samsung ProXpress M4580FX",
            "Panasonic KX-MB2085", "Canon iR-ADV DX 4735i", "HP LaserJet MFP M440",
            "Ricoh IM C530FB", "Kyocera TASKalfa 2553ci",
        ],
    },
    "Furniture": {
        "lifespan": 12,
        "market_min": 3000,   "market_max": 18000,
        "repair_min": 300,    "repair_max": 4000,
        "allow_software": False,
        "names": [
            "Office Chair OC-200", "Executive Desk ED-450", "Steel Bookshelf SB-160",
            "Conference Table CT-240", "Filing Cabinet FC-4DR", "Lecture Hall Seat LH-88",
            "Study Carrel SC-100", "Lab Bench LB-240", "Ergonomic Chair EC-Pro",
            "Reception Desk RD-180", "Modular Workstation MW-360", "Wooden Library Shelf WLS-200",
            "Steel Storage Cabinet SSC-4", "Meeting Table MT-180R", "Computer Lab Chair CLC-55",
            "Lecture Podium LP-60", "2-Door Wardrobe 2DW-120", "Visitor Chair VC-300",
            "Height-Adjustable Desk HAD-140", "Display Cabinet DC-200",
        ],
    },
    "Network Equipment": {
        "lifespan": 7,
        "market_min": 8000,   "market_max": 45000,
        "repair_min": 1000,   "repair_max": 10000,
        "allow_software": True,
        "names": [
            "Cisco Catalyst 2960-X", "TP-Link TL-SG3428X", "Ubiquiti UniFi Switch 48",
            "Juniper EX2300-24T", "HP Aruba 2930M", "D-Link DGS-1520-28",
            "Netgear XS728T", "Cisco RV345P Router", "MikroTik CCR1009",
            "Ubiquiti EdgeRouter X", "TP-Link TL-ER7206", "Zyxel XGS2220-30",
            "Allied Telesis AT-GS900/24", "Linksys LGS308MP", "Aruba IAP-505",
            "Cisco Meraki MR44", "Ubiquiti UAP-AC-Pro", "TP-Link EAP670",
            "EnGenius EWS357AP", "Ruckus R550 Access Point",
        ],
    },
    "Audio/Visual Equipment": {
        "lifespan": 7,
        "market_min": 20000,  "market_max": 90000,
        "repair_min": 2000,   "repair_max": 20000,
        "allow_software": False,
        "names": [
            "Samsung 55\" Smart TV QN55Q70B", "LG OLED 65C3 Display",
            "Sony Bravia 75X90K", "Panasonic 50\" LED TH-50LX800",
            "JBL Professional PRX935 Speaker", "QSC K12.2 Active Speaker",
            "Yamaha HS8 Studio Monitor", "Bose Professional L1 Pro32",
            "Sony HXR-NX80 Camcorder", "Canon XF605 Camera",
            "Blackmagic Pocket Cinema 6K", "Panasonic HC-X1500 Camera",
            "Rode NTG5 Microphone", "Shure SM7B Mic", "Sony MDR-7506 Headphones",
            "Behringer X32 Mixer", "Roland V-8HD Video Switcher",
            "Elgato 4K60 Pro Capture", "Samsung Flip 2 WM55R Display",
            "ViewSonic IFP7550 Interactive Display",
        ],
    },
}

DAMAGE_TYPES = ["physical", "electrical", "software", "structural"]
DAMAGE_TYPE_WEIGHTS = {
    True:  [0.35, 0.25, 0.20, 0.20],   # electronics: software allowed
    False: [0.40, 0.25, 0.00, 0.35],   # non-electronics: no software
}

N_SAMPLES   = 1500
PER_CAT     = N_SAMPLES // len(CATEGORIES)   # 187 each, 4 extra distributed

LABEL_NOISE = 0.05


# ── Helpers ───────────────────────────────────────────────────────────────────

def _norm_weights(w):
    s = sum(w)
    return [x / s for x in w]


def _generate_name(category, used):
    pool = CATEGORIES[category]["names"]
    available = [n for n in pool if n not in used]
    if not available:
        available = pool
    base = random.choice(available)
    suffix = random.randint(100, 999)
    return f"{base}-{suffix}"


def _compute_label(damage_score, repair_cost_ratio, asset_age_years,
                   expected_lifespan, estimated_repair_cost,
                   current_market_price, remaining_life_score, damage_type):
    """Apply deterministic labeling rules (returns 0=repair, 1=replace)."""
    if damage_score >= 0.85:
        return 1
    if repair_cost_ratio >= 0.70:
        return 1
    if asset_age_years > expected_lifespan * 1.1:
        return 1
    if estimated_repair_cost >= current_market_price:
        return 1
    if remaining_life_score <= 0.10:
        return 1
    if damage_type == "electrical" and damage_score >= 0.65:
        return 1
    return 0


# ── Main generation ───────────────────────────────────────────────────────────

def generate_dataset():
    rows = []
    asset_id = 1001

    category_names = list(CATEGORIES.keys())
    # Build count per category (187 * 8 = 1496, add 1 to first 4)
    counts = [PER_CAT + (1 if i < (N_SAMPLES % len(CATEGORIES)) else 0)
              for i in range(len(CATEGORIES))]

    for cat_idx, category in enumerate(category_names):
        cfg     = CATEGORIES[category]
        n_rows  = counts[cat_idx]
        allow_sw = cfg["allow_software"]
        dmg_weights = _norm_weights(DAMAGE_TYPE_WEIGHTS[allow_sw])
        used_names = set()

        for _ in range(n_rows):
            # ── Core attributes ───────────────────────────────────────────
            expected_lifespan = cfg["lifespan"]
            asset_age_years   = round(
                np.random.uniform(0.5, expected_lifespan * 1.4), 2)

            damage_score = round(np.random.uniform(0.05, 0.98), 4)

            damage_type = np.random.choice(DAMAGE_TYPES, p=dmg_weights)

            usage_count = int(np.random.randint(50, 5000))

            current_market_price = round(
                np.random.uniform(cfg["market_min"], cfg["market_max"]), 2)

            estimated_repair_cost = round(
                np.random.uniform(cfg["repair_min"], cfg["repair_max"]), 2)

            # ── Computed features ──────────────────────────────────────────
            repair_cost_ratio    = round(
                estimated_repair_cost / current_market_price, 6)

            age_damage_product   = round(asset_age_years * damage_score, 6)

            remaining_life_score = round(
                max(0.0, 1.0 - (asset_age_years / expected_lifespan)), 6)

            price_delta_pct = round(
                (current_market_price - estimated_repair_cost)
                / current_market_price * 100, 4)

            # ── Label ────────────────────────────────────────────────────
            label = _compute_label(
                damage_score, repair_cost_ratio, asset_age_years,
                expected_lifespan, estimated_repair_cost, current_market_price,
                remaining_life_score, damage_type)

            # ── Asset name ────────────────────────────────────────────────
            asset_name = _generate_name(category, used_names)
            used_names.add(asset_name.rsplit("-", 1)[0])  # track base

            rows.append({
                "asset_id":                   asset_id,
                "asset_name":                 asset_name,
                "asset_category":             category,
                "damage_score":               damage_score,
                "damage_type":                damage_type,
                "asset_age_years":            asset_age_years,
                "expected_lifespan_years":    expected_lifespan,
                "usage_count":                usage_count,
                "estimated_repair_cost_etb":  estimated_repair_cost,
                "current_market_price_etb":   current_market_price,
                "repair_cost_ratio":          repair_cost_ratio,
                "age_damage_product":         age_damage_product,
                "remaining_life_score":       remaining_life_score,
                "price_delta_pct":            price_delta_pct,
                "decision":                   label,
            })
            asset_id += 1

    df = pd.DataFrame(rows)

    # ── Label noise (±5%) ───────────────────────────────────────────────────
    noise_mask = np.random.random(len(df)) < LABEL_NOISE
    df.loc[noise_mask, "decision"] = 1 - df.loc[noise_mask, "decision"]

    # ── Shuffle ─────────────────────────────────────────────────────────────
    df = df.sample(frac=1, random_state=42).reset_index(drop=True)

    return df


# ── Save & stats ───────────────────────────────────────────────────────────────

def print_and_save_stats(df):
    total    = len(df)
    repair   = int((df["decision"] == 0).sum())
    replace_ = int((df["decision"] == 1).sum())

    cat_counts = df["asset_category"].value_counts().to_dict()

    stats = {
        "total_rows":          total,
        "repair_count":        repair,
        "repair_pct":          round(repair  / total * 100, 2),
        "replace_count":       replace_,
        "replace_pct":         round(replace_ / total * 100, 2),
        "rows_per_category":   cat_counts,
        "damage_score": {
            "min":  round(float(df["damage_score"].min()), 4),
            "max":  round(float(df["damage_score"].max()), 4),
            "mean": round(float(df["damage_score"].mean()), 4),
        },
        "repair_cost_ratio": {
            "min":  round(float(df["repair_cost_ratio"].min()), 4),
            "max":  round(float(df["repair_cost_ratio"].max()), 4),
            "mean": round(float(df["repair_cost_ratio"].mean()), 4),
        },
        "market_price_etb": {
            "min":  round(float(df["current_market_price_etb"].min()), 2),
            "max":  round(float(df["current_market_price_etb"].max()), 2),
            "mean": round(float(df["current_market_price_etb"].mean()), 2),
        },
    }

    # ── Console output ─────────────────────────────────────────────────────
    sep = "=" * 60
    print(sep)
    print("SRMS AI Module — Dataset Generation Complete")
    print(sep)
    print(f"\n  Total rows      : {stats['total_rows']}")
    print(f"  REPAIR (0)      : {stats['repair_count']:>5}  ({stats['repair_pct']}%)")
    print(f"  REPLACE (1)     : {stats['replace_count']:>5}  ({stats['replace_pct']}%)")

    print(f"\n  Rows per category:")
    for cat, cnt in sorted(cat_counts.items(), key=lambda x: -x[1]):
        print(f"    {cat:<30} : {cnt}")

    print(f"\n  damage_score       — min: {stats['damage_score']['min']}"
          f"  max: {stats['damage_score']['max']}"
          f"  mean: {stats['damage_score']['mean']}")
    print(f"  repair_cost_ratio  — min: {stats['repair_cost_ratio']['min']}"
          f"  max: {stats['repair_cost_ratio']['max']}"
          f"  mean: {stats['repair_cost_ratio']['mean']}")
    print(f"  market_price_etb   — min: {stats['market_price_etb']['min']}"
          f"  max: {stats['market_price_etb']['max']}"
          f"  mean: {stats['market_price_etb']['mean']}")

    # ── Save CSV ───────────────────────────────────────────────────────────
    os.makedirs(os.path.dirname(CSV_PATH), exist_ok=True)
    df.to_csv(CSV_PATH, index=False)
    print(f"\n  Dataset saved to {CSV_PATH}")

    # ── Save JSON summary ──────────────────────────────────────────────────
    with open(JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(stats, f, indent=2)
    print(f"  Summary saved to {JSON_PATH}")
    print(sep)

    return stats


# ── Entry point ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    df = generate_dataset()
    print_and_save_stats(df)
