from fastapi import APIRouter
from sqlalchemy.ext.asyncio import async_sessionmaker
from app.database import engine
from app.models import Query
from app.schemas import SearchRequest, SearchResponse
from app.services import analysis as analysis_service

router = APIRouter(prefix="/api", tags=["search"])


@router.post("/search", response_model=SearchResponse)
async def search_medication(request: SearchRequest):
    async with async_sessionmaker(engine, expire_on_commit=False)() as session:
        results = await analysis_service.run_analysis(request.query.strip())

        query = Query(
            medication_name=request.query.strip(),
            summary=results["summary"],
            overall_alignment=results["overall_alignment"] or 0.0,
            comparison_matrix=results["comparison_matrix"],
            academic_sources=results["academic_results"],
            social_sources=results["social_results"],
        )
        session.add(query)
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
            created_at=query.created_at,
        )
