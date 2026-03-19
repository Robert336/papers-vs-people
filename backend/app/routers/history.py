from fastapi import APIRouter, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import async_sessionmaker
from app.database import engine
from app.models import Query
from app.schemas import HistoryItem, SearchResponse

router = APIRouter(prefix="/api", tags=["history"])


async def get_session() -> AsyncSession:
    async_session = async_sessionmaker(engine, expire_on_commit=False)
    async with async_session() as session:
        return session


@router.get("/history", response_model=list[HistoryItem])
async def get_history():
    async with async_sessionmaker(engine, expire_on_commit=False)() as session:
        result = await session.execute(
            select(Query).order_by(desc(Query.created_at)).limit(50)
        )
        queries = result.scalars().all()
        return [
            HistoryItem(
                id=q.id,
                medication_name=q.medication_name,
                overall_alignment=q.overall_alignment,
                created_at=q.created_at,
            )
            for q in queries
        ]


@router.get("/history/{query_id}", response_model=SearchResponse)
async def get_history_item(query_id: int):
    async with async_sessionmaker(engine, expire_on_commit=False)() as session:
        result = await session.execute(
            select(Query).where(Query.id == query_id)
        )
        query = result.scalar_one_or_none()
        if not query:
            raise HTTPException(status_code=404, detail="Query not found")
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


@router.delete("/history/{query_id}")
async def delete_history_item(query_id: int):
    async with async_sessionmaker(engine, expire_on_commit=False)() as session:
        result = await session.execute(
            select(Query).where(Query.id == query_id)
        )
        query = result.scalar_one_or_none()
        if not query:
            raise HTTPException(status_code=404, detail="Query not found")
        await session.delete(query)
        await session.commit()
        return {"message": "Query deleted successfully"}
