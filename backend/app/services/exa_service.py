import httpx
from app.config import get_settings
from typing import Any

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


def _build_exa_headers() -> dict:
    if not settings.exa_api_key:
        raise ValueError("EXA_API_KEY is not set. Please add it to your .env file.")
    return {
        "x-api-key": settings.exa_api_key,
        "Content-Type": "application/json",
    }


async def search_academic(query: str, num_results: int = 15) -> list[dict[str, Any]]:
    if not settings.exa_api_key:
        return []

    domains_query = " OR ".join(ACADEMIC_DOMAINS)
    payload = {
        "query": f"{query} clinical research efficacy side effects medical study",
        "num_results": num_results,
        "domains": ACADEMIC_DOMAINS,
        "type": "auto",
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
            return [
                {
                    "title": result.get("title", ""),
                    "url": result.get("url", ""),
                    "domain": _extract_domain(result.get("url", "")),
                    "snippet": result.get("text", "")[:500],
                    "published_date": result.get("published_date"),
                }
                for result in data.get("results", [])
            ]
        except httpx.HTTPStatusError as e:
            return []


async def search_social(query: str, num_results: int = 20) -> list[dict[str, Any]]:
    if not settings.exa_api_key:
        return []

    payload = {
        "query": f"{query} experience review side effects personal testimonial",
        "num_results": num_results,
        "domains": SOCIAL_DOMAINS,
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
            return [
                {
                    "title": result.get("title", ""),
                    "url": result.get("url", ""),
                    "domain": _extract_domain(result.get("url", "")),
                    "snippet": result.get("text", "")[:500],
                    "published_date": result.get("published_date"),
                }
                for result in data.get("results", [])
            ]
        except httpx.HTTPStatusError as e:
            return []


async def search_targeted(
    query: str, focus: str, num_results: int = 15
) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    academic_task = search_academic(f"{query} {focus}", num_results=num_results)
    social_task = search_social(f"{query} {focus}", num_results=num_results)

    academic_results, social_results = await asyncio.gather(academic_task, social_task)
    return academic_results, social_results


def _extract_domain(url: str) -> str:
    if not url:
        return ""
    try:
        from urllib.parse import urlparse
        parsed = urlparse(url)
        return parsed.netloc.replace("www.", "")
    except Exception:
        return url


import asyncio
