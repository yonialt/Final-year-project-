"""
Train a Random Forest classifier for Repair/Replace decision support.
Generates synthetic training data based on real-world heuristics.
Saves model to disk for the Flask API to load at startup.
"""

import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score
import joblib
import os

# ──────────────────────────────────────────────────────────────────────────────
# Generate synthetic training data
# Features: [damage_level, repair_cost, new_price, asset_age]
# Label: 0 = REPAIR, 1 = REPLACE
# ──────────────────────────────────────────────────────────────────────────────

np.random.seed(42)
N_SAMPLES = 2000

damage_level = np.random.randint(1, 4, N_SAMPLES)       # 1-3
repair_cost  = np.random.uniform(50, 3000, N_SAMPLES)    # $50 - $3000
new_price    = np.random.uniform(200, 5000, N_SAMPLES)   # $200 - $5000
asset_age    = np.random.uniform(0, 15, N_SAMPLES)       # 0 - 15 years

# Derived feature: cost ratio
cost_ratio = repair_cost / new_price

# ──────────────────────────────────────────────────────────────────────────────
# Decision rules (simulating expert knowledge for label generation)
# ──────────────────────────────────────────────────────────────────────────────

labels = np.zeros(N_SAMPLES, dtype=int)

for i in range(N_SAMPLES):
    score = 0.0
    
    # Cost ratio weight (most important)
    if cost_ratio[i] > 0.65:
        score += 3.0
    elif cost_ratio[i] > 0.45:
        score += 1.5
    elif cost_ratio[i] > 0.30:
        score += 0.5
    
    # Damage level weight
    if damage_level[i] == 3:
        score += 2.5
    elif damage_level[i] == 2:
        score += 1.0
    
    # Age weight
    if asset_age[i] > 8:
        score += 2.0
    elif asset_age[i] > 5:
        score += 1.0
    elif asset_age[i] > 3:
        score += 0.3
    
    # Strong override rules
    if damage_level[i] == 3 and cost_ratio[i] > 0.4:
        score += 2.0
    
    if asset_age[i] > 10 and damage_level[i] >= 2:
        score += 1.5
    
    # Add some noise for realism
    score += np.random.normal(0, 0.5)
    
    # Threshold
    labels[i] = 1 if score > 3.0 else 0

# ──────────────────────────────────────────────────────────────────────────────
# Build feature matrix
# ──────────────────────────────────────────────────────────────────────────────

X = np.column_stack([damage_level, repair_cost, new_price, asset_age, cost_ratio])
y = labels

feature_names = ['damage_level', 'repair_cost', 'new_price', 'asset_age', 'cost_ratio']

# ──────────────────────────────────────────────────────────────────────────────
# Train / Test Split
# ──────────────────────────────────────────────────────────────────────────────

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

# ──────────────────────────────────────────────────────────────────────────────
# Train Random Forest
# ──────────────────────────────────────────────────────────────────────────────

model = RandomForestClassifier(
    n_estimators=100,
    max_depth=12,
    min_samples_split=5,
    min_samples_leaf=2,
    random_state=42,
    n_jobs=-1
)

model.fit(X_train, y_train)

# ──────────────────────────────────────────────────────────────────────────────
# Evaluate
# ──────────────────────────────────────────────────────────────────────────────

y_pred = model.predict(X_test)
accuracy = accuracy_score(y_test, y_pred)

print("=" * 60)
print("SRMS AI Model — Random Forest Classifier")
print("=" * 60)
print(f"\nTraining samples:  {len(X_train)}")
print(f"Test samples:      {len(X_test)}")
print(f"Accuracy:          {accuracy:.4f} ({accuracy*100:.1f}%)")
print(f"\nFeature Importances:")
for name, importance in sorted(zip(feature_names, model.feature_importances_), key=lambda x: -x[1]):
    print(f"  {name:20s}: {importance:.4f} ({importance*100:.1f}%)")

print(f"\n{classification_report(y_test, y_pred, target_names=['REPAIR', 'REPLACE'])}")

# ──────────────────────────────────────────────────────────────────────────────
# Save model
# ──────────────────────────────────────────────────────────────────────────────

model_dir = os.path.dirname(os.path.abspath(__file__))
model_path = os.path.join(model_dir, 'rf_model.joblib')
joblib.dump(model, model_path)
print(f"✅ Model saved to: {model_path}")
