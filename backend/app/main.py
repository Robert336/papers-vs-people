from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.database import init_db, run_migrations
from app.routers import search, history, deepdive, models


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    await run_migrations()
    from app.database import backfill_model_used
    updated = await backfill_model_used()
    if updated > 0:
        print(f"Backfilled {updated} queries with default model 'openai/gpt-5.4'")
    yield


app = FastAPI(
    title="Academia vs Reality API",
    description="Compare academic research to real-world experiences for medications and health solutions",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(search.router)
app.include_router(history.router)
app.include_router(deepdive.router)
app.include_router(models.router)


@app.get("/api/health")
async def health_check():
    return {"status": "ok"}
