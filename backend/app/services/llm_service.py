import httpx
import json
import asyncio
from app.config import get_settings
from typing import Any

settings = get_settings()

SYSTEM_PROMPT = """You are an expert medical research analyst helping bridge the gap between academic research and real-world patient experiences. Your task is to analyze search results about a medication and produce structured, objective comparisons.

IMPORTANT RULES:
- Always write in plain, layman's language — avoid jargon
- Be balanced: acknowledge both what research supports AND where real-world experiences diverge
- Always cite sources when making specific claims
- If search results are sparse or missing, acknowledge that honestly
- Alignment scores should reflect genuine convergence or divergence between research and user reports
"""


SUMMARY_PROMPT = """Given the following search results about "{medication}", produce a 2-paragraph plain-language summary explaining what this medication is and its key characteristics.

Return your response as a JSON object with this exact structure:
{{
  "summary": "Your 2-paragraph plain-language summary here..."
}}

Search Results:
{results}
"""

MATRIX_PROMPT = """You are analyzing "{medication}" comparing academic research findings vs. real-world patient experiences from social sources.

Analyze both sets of search results and produce a structured comparison matrix covering these aspects:
1. Efficacy / Primary Effects
2. Side Effects
3. Onset Time
4. Duration of Effects
5. Tolerance / Long-term Use
6. Withdrawal / Discontinuation
7. Quality of Life Impact
8. Dosage Experiences
9. Accessibility / Cost
10. Drug Interactions

Return a JSON object with this exact structure:
{{
  "aspects": [
    {{
      "name": "Aspect Name",
      "academia": {{
        "summary": "What clinical research says about this aspect (plain language, 1-2 sentences)",
        "key_findings": ["Specific finding 1", "Specific finding 2"],
        "sources": [
          {{"title": "Paper or Article Title", "url": "https://...", "domain": "pubmed.gov"}}
        ]
      }},
      "reality": {{
        "summary": "What real users report about this aspect (plain language, 1-2 sentences)",
        "key_findings": ["Specific finding 1", "Specific finding 2"],
        "sources": [
          {{"title": "Post or Comment Title", "url": "https://...", "domain": "reddit.com"}}
        ]
      }},
      "alignment": 0.82,
      "alignment_note": "1-2 sentence note explaining why alignment is this score and any notable gaps."
    }}
  ]
}}

Rules:
- alignment: float between 0.0 (completely opposite) and 1.0 (perfectly aligned)
- Include only sources that are genuinely cited in the search results
- If a source URL is not available from search results, leave sources arrays empty
- Be objective: if research and reality diverge significantly, reflect that honestly
- Write all summaries in plain layman's language

Academic Search Results:
{academic_results}

Social/Patient Search Results:
{social_results}
"""

DEEPDIVE_PROMPT = """You are doing a deep-dive analysis on the aspect "{aspect}" for the medication "{medication}".

Analyze the provided search results and produce a detailed breakdown.

Return a JSON object with this exact structure:
{{
  "summary": "Detailed plain-language summary of {aspect} for {medication}",
  "key_points": [
    "Specific key point about this aspect, with research vs reality comparison",
    ...
  ],
  "gaps": [
    "A gap or disconnect between what research studies and what patients report",
    ...
  ],
  "sources": [
    {{"title": "...", "url": "...", "domain": "..."}}
  ]
}}

Rules:
- key_points: 4-6 bullet points diving deep into this specific aspect
- gaps: 2-4 observations about where research fails to capture real-world experience
- sources: cite at least 3 sources from the search results
- Write everything in plain layman's language

Academic Results:
{academic_results}

Social/Patient Results:
{social_results}
"""


def _build_headers() -> dict:
    if not settings.openrouter_api_key:
        raise ValueError("OPENROUTER_API_KEY is not set. Please add it to your .env file.")
    return {
        "Authorization": f"Bearer {settings.openrouter_api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:5173",
        "X-Title": "Academia vs Reality",
    }


async def _call_openrouter(system: str, user: str) -> str:
    if not settings.openrouter_api_key:
        raise ValueError("OPENROUTER_API_KEY is not set. Please add it to your .env file.")

    payload = {
        "model": settings.openrouter_model,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        "temperature": 0.3,
    }

    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers=_build_headers(),
            json=payload,
        )
        response.raise_for_status()
        data = response.json()
        return data["choices"][0]["message"]["content"]


async def generate_summary(medication: str, all_results: list[dict]) -> str:
    results_text = "\n\n".join(
        f"Source: {r.get('domain','')} - {r.get('title','')}\n{r.get('snippet','')}"
        for r in all_results[:20]
    )

    response = await _call_openrouter(
        SYSTEM_PROMPT,
        SUMMARY_PROMPT.format(medication=medication, results=results_text),
    )

    try:
        parsed = json.loads(response)
        return parsed.get("summary", response)
    except json.JSONDecodeError:
        return response


async def generate_matrix(
    medication: str, academic_results: list[dict], social_results: list[dict]
) -> dict[str, Any]:
    academic_text = "\n\n".join(
        f"[{r.get('domain','')}] {r.get('title','')}\n{r.get('snippet','')}"
        for r in academic_results[:15]
    )

    social_text = "\n\n".join(
        f"[{r.get('domain','')}] {r.get('title','')}\n{r.get('snippet','')}"
        for r in social_results[:20]
    )

    response = await _call_openrouter(
        SYSTEM_PROMPT,
        MATRIX_PROMPT.format(
            medication=medication,
            academic_results=academic_text,
            social_results=social_text,
        ),
    )

    try:
        parsed = json.loads(response)
        return parsed
    except json.JSONDecodeError:
        return {"aspects": [], "raw_response": response}


async def generate_deep_dive(
    medication: str, aspect: str, academic_results: list[dict], social_results: list[dict]
) -> dict[str, Any]:
    academic_text = "\n\n".join(
        f"[{r.get('domain','')}] {r.get('title','')}\n{r.get('snippet','')}"
        for r in academic_results[:10]
    )

    social_text = "\n\n".join(
        f"[{r.get('domain','')}] {r.get('title','')}\n{r.get('snippet','')}"
        for r in social_results[:15]
    )

    response = await _call_openrouter(
        SYSTEM_PROMPT,
        DEEPDIVE_PROMPT.format(
            medication=medication,
            aspect=aspect,
            academic_results=academic_text,
            social_results=social_text,
        ),
    )

    try:
        parsed = json.loads(response)
        return parsed
    except json.JSONDecodeError:
        return {"summary": response, "key_points": [], "gaps": [], "sources": []}
