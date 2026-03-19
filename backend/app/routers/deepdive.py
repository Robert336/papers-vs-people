from fastapi import APIRouter, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import async_sessionmaker
from app.database import engine
from app.models import Query, DeepDive
from app.schemas import DeepDiveRequest, DeepDiveResponse
from app.services import analysis as analysis_service

router = APIRouter(prefix="/api", tags=["deepdive"])


@router.post("/deepdive", response_model=DeepDiveResponse)
async def deep_dive(request: DeepDiveRequest):
    async with async_sessionmaker(engine, expire_on_commit=False)() as session:
        result = await session.execute(
            select(Query).where(Query.id == request.query_id)
        )
        query = result.scalar_one_or_none()
        if not query:
            raise HTTPException(status_code=404, detail="Query not found")

        deep_results = await analysis_service.run_deep_dive(
            query.medication_name, request.aspect_name
        )

        deep_dive = DeepDive(
            query_id=request.query_id,
            aspect_name=request.aspect_name,
            detailed_analysis=deep_results["analysis"],
            academic_sources=deep_results["academic_results"],
            social_sources=deep_results["social_results"],
        )
        session.add(deep_dive)
        await session.commit()
        await session.refresh(deep_dive)

        return DeepDiveResponse(
            id=deep_dive.id,
            query_id=deep_dive.query_id,
            aspect_name=deep_dive.aspect_name,
            detailed_analysis=deep_dive.detailed_analysis,
            academic_sources=deep_dive.academic_sources,
            social_sources=deep_dive.social_sources,
            created_at=deep_dive.created_at,
        )
