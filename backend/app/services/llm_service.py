from httpx import AsyncClient
import json
import logging
from app.config import get_settings
from typing import Any

logger = logging.getLogger(__name__)
settings = get_settings()

LLMCallResult = tuple[str, dict[str, Any]]

SYSTEM_PROMPTS = {
    "pharma": """You are an expert medical research analyst helping bridge the gap between academic research and real-world patient experiences. Your task is to analyze search results about a medication and produce structured, objective comparisons.

IMPORTANT RULES:
- Always write in plain, layman's language — avoid jargon
- Be balanced: acknowledge both what research supports AND where real-world experiences diverge
- Always cite sources when making specific claims
- If search results are sparse or missing, acknowledge that honestly
- Alignment scores should reflect genuine convergence or divergence between research and user reports
""",
    "natural": """You are an expert research analyst specializing in natural medicine, herbal remedies, and dietary supplements. Your task is to analyze search results about a natural remedy or supplement and compare clinical research with real-world user experiences.

IMPORTANT RULES:
- Always write in plain, layman's language — avoid jargon
- Be balanced: acknowledge both what research supports AND where real-world experiences diverge
- Always cite sources when making specific claims
- If search results are sparse or missing, acknowledge that honestly
- Note where traditional/historical use exceeds what clinical evidence currently supports
- Flag potential herb-drug interactions and quality/sourcing concerns
- Distinguish between well-studied supplements and those with limited evidence
- Alignment scores should reflect genuine convergence or divergence between research and user reports
""",
}

SYSTEM_PROMPT = SYSTEM_PROMPTS["pharma"]


SUMMARY_PROMPT = """Given the following search results about "{medication}", produce a 2-paragraph plain-language summary explaining what this {subject} is and its key characteristics.

IMPORTANT - CITATION RULES:
- Use `[N]` citation markers in your text, where N is a 1-based number referring to sources
- For academic/clinical sources: cite using [1], [2], [3]... in order of appearance
- For social/patient sources: cite using [A1], [A2], [A3]... in order of appearance
- Only cite sources that are genuinely referenced in your summary
- Each citation will be rendered as a clickable superscript link to the full source

Return your response as a JSON object with this exact structure:
{{
  "summary": "Your 2-paragraph plain-language summary here with [1], [2] citation markers..."
}}

Search Results:
{results}
"""

MATRIX_PROMPT = """You are analyzing "{medication}" comparing academic research findings vs. real-world patient experiences from social sources.

IMPORTANT - CITATION RULES:
- Use `[N]` citation markers in your text, where N is a 1-based number
- For academic sources: cite using [1], [2], [3]... in order of appearance
- For social/patient sources: cite using [A1], [A2], [A3]... in order of appearance
- Each citation will be rendered as a clickable superscript link to the full source
- Only cite sources that are genuinely referenced in your analysis

Analyze both sets of search results and produce a structured comparison matrix covering these aspects:
{aspects}

Return a JSON object with this exact structure:
{{
  "aspects": [
    {{
      "name": "Aspect Name",
      "academia": {{
        "summary": "What clinical research says about this aspect [1], [2] (plain language, 1-2 sentences)",
        "key_findings": ["Specific finding 1 [1]", "Specific finding 2 [2]"],
        "sources": [
          {{"title": "Paper or Article Title", "url": "https://...", "domain": "pubmed.gov"}}
        ]
      }},
      "reality": {{
        "summary": "What real users report about this aspect [A1], [A2] (plain language, 1-2 sentences)",
        "key_findings": ["Specific finding 1 [A1]", "Specific finding 2 [A2]"],
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
- Academic sources use numbers [1], [2], etc.
- Social sources use letters [A1], [A2], etc. to distinguish from academic

Academic Search Results:
{academic_results}

Social/Patient Search Results:
{social_results}
"""

MATRIX_ASPECTS = {
    "pharma": """1. Efficacy / Primary Effects
2. Side Effects
3. Onset Time
4. Duration of Effects
5. Tolerance / Long-term Use
6. Withdrawal / Discontinuation
7. Quality of Life Impact
8. Dosage Experiences
9. Accessibility / Cost
10. Drug Interactions""",
    "natural": """1. Efficacy / Primary Effects
2. Side Effects
3. Onset Time
4. Duration of Effects
5. Tolerance / Long-term Use
6. Withdrawal / Discontinuation
7. Quality of Life Impact
8. Dosage & Preparation (e.g., tea, tincture, capsule, topical)
9. Quality & Sourcing (e.g., standardization, third-party testing, contamination risks)
10. Accessibility / Cost
11. Herb-Drug Interactions""",
}

DEEPDIVE_PROMPT = """You are doing a deep-dive analysis on the aspect "{aspect}" for the medication "{medication}".

IMPORTANT - CITATION RULES:
- Use `[N]` citation markers in your text, where N is a 1-based number
- For academic sources: cite using [1], [2], [3]... in order of appearance
- For social/patient sources: cite using [A1], [A2], [A3]... in order of appearance
- Each citation will be rendered as a clickable superscript link to the full source
- Only cite sources that are genuinely referenced in your analysis

Analyze the provided search results and produce a detailed breakdown.

Return a JSON object with this exact structure:
{{
  "summary": "Detailed plain-language summary of {aspect} for {medication} [1], [2]",
  "key_points": [
    "Specific key point about this aspect [1], with research vs reality comparison",
    "Another key finding [2], [A1]",
    ...
  ],
  "gaps": [
    "A gap or disconnect between what research studies [1] and what patients report [A1]",
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
- Academic sources use numbers [1], [2], etc.
- Social sources use letters [A1], [A2], etc. to distinguish from academic

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


async def _call_openrouter(system: str, user: str, model: str | None = None) -> LLMCallResult:
    if not settings.openrouter_api_key:
        raise ValueError("OPENROUTER_API_KEY is not set. Please add it to your .env file.")

    payload = {
        "model": model or settings.openrouter_model,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        "temperature": 0.3,
    }

    try:
        async with AsyncClient(timeout=60.0) as client:
            response = await client.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers=_build_headers(),
                json=payload,
            )
            response.raise_for_status()
            data = response.json()
            content = data["choices"][0]["message"]["content"]
            usage = data.get("usage", {})
            cost = usage.get("cost") or _estimate_cost(usage)
            return content, {"usage": usage, "cost": cost}
    except json.JSONDecodeError as e:
        logger.warning(f"LLM JSON parse error: {e}")
        raise
    except Exception as e:
        logger.warning(f"LLM API error: {type(e).__name__}: {e}")
        raise


def _estimate_cost(usage: dict[str, Any]) -> float:
    tokens_in = usage.get("prompt_tokens", 0)
    tokens_out = usage.get("completion_tokens", 0)
    prompt_cost_per_mtok = 0.00015
    completion_cost_per_mtok = 0.0006
    return round((tokens_in * prompt_cost_per_mtok + tokens_out * completion_cost_per_mtok) / 1000, 6)


def _extract_json(content: str) -> str:
    stripped = content.strip()
    if stripped.startswith("```"):
        lines = stripped.split("\n")
        if len(lines) > 2 and lines[-1].strip() == "```":
            return "\n".join(lines[1:-1]).strip()
    return stripped


async def generate_summary(medication: str, all_results: list[dict], model: str | None = None, mode: str = "pharma") -> tuple[str, float]:
    results_text = "\n\n".join(
        f"Source: {r.get('domain','')} - {r.get('title','')}\n{r.get('snippet','')}"
        for r in all_results[:20]
    )

    subject = "medication" if mode == "pharma" else "natural remedy or supplement"
    system = SYSTEM_PROMPTS.get(mode, SYSTEM_PROMPTS["pharma"])

    content, usage_info = await _call_openrouter(
        system,
        SUMMARY_PROMPT.format(medication=medication, results=results_text, subject=subject),
        model=model,
    )

    try:
        parsed = json.loads(_extract_json(content))
        return parsed.get("summary", content), usage_info["cost"]
    except json.JSONDecodeError:
        return content, usage_info["cost"]


async def generate_matrix(
    medication: str, academic_results: list[dict], social_results: list[dict], model: str | None = None, mode: str = "pharma"
) -> tuple[dict[str, Any], float]:
    academic_text = "\n\n".join(
        f"[{r.get('domain','')}] {r.get('title','')}\n{r.get('snippet','')}"
        for r in academic_results[:15]
    )

    social_text = "\n\n".join(
        f"[{r.get('domain','')}] {r.get('title','')}\n{r.get('snippet','')}"
        for r in social_results[:20]
    )

    system = SYSTEM_PROMPTS.get(mode, SYSTEM_PROMPTS["pharma"])
    aspects = MATRIX_ASPECTS.get(mode, MATRIX_ASPECTS["pharma"])

    content, usage_info = await _call_openrouter(
        system,
        MATRIX_PROMPT.format(
            medication=medication,
            academic_results=academic_text,
            social_results=social_text,
            aspects=aspects,
        ),
        model=model,
    )

    try:
        parsed = json.loads(_extract_json(content))
        return parsed, usage_info["cost"]
    except json.JSONDecodeError:
        return {"aspects": [], "raw_response": content}, usage_info["cost"]


async def generate_deep_dive(
    medication: str, aspect: str, academic_results: list[dict], social_results: list[dict],
    model: str | None = None, mode: str = "pharma",
) -> tuple[dict[str, Any], float]:
    academic_text = "\n\n".join(
        f"[{r.get('domain','')}] {r.get('title','')}\n{r.get('snippet','')}"
        for r in academic_results[:10]
    )

    social_text = "\n\n".join(
        f"[{r.get('domain','')}] {r.get('title','')}\n{r.get('snippet','')}"
        for r in social_results[:15]
    )

    system = SYSTEM_PROMPTS.get(mode, SYSTEM_PROMPTS["pharma"])

    content, usage_info = await _call_openrouter(
        system,
        DEEPDIVE_PROMPT.format(
            medication=medication,
            aspect=aspect,
            academic_results=academic_text,
            social_results=social_text,
        ),
        model=model,
    )

    try:
        parsed = json.loads(_extract_json(content))
        return parsed, usage_info["cost"]
    except json.JSONDecodeError:
        return {"summary": content, "key_points": [], "gaps": [], "sources": []}, usage_info["cost"]
