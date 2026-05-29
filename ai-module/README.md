# UoG SRMS — AI Asset Decision Module

Repair vs **Replace** decisions for damaged university assets using a **Random Forest** classifier.

## Execution order

```bash
cd ai-module
python -m venv .venv
.venv\Scripts\activate          # Windows
pip install -r requirements.txt

# 1. Generate dataset (required before training)
python data/generate_dataset.py

# 2. Train model
python -c "from models.asset_decision_model import AssetDecisionModel; AssetDecisionModel().train_from_csv('data/university_asset_training_data.csv')"

# 3. Start API
uvicorn main:app --reload --port 8000

# 4. Run tests
pytest tests/
```

## API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Model, DB, API status |
| POST | `/api/v1/asset/decision` | Full decision pipeline |
| GET | `/api/v1/asset/decision/history?asset_id=` | Past decisions |
| POST | `/api/v1/asset/decision/{id}/feedback` | Outcome feedback |
| GET | `/api/v1/model/stats` | Training metadata + counts |

Docs: http://localhost:8000/docs

## Laravel / Node integration

Set `AI_SERVICE_URL=http://localhost:8000` and `POST /api/v1/asset/decision` with the request schema in `api/schemas.py`.

## Stack

- FastAPI, scikit-learn RandomForest, SQLAlchemy (MySQL or SQLite), Redis cache, configurable market REST API.
