import httpx
import time
from fastapi import APIRouter
from app.config import get_settings
from app.schemas import OpenRouterModel

router = APIRouter(prefix="/api", tags=["models"])

settings = get_settings()

_cache: list[OpenRouterModel] | None = None
_cache_time: float = 0.0
CACHE_TTL = 3600  # 1 hour

POPULAR_MODEL_IDS = [
    "openai/gpt-4o",
    "openai/gpt-4o-mini",
    "openai/gpt-5",
    "openai/gpt-5-mini",
    "openai/gpt-5.4",
    "openai/gpt-5.4-mini",
    "anthropic/claude-sonnet-4",
    "anthropic/claude-opus-4",
    "anthropic/claude-3.5-sonnet",
    "anthropic/claude-3.7-sonnet",
    "google/gemini-2.5-pro-preview",
    "google/gemini-2.5-flash-preview",
    "google/gemini-2.0-flash-001",
    "meta-llama/llama-4-maverick",
    "meta-llama/llama-4-scout",
    "meta-llama/llama-3.3-70b-instruct",
    "deepseek/deepseek-chat-v3-0324",
    "deepseek/deepseek-r1",
    "mistralai/codestral-2501",
    "mistralai/mistral-large-2411",
    "qwen/qwen-2.5-72b-instruct",
    "x-ai/grok-3",
    "x-ai/grok-3-mini",
]


def _sort_by_popularity(models: list[OpenRouterModel]) -> list[OpenRouterModel]:
    popular_set = set(POPULAR_MODEL_IDS)
    popular_models = []
    other_models = []

    for m in models:
        if m.id in popular_set:
            popular_models.append(m)
        else:
            other_models.append(m)

    # Sort popular models by their order in POPULAR_MODEL_IDS
    popular_order = {mid: i for i, mid in enumerate(POPULAR_MODEL_IDS)}
    popular_models.sort(key=lambda m: popular_order.get(m.id, 999))

    # Sort remaining alphabetically
    other_models.sort(key=lambda m: m.id)

    return popular_models + other_models


@router.get("/models/openrouter", response_model=list[OpenRouterModel])
async def get_openrouter_models():
    global _cache, _cache_time

    if _cache and (time.time() - _cache_time) < CACHE_TTL:
        return _cache

    if not settings.openrouter_api_key:
        return []

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(
                "https://openrouter.ai/api/v1/models",
                headers={
                    "Authorization": f"Bearer {settings.openrouter_api_key}",
                },
            )
            response.raise_for_status()
            data = response.json()

        models = []
        for m in data.get("data", []):
            model_id = m.get("id", "")
            if not model_id:
                continue
            models.append(OpenRouterModel(
                id=model_id,
                name=m.get("name", model_id),
                description=m.get("description"),
            ))

        models = _sort_by_popularity(models)
        _cache = models
        _cache_time = time.time()
        return models

    except Exception:
        if _cache:
            return _cache
        return []
