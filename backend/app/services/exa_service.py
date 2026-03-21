import httpx
import asyncio
import logging
from app.config import get_settings
from typing import Any

logger = logging.getLogger(__name__)
settings = get_settings()

ACADEMIC_DOMAINS = [
    "pubmed.gov",
    "ncbi.nlm.nih.gov",
    "clinicaltrials.gov",
    "fda.gov",
    "nih.gov",
    "cochrane.org",
    "sciencedirect.com",
    "springer.com",
    "wiley.com",
    "nejm.org",
    "thelancet.com",
    "jamanetwork.com",
    "bmj.com",
    "nature.com",
]

NATURAL_ACADEMIC_DOMAINS = [
    "pubmed.gov",
    "ncbi.nlm.nih.gov",
    "clinicaltrials.gov",
    "nih.gov",
    "nccih.nih.gov",
    "cochrane.org",
    "sciencedirect.com",
    "springer.com",
    "wiley.com",
    "nature.com",
    "bmj.com",
    "frontiersin.org",
    "mskcc.org",
    "examine.com",
    "mdpi.com",
]

QUERY_ENRICHMENT = {
    "pharma": {
        "academic": "clinical research efficacy side effects medical study",
        "social": "experience review side effects personal testimonial",
    },
    "natural": {
        "academic": "herbal supplement clinical trial efficacy safety natural medicine",
        "social": "natural remedy experience review personal testimonial supplement herb",
    },
}

SOCIAL_DOMAINS = [
    "reddit.com",
    "x.com",
    "twitter.com",
    "drugs.com",
    "webmd.com",
    "youtube.com",
    "patient.info",
    "drugsforum.com",
    "redditinvestigator.com",
    "quora.com",
]

SOCIAL_PLATFORM_DOMAINS = {
    "reddit": ["reddit.com"],
    "x": ["x.com", "twitter.com"],
    "tiktok": ["tiktok.com"],
    "youtube": ["youtube.com"],
    "drugs.com": ["drugs.com"],
    "webmd": ["webmd.com"],
    "quora": ["quora.com"],
}

ALL_PLATFORMS = list(SOCIAL_PLATFORM_DOMAINS.keys())


def _build_exa_headers() -> dict:
    if not settings.exa_api_key:
        raise ValueError("EXA_API_KEY is not set. Please add it to your .env file.")
    return {
        "x-api-key": settings.exa_api_key,
        "Content-Type": "application/json",
    }


def _extract_exa_cost(data: dict) -> float:
    cost_dollars = data.get("costDollars", {})
    if isinstance(cost_dollars, dict):
        return cost_dollars.get("total", 0.0) or 0.0
    return 0.0


async def search_academic(query: str, num_results: int = 15, mode: str = "pharma") -> tuple[list[dict[str, Any]], float]:
    if not settings.exa_api_key:
        return [], 0.0

    enrichment = QUERY_ENRICHMENT.get(mode, QUERY_ENRICHMENT["pharma"])["academic"]
    domains = NATURAL_ACADEMIC_DOMAINS if mode == "natural" else ACADEMIC_DOMAINS

    payload = {
        "query": f"{query} {enrichment}",
        "num_results": num_results,
        "category": "research paper",
        "type": "auto",
        "include_domains": domains,
        "text": {"max_characters": 2000},
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            response = await client.post(
                "https://api.exa.ai/search",
                headers=_build_exa_headers(),
                json=payload,
            )
            response.raise_for_status()
            data = response.json()
            results = [
                {
                    "title": result.get("title", ""),
                    "url": result.get("url", ""),
                    "domain": _extract_domain(result.get("url", "")),
                    "snippet": result.get("text", "")[:500],
                    "published_date": result.get("published_date"),
                }
                for result in data.get("results", [])
            ]
            cost = _extract_exa_cost(data)
            return results, cost
        except httpx.HTTPStatusError as e:
            logger.warning(f"Exa academic search HTTP error: {e.response.status_code} for query: {query}")
            return [], 0.0
        except httpx.RequestError as e:
            logger.warning(f"Exa academic search request error: {e} for query: {query}")
            return [], 0.0
        except asyncio.TimeoutError:
            logger.warning(f"Exa academic search timeout for query: {query}")
            return [], 0.0


async def search_social(query: str, platforms: list[str] | None = None, num_results: int = 20, mode: str = "pharma") -> tuple[list[dict[str, Any]], float]:
    if not settings.exa_api_key:
        return [], 0.0

    if platforms is None:
        platforms = ALL_PLATFORMS

    domains = []
    for platform in platforms:
        if platform in SOCIAL_PLATFORM_DOMAINS:
            domains.extend(SOCIAL_PLATFORM_DOMAINS[platform])

    if not domains:
        domains = SOCIAL_DOMAINS

    logger.info(f"Exa search_social - platforms: {platforms}, domains: {domains}, mode: {mode}")

    enrichment = QUERY_ENRICHMENT.get(mode, QUERY_ENRICHMENT["pharma"])["social"]

    payload = {
        "query": f"{query} {enrichment}",
        "num_results": num_results,
        "include_domains": domains,
        "type": "auto",
        "text": {"max_characters": 1500},
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            response = await client.post(
                "https://api.exa.ai/search",
                headers=_build_exa_headers(),
                json=payload,
            )
            response.raise_for_status()
            data = response.json()
            results = [
                {
                    "title": result.get("title", ""),
                    "url": result.get("url", ""),
                    "domain": _extract_domain(result.get("url", "")),
                    "snippet": result.get("text", "")[:500],
                    "published_date": result.get("published_date"),
                }
                for result in data.get("results", [])
            ]
            cost = _extract_exa_cost(data)
            return results, cost
        except httpx.HTTPStatusError as e:
            logger.warning(f"Exa social search HTTP error: {e.response.status_code} for query: {query}")
            return [], 0.0
        except httpx.RequestError as e:
            logger.warning(f"Exa social search request error: {e} for query: {query}")
            return [], 0.0
        except asyncio.TimeoutError:
            logger.warning(f"Exa social search timeout for query: {query}")
            return [], 0.0


async def search_targeted(
    query: str, focus: str, platforms: list[str] | None = None, num_results: int = 15, mode: str = "pharma"
) -> tuple[list[dict[str, Any]], list[dict[str, Any]], float]:
    academic_task = search_academic(f"{query} {focus}", num_results=num_results, mode=mode)
    social_task = search_social(f"{query} {focus}", platforms=platforms, num_results=num_results, mode=mode)

    (academic_results, academic_cost), (social_results, social_cost) = await asyncio.gather(academic_task, social_task)
    return academic_results, social_results, academic_cost + social_cost


def _extract_domain(url: str) -> str:
    if not url:
        return ""
    try:
        from urllib.parse import urlparse
        parsed = urlparse(url)
        return parsed.netloc.replace("www.", "")
    except Exception:
        return url
