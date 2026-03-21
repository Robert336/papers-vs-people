import time
import asyncio
from app.services import exa_service, llm_service
from app.services.metrics_collector import MetricsCollector, extract_alignment_stats
from typing import Any


async def _timed_search(coro, search_type: str, metrics: MetricsCollector) -> tuple[list[dict], int, float]:
    start = time.perf_counter()
    results, cost = await coro
    latency_ms = int((time.perf_counter() - start) * 1000)
    if search_type == "academic":
        metrics.record_academic_search(results, latency_ms)
    else:
        metrics.record_social_search(results, latency_ms)
    return results, latency_ms, cost


async def run_analysis(medication: str, social_platforms: list[str] | None = None, model: str | None = None, mode: str = "pharma") -> dict[str, Any]:
    collector = MetricsCollector()
    pipeline_start = time.perf_counter()

    academic_task = exa_service.search_academic(medication, num_results=15, mode=mode)
    social_task = exa_service.search_social(medication, platforms=social_platforms, num_results=20, mode=mode)
    (academic_results, academic_latency_ms, academic_search_cost), (social_results, social_latency_ms, social_search_cost) = await asyncio.gather(
        _timed_search(academic_task, "academic", collector),
        _timed_search(social_task, "social", collector),
    )

    total_cost = academic_search_cost + social_search_cost

    if not academic_results and not social_results:
        subject = "medication" if mode == "pharma" else "natural remedy or supplement"
        return {
            "summary": (
                f"No search results found for '{medication}'. "
                f"This could mean the {subject} name is uncommon, "
                "or your EXA_API_KEY may not be configured correctly."
            ),
            "overall_alignment": None,
            "comparison_matrix": {"aspects": []},
            "academic_results": [],
            "social_results": [],
            "social_platforms": social_platforms,
            "mode": mode,
            "cost": 0.0,
        }

    all_results = academic_results + social_results

    summary_task = llm_service.generate_summary(medication, all_results, model=model, mode=mode)
    matrix_task = llm_service.generate_matrix(medication, academic_results, social_results, model=model, mode=mode)

    llm_start = time.perf_counter()
    summary_result, matrix_result = await summary_task, await matrix_task
    llm_latency_ms = int((time.perf_counter() - llm_start) * 1000)

    summary, summary_cost = summary_result if isinstance(summary_result, tuple) else (summary_result, 0.0)
    matrix, matrix_cost = matrix_result if isinstance(matrix_result, tuple) else (matrix_result, 0.0)
    
    collector.record_llm_call(llm_latency_ms)
    collector.record_matrix(matrix)
    collector.record_model(model)

    total_cost += summary_cost + matrix_cost

    aspects = matrix.get("aspects", [])
    if aspects:
        scores = []
        for a in aspects:
            alignment = a.get("alignment")
            if alignment is not None:
                try:
                    scores.append(float(alignment))
                except (TypeError, ValueError):
                    pass
        if scores:
            overall_alignment = sum(scores) / len(scores)
        else:
            overall_alignment = None
    else:
        overall_alignment = None

    pipeline_latency_ms = int((time.perf_counter() - pipeline_start) * 1000)

    return {
        "summary": summary,
        "overall_alignment": overall_alignment,
        "comparison_matrix": {"aspects": aspects},
        "academic_results": academic_results,
        "social_results": social_results,
        "social_platforms": social_platforms,
        "model_used": model,
        "mode": mode,
        "cost": total_cost,
        "_metrics": collector.finalize(pipeline_latency_ms),
    }


async def run_deep_dive(
    medication: str, aspect: str, platforms: list[str] | None = None, model: str | None = None, mode: str = "pharma"
) -> dict[str, Any]:
    academic_results, social_results, search_cost = await exa_service.search_targeted(
        medication, aspect, platforms=platforms, num_results=10, mode=mode
    )

    analysis_result = await llm_service.generate_deep_dive(
        medication, aspect, academic_results, social_results, model=model, mode=mode
    )
    analysis, llm_cost = analysis_result if isinstance(analysis_result, tuple) else (analysis_result, 0.0)

    return {
        "analysis": analysis,
        "academic_results": academic_results,
        "social_results": social_results,
        "cost": search_cost + llm_cost,
    }
