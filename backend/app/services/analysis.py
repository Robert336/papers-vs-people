from app.services import exa_service, llm_service
from typing import Any


async def run_analysis(medication: str) -> dict[str, Any]:
    academic_results, social_results = await exa_service.search_academic(
        medication, num_results=15
    ), await exa_service.search_social(medication, num_results=20)

    if not academic_results and not social_results:
        return {
            "summary": (
                f"No search results found for '{medication}'. "
                "This could mean the medication name is uncommon, "
                "or your EXA_API_KEY may not be configured correctly."
            ),
            "overall_alignment": None,
            "comparison_matrix": {"aspects": []},
            "academic_results": [],
            "social_results": [],
        }

    all_results = academic_results + social_results

    summary_task = llm_service.generate_summary(medication, all_results)
    matrix_task = llm_service.generate_matrix(medication, academic_results, social_results)

    summary, matrix = await summary_task, await matrix_task

    aspects = matrix.get("aspects", [])
    overall_alignment = (
        sum(a.get("alignment", 0) for a in aspects) / len(aspects)
        if aspects
        else None
    )

    return {
        "summary": summary,
        "overall_alignment": overall_alignment,
        "comparison_matrix": {"aspects": aspects},
        "academic_results": academic_results,
        "social_results": social_results,
    }


async def run_deep_dive(
    medication: str, aspect: str
) -> dict[str, Any]:
    academic_results, social_results = await exa_service.search_targeted(
        medication, aspect, num_results=10
    )

    analysis = await llm_service.generate_deep_dive(
        medication, aspect, academic_results, social_results
    )

    return {
        "analysis": analysis,
        "academic_results": academic_results,
        "social_results": social_results,
    }
