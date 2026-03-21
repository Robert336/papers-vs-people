from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy import text, inspect, delete
from sqlalchemy.orm import DeclarativeBase
from datetime import datetime, timedelta
from app.config import get_settings

settings = get_settings()

engine = create_async_engine(settings.db_url, echo=False)
async_session_maker = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncSession:
    async with async_session_maker() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def run_migrations():
    async with engine.begin() as conn:
        await conn.run_sync(_run_migrations_sync)


def _run_migrations_sync(connection):
    inspector = inspect(connection)
    tables = inspector.get_table_names()
    
    if 'queries' in tables:
        columns = [col['name'] for col in inspector.get_columns('queries')]
        if 'social_platforms' not in columns:
            connection.execute(
                text("ALTER TABLE queries ADD COLUMN social_platforms TEXT")
            )
        if 'model_used' not in columns:
            connection.execute(
                text("ALTER TABLE queries ADD COLUMN model_used VARCHAR(255)")
            )
        if 'mode' not in columns:
            connection.execute(
                text("ALTER TABLE queries ADD COLUMN mode VARCHAR(50) NOT NULL DEFAULT 'pharma'")
            )
        if 'cost' not in columns:
            connection.execute(
                text("ALTER TABLE queries ADD COLUMN cost FLOAT DEFAULT 0.0")
            )

    if 'query_metrics' in tables:
        columns = [col['name'] for col in inspector.get_columns('query_metrics')]
        if 'model_used' not in columns:
            connection.execute(
                text("ALTER TABLE query_metrics ADD COLUMN model_used VARCHAR(255)")
            )
    
    if 'deep_dives' in tables:
        columns = [col['name'] for col in inspector.get_columns('deep_dives')]
        if 'cost' not in columns:
            connection.execute(
                text("ALTER TABLE deep_dives ADD COLUMN cost FLOAT DEFAULT 0.0")
            )


async def prune_old_metrics(days: int = 90):
    from app.models import QueryMetrics
    cutoff = datetime.utcnow() - timedelta(days=days)
    async with async_session_maker() as session:
        result = await session.execute(
            delete(QueryMetrics).where(QueryMetrics.timestamp < cutoff)
        )
        await session.commit()
        return result.rowcount


async def backfill_model_used():
    from app.models import Query
    async with async_session_maker() as session:
        result = await session.execute(
            text("UPDATE queries SET model_used = 'openai/gpt-5.4' WHERE model_used IS NULL")
        )
        await session.commit()
        return result.rowcount
