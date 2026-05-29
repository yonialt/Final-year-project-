"""SRMS AI Asset Decision Module — FastAPI entry point."""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

from api.routes import router, set_services
from db.database import init_db
from models.asset_decision_model import AssetDecisionModel
from models.market_price_service import MarketPriceService

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

model = AssetDecisionModel()
market = MarketPriceService()


@asynccontextmanager
async def lifespan(_app: FastAPI):
    init_db()
    if model.load():
        logger.info("Asset decision model loaded")
    else:
        logger.warning("Model not found — run training first")
    set_services(model, market)
    yield


app = FastAPI(
    title="UoG SRMS AI Asset Decision Module",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)
