from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship, Mapped, mapped_column
from datetime import datetime
from typing import Optional, List
from app.database import Base


class Query(Base):
    __tablename__ = "queries"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    medication_name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    overall_alignment: Mapped[float] = mapped_column(Float, nullable=False)
    comparison_matrix: Mapped[dict] = mapped_column(JSON, nullable=False)
    academic_sources: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    social_sources: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    social_platforms: Mapped[list] = mapped_column(JSON, nullable=True, default=None)
    model_used: Mapped[str | None] = mapped_column(String(255), nullable=True, default=None)
    mode: Mapped[str] = mapped_column(String(50), nullable=False, default="pharma")
    cost: Mapped[float] = mapped_column(Float, default=0.0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    deep_dives: Mapped[List["DeepDive"]] = relationship(
        "DeepDive", back_populates="query", cascade="all, delete-orphan"
    )

    metrics: Mapped["QueryMetrics"] = relationship(
        "QueryMetrics", back_populates="query", uselist=False, cascade="all, delete-orphan"
    )


class QueryMetrics(Base):
    __tablename__ = "query_metrics"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    query_id: Mapped[int] = mapped_column(Integer, ForeignKey("queries.id", ondelete="CASCADE"), unique=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    search_academic_count: Mapped[int] = mapped_column(Integer, default=0)
    search_social_count: Mapped[int] = mapped_column(Integer, default=0)
    academic_domain_coverage: Mapped[float] = mapped_column(Float, default=0.0)
    social_domain_coverage: Mapped[float] = mapped_column(Float, default=0.0)
    search_latency_ms: Mapped[int] = mapped_column(Integer, default=0)
    search_error: Mapped[str | None] = mapped_column(String(100), nullable=True)

    llm_latency_ms: Mapped[int] = mapped_column(Integer, default=0)
    alignment_score_avg: Mapped[float | None] = mapped_column(Float, nullable=True)
    alignment_score_std: Mapped[float | None] = mapped_column(Float, nullable=True)
    alignment_score_min: Mapped[float | None] = mapped_column(Float, nullable=True)
    alignment_score_max: Mapped[float | None] = mapped_column(Float, nullable=True)
    aspects_populated: Mapped[int] = mapped_column(Integer, default=0)
    llm_error: Mapped[str | None] = mapped_column(String(100), nullable=True)

    model_used: Mapped[str | None] = mapped_column(String(255), nullable=True, default=None)
    pipeline_latency_ms: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[str] = mapped_column(String(20), default="pending")

    query: Mapped["Query"] = relationship("Query", back_populates="metrics")


class DeepDive(Base):
    __tablename__ = "deep_dives"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    query_id: Mapped[int] = mapped_column(Integer, ForeignKey("queries.id", ondelete="CASCADE"), nullable=False)
    aspect_name: Mapped[str] = mapped_column(String(255), nullable=False)
    detailed_analysis: Mapped[dict] = mapped_column(JSON, nullable=False)
    academic_sources: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    social_sources: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    cost: Mapped[float] = mapped_column(Float, default=0.0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    query: Mapped["Query"] = relationship("Query", back_populates="deep_dives")
