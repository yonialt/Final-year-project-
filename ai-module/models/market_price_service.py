"""
SRMS AI Module — Market Price Service (E-commerce API Integration)
models/market_price_service.py

Fetches the current market price for an asset category from a configurable
external REST API, with Redis caching and ETB fallback prices.
"""

import os
import json
import datetime
from typing import Any

import httpx

# ── Redis (optional — graceful fallback if unavailable) ──────────────────────
try:
    import redis as redis_lib
    _REDIS_AVAILABLE = True
except ImportError:
    _REDIS_AVAILABLE = False

# ── Configuration ─────────────────────────────────────────────────────────────
MARKET_API_BASE_URL = os.getenv("MARKET_API_BASE_URL", "")
REDIS_URL           = os.getenv("REDIS_URL", "redis://localhost:6379/0")
CACHE_TTL_SECONDS   = 6 * 3600  # 6 hours

# ── Fallback median prices per category (ETB) ─────────────────────────────────
# These are median mid-points of the generation ranges.
FALLBACK_PRICES: dict[str, float] = {
    "Desktop Computer":    60000.0,
    "Laptop":              82500.0,
    "Projector":           47500.0,
    "Laboratory Equipment":180000.0,
    "Printer / Copier":    35000.0,
    "Furniture":           10500.0,
    "Network Equipment":   26500.0,
    "Audio/Visual Equipment": 55000.0,
}
DEFAULT_FALLBACK = 50000.0  # used when category is unknown


class MarketPriceService:
    """
    Retrieve real-time market pricing for university asset categories.

    Hierarchy:
      1. Redis cache (6-hour TTL)
      2. Configurable external REST API (MARKET_API_BASE_URL)
      3. Hardcoded ETB median fallback
    """

    def __init__(self):
        self._redis: Any = None
        self._init_redis()

    # ── Redis setup ───────────────────────────────────────────────────────────

    def _init_redis(self):
        if not _REDIS_AVAILABLE:
            return
        try:
            r = redis_lib.from_url(REDIS_URL, decode_responses=True, socket_connect_timeout=2)
            r.ping()
            self._redis = r
            print("[MarketPriceService] Redis cache connected.")
        except Exception as e:
            print(f"[MarketPriceService] Redis unavailable ({e}), running without cache.")

    def _cache_key(self, category: str, asset_name: str) -> str:
        safe_cat  = category.replace(" ", "_").replace("/", "_").lower()
        safe_name = asset_name.replace(" ", "_").lower()[:40]
        return f"price:{safe_cat}:{safe_name}"

    def _get_from_cache(self, key: str) -> dict | None:
        if self._redis is None:
            return None
        try:
            raw = self._redis.get(key)
            if raw:
                data = json.loads(raw)
                data["source"] = "cache"
                return data
        except Exception:
            pass
        return None

    def _set_cache(self, key: str, data: dict):
        if self._redis is None:
            return
        try:
            payload = {k: v for k, v in data.items() if k != "source"}
            self._redis.setex(key, CACHE_TTL_SECONDS, json.dumps(payload))
        except Exception:
            pass

    # ── External API ──────────────────────────────────────────────────────────

    def _call_api(self, asset_name: str, category: str) -> dict | None:
        """
        Call the configured external price API.

        Expected API response (any subset is fine — we extract "price"):
          { "price": float, "url": str, "in_stock": bool }
        """
        if not MARKET_API_BASE_URL:
            return None
        try:
            url    = f"{MARKET_API_BASE_URL.rstrip('/')}/price"
            params = {"name": asset_name, "category": category, "currency": "ETB"}
            with httpx.Client(timeout=8.0) as client:
                resp = client.get(url, params=params)
                resp.raise_for_status()
                data = resp.json()
                price = float(data.get("price", 0))
                if price <= 0:
                    return None
                return {
                    "price":        price,
                    "source_url":   data.get("url", url),
                    "availability": bool(data.get("in_stock", True)),
                    "source":       "api",
                    "fetched_at":   datetime.datetime.utcnow().isoformat() + "Z",
                }
        except Exception as e:
            print(f"[MarketPriceService] API call failed: {e}")
            return None

    # ── Fallback ──────────────────────────────────────────────────────────────

    def _fallback(self, category: str) -> dict:
        price = FALLBACK_PRICES.get(category, DEFAULT_FALLBACK)
        return {
            "price":        price,
            "source_url":   "",
            "availability": True,
            "source":       "fallback",
            "fetched_at":   datetime.datetime.utcnow().isoformat() + "Z",
        }

    # ── Public API ────────────────────────────────────────────────────────────

    def get_current_price(self, asset_name: str, category: str) -> dict:
        """
        Return the current market price for an asset.

        Parameters
        ----------
        asset_name : str    e.g. "Dell OptiPlex 7090-123"
        category   : str    one of the 8 SRMS asset categories

        Returns
        -------
        dict:
          {
            "price":        float,       # ETB
            "source_url":   str,
            "availability": bool,
            "source":       "api" | "cache" | "fallback",
            "fetched_at":   str (ISO-8601)
          }
        """
        key = self._cache_key(category, asset_name)

        # 1. Cache
        cached = self._get_from_cache(key)
        if cached:
            return cached

        # 2. External API
        api_result = self._call_api(asset_name, category)
        if api_result:
            self._set_cache(key, api_result)
            return api_result

        # 3. Fallback
        fallback_result = self._fallback(category)
        return fallback_result
