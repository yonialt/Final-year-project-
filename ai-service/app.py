"""
AI Decision Support Microservice — Flask API
University of Gondar Smart Resource Management System (SRMS)

POST /ai/recommend
  Input:  { damage_level, repair_cost, new_price, asset_age }
  Output: { decision, confidence, cost_ratio, feature_importances, metrics }

POST /ai/health
  Output: { status, model_loaded, version }
"""

import os
import numpy as np
import joblib
from flask import Flask, request, jsonify
from flask_cors import CORS

# ──────────────────────────────────────────────────────────────────────────────
# App Setup
# ──────────────────────────────────────────────────────────────────────────────

app = Flask(__name__)
CORS(app)

MODEL_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'rf_model.joblib')
model = None

def load_model():
    """Load the trained Random Forest model from disk."""
    global model
    if os.path.exists(MODEL_PATH):
        model = joblib.load(MODEL_PATH)
        print(f"✅ Model loaded from {MODEL_PATH}")
    else:
        print(f"⚠️  Model file not found at {MODEL_PATH}. Run train_model.py first.")
        print("   Falling back to heuristic-based decisions.")

load_model()

# ──────────────────────────────────────────────────────────────────────────────
# Heuristic Fallback (used when model is not trained yet)
# ──────────────────────────────────────────────────────────────────────────────

def heuristic_decision(damage_level, repair_cost, new_price, asset_age):
    """Fallback decision engine using weighted scoring."""
    cost_ratio = repair_cost / new_price if new_price > 0 else 1.0

    weights = {'cost_ratio': 0.55, 'damage_level': 0.25, 'age': 0.20}
    scores = {
        'cost_ratio': min(cost_ratio / 0.7, 1.0),
        'damage_level': damage_level / 3.0,
        'age': min(asset_age / 8.0, 1.0)
    }

    weighted_sum = sum(scores[k] * weights[k] for k in weights)

    if weighted_sum > 0.58:
        decision = 'REPLACE'
        confidence = min(0.7 + (weighted_sum - 0.58), 0.99)
    else:
        decision = 'REPAIR'
        confidence = min(0.7 + (0.58 - weighted_sum), 0.99)

    # Override rules
    if damage_level == 3 and cost_ratio > 0.4:
        decision = 'REPLACE'
        confidence = 0.95

    return decision, confidence, cost_ratio

# ──────────────────────────────────────────────────────────────────────────────
# Routes
# ──────────────────────────────────────────────────────────────────────────────

@app.route('/ai/health', methods=['GET'])
def health():
    """Health check endpoint."""
    return jsonify({
        'status': 'ok',
        'model_loaded': model is not None,
        'version': '2.0',
        'service': 'SRMS-AI-Engine',
        'algorithm': 'Random Forest Classifier',
        'features': ['damage_level', 'repair_cost', 'new_price', 'asset_age', 'cost_ratio']
    })


@app.route('/ai/recommend', methods=['POST'])
def recommend():
    """
    AI decision endpoint.
    Expects JSON: { damage_level, repair_cost, new_price, asset_age }
    Returns: { decision, confidence, cost_ratio, metrics }
    """
    data = request.get_json()

    # Validate required fields
    required = ['damage_level', 'repair_cost', 'new_price']
    missing = [f for f in required if f not in data or data[f] is None]
    if missing:
        return jsonify({
            'error': f'Missing required fields: {", ".join(missing)}',
            'required': required
        }), 400

    try:
        damage_level = int(data['damage_level'])
        repair_cost  = float(data['repair_cost'])
        new_price    = float(data['new_price'])
        asset_age    = float(data.get('asset_age', 0))
    except (ValueError, TypeError) as e:
        return jsonify({'error': f'Invalid data types: {str(e)}'}), 400

    # Validate ranges
    if damage_level not in [1, 2, 3]:
        return jsonify({'error': 'damage_level must be 1, 2, or 3'}), 400
    if repair_cost < 0 or new_price <= 0:
        return jsonify({'error': 'repair_cost must be >= 0 and new_price must be > 0'}), 400

    cost_ratio = repair_cost / new_price

    # ── Model Prediction ─────────────────────────────────────────────────
    if model is not None:
        features = np.array([[damage_level, repair_cost, new_price, asset_age, cost_ratio]])
        prediction = model.predict(features)[0]
        probabilities = model.predict_proba(features)[0]

        decision = 'REPLACE' if prediction == 1 else 'REPAIR'
        confidence = float(max(probabilities))

        # Feature importances from trained model
        feature_names = ['damage_level', 'repair_cost', 'new_price', 'asset_age', 'cost_ratio']
        importances = {
            name: round(float(imp), 4)
            for name, imp in zip(feature_names, model.feature_importances_)
        }
        method = 'random_forest'
    else:
        # Fallback to heuristic
        decision, confidence, _ = heuristic_decision(damage_level, repair_cost, new_price, asset_age)
        importances = {
            'cost_ratio': 0.55,
            'damage_level': 0.25,
            'asset_age': 0.20,
            'repair_cost': 0.0,
            'new_price': 0.0
        }
        method = 'heuristic_fallback'

    # ── Compute metrics ──────────────────────────────────────────────────
    efficiency_score = round(1.0 - cost_ratio, 2) if cost_ratio <= 1.0 else 0.0
    viability_index = round(max(0, 100 - (asset_age / 10.0) * 100), 0)
    
    savings = round(new_price - repair_cost, 2) if decision == 'REPAIR' else 0.0
    
    return jsonify({
        'decision': decision,
        'confidence': round(confidence, 4),
        'cost_ratio': round(cost_ratio, 4),
        'method': method,
        'input': {
            'damage_level': damage_level,
            'repair_cost': repair_cost,
            'new_price': new_price,
            'asset_age': asset_age
        },
        'feature_importances': importances,
        'metrics': {
            'efficiency_score': efficiency_score,
            'viability_index': viability_index,
            'potential_savings': savings,
            'risk_level': 'HIGH' if damage_level == 3 else ('MEDIUM' if damage_level == 2 else 'LOW')
        }
    })


@app.route('/ai/batch', methods=['POST'])
def batch_recommend():
    """Batch prediction endpoint for multiple assets."""
    data = request.get_json()
    items = data.get('items', [])
    
    if not items or not isinstance(items, list):
        return jsonify({'error': 'Provide an array of items'}), 400

    results = []
    for item in items:
        try:
            damage_level = int(item['damage_level'])
            repair_cost  = float(item['repair_cost'])
            new_price    = float(item['new_price'])
            asset_age    = float(item.get('asset_age', 0))
            cost_ratio   = repair_cost / new_price if new_price > 0 else 1.0

            if model is not None:
                features = np.array([[damage_level, repair_cost, new_price, asset_age, cost_ratio]])
                prediction = model.predict(features)[0]
                probabilities = model.predict_proba(features)[0]
                decision = 'REPLACE' if prediction == 1 else 'REPAIR'
                confidence = float(max(probabilities))
            else:
                decision, confidence, _ = heuristic_decision(damage_level, repair_cost, new_price, asset_age)

            results.append({
                'decision': decision,
                'confidence': round(confidence, 4),
                'cost_ratio': round(cost_ratio, 4),
                'resource_id': item.get('resource_id')
            })
        except Exception as e:
            results.append({
                'error': str(e),
                'resource_id': item.get('resource_id')
            })

    return jsonify({'results': results, 'total': len(results)})


# ──────────────────────────────────────────────────────────────────────────────
# Run
# ──────────────────────────────────────────────────────────────────────────────

if __name__ == '__main__':
    port = int(os.environ.get('AI_SERVICE_PORT', 5000))
    print(f"\n🧠 SRMS AI Engine starting on port {port}...")
    app.run(host='0.0.0.0', port=port, debug=True)
