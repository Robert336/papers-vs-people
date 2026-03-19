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
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    deep_dives: Mapped[List["DeepDive"]] = relationship(
        "DeepDive", back_populates="query", cascade="all, delete-orphan"
    )


class DeepDive(Base):
    __tablename__ = "deep_dives"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    query_id: Mapped[int] = mapped_column(Integer, ForeignKey("queries.id", ondelete="CASCADE"), nullable=False)
    aspect_name: Mapped[str] = mapped_column(String(255), nullable=False)
    detailed_analysis: Mapped[dict] = mapped_column(JSON, nullable=False)
    academic_sources: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    social_sources: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    query: Mapped["Query"] = relationship("Query", back_populates="deep_dives")
