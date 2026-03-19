from pydantic import BaseModel, Field
from datetime import datetime
from typing import Any


class SearchRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=255)


class SourceItem(BaseModel):
    title: str
    url: str
    domain: str


class AspectAcademia(BaseModel):
    summary: str
    key_findings: list[str]
    sources: list[SourceItem]


class AspectReality(BaseModel):
    summary: str
    key_findings: list[str]
    sources: list[SourceItem]


class AspectEntry(BaseModel):
    name: str
    academia: AspectAcademia
    reality: AspectReality
    alignment: float = Field(..., ge=0.0, le=1.0)
    alignment_note: str


class ComparisonMatrix(BaseModel):
    aspects: list[AspectEntry]


class DeepDiveDetail(BaseModel):
    summary: str
    key_points: list[str]
    gaps: list[str]
    sources: list[SourceItem]


class SearchResponse(BaseModel):
    id: int
    medication_name: str
    summary: str
    overall_alignment: float
    comparison_matrix: dict
    academic_sources: list[dict]
    social_sources: list[dict]
    created_at: datetime


class HistoryItem(BaseModel):
    id: int
    medication_name: str
    overall_alignment: float
    created_at: datetime


class DeepDiveRequest(BaseModel):
    query_id: int
    aspect_name: str


class DeepDiveResponse(BaseModel):
    id: int
    query_id: int
    aspect_name: str
    detailed_analysis: dict
    academic_sources: list[dict]
    social_sources: list[dict]
    created_at: datetime
