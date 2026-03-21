import asyncio
import logging
from fastapi import APIRouter
from sqlalchemy.ext.asyncio import async_sessionmaker
from app.database import engine
from app.models import Query, QueryMetrics
from app.schemas import SearchRequest, SearchResponse, CompareSearchRequest, CompareSearchResponse
from app.services import analysis as analysis_service
from app.config import get_settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["search"])

settings = get_settings()


def _resolve_model(model: str | None) -> str:
    return model or settings.openrouter_model


async def _run_and_save(request_model: str | None, query_text: str, social_platforms: list[str] | None, mode: str = "pharma") -> SearchResponse:
    resolved_model = _resolve_model(request_model)
    async with async_sessionmaker(engine, expire_on_commit=False)() as session:
        results = await analysis_service.run_analysis(
            query_text.strip(),
            social_platforms=social_platforms,
            model=resolved_model,
            mode=mode,
        )

        query = Query(
            medication_name=query_text.strip(),
            summary=results["summary"],
            overall_alignment=results["overall_alignment"] or 0.0,
            comparison_matrix=results["comparison_matrix"],
            academic_sources=results["academic_results"],
            social_sources=results["social_results"],
            social_platforms=results["social_platforms"],
            model_used=resolved_model,
            mode=mode,
            cost=results.get("cost", 0.0),
        )
        session.add(query)
        await session.flush()

        metrics_data = results.get("_metrics", {})
        if metrics_data:
            metrics = QueryMetrics(
                query_id=query.id,
                search_academic_count=metrics_data.get("search_academic_count", 0),
                search_social_count=metrics_data.get("search_social_count", 0),
                academic_domain_coverage=metrics_data.get("academic_domain_coverage", 0.0),
                social_domain_coverage=metrics_data.get("social_domain_coverage", 0.0),
                search_latency_ms=metrics_data.get("search_latency_ms", 0),
                search_error=metrics_data.get("search_error"),
                llm_latency_ms=metrics_data.get("llm_latency_ms", 0),
                alignment_score_avg=metrics_data.get("alignment_score_avg"),
                alignment_score_std=metrics_data.get("alignment_score_std"),
                alignment_score_min=metrics_data.get("alignment_score_min"),
                alignment_score_max=metrics_data.get("alignment_score_max"),
                aspects_populated=metrics_data.get("aspects_populated", 0),
                llm_error=metrics_data.get("llm_error"),
                model_used=resolved_model,
                pipeline_latency_ms=metrics_data.get("pipeline_latency_ms", 0),
                status=metrics_data.get("status", "success"),
            )
            session.add(metrics)

        await session.commit()
        await session.refresh(query)

        return SearchResponse(
            id=query.id,
            medication_name=query.medication_name,
            summary=query.summary,
            overall_alignment=query.overall_alignment,
            comparison_matrix=query.comparison_matrix,
            academic_sources=query.academic_sources,
            social_sources=query.social_sources,
            social_platforms=query.social_platforms,
            created_at=query.created_at,
            cost=results.get("cost", 0.0),
            model_used=resolved_model,
            mode=mode,
        )


@router.post("/search", response_model=SearchResponse)
async def search_medication(request: SearchRequest):
    return await _run_and_save(request.model, request.query, request.social_platforms, mode=request.mode)


@router.post("/search/compare", response_model=CompareSearchResponse)
async def compare_models(request: CompareSearchRequest):
    results = await asyncio.gather(
        _run_and_save(request.model_a, request.query, request.social_platforms, mode=request.mode),
        _run_and_save(request.model_b, request.query, request.social_platforms, mode=request.mode),
        return_exceptions=True,
    )
    
    result_a = results[0]
    result_b = results[1]
    
    if isinstance(result_a, Exception):
        logger.error(f"Model A ({request.model_a}) failed: {result_a}")
        raise result_a
    
    if isinstance(result_b, Exception):
        logger.error(f"Model B ({request.model_b}) failed: {result_b}")
        raise result_b
    
    return CompareSearchResponse(result_a=result_a, result_b=result_b)
