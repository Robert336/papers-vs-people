from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from typing import Any


class SearchRequest(BaseModel):
    model_config = ConfigDict(protected_namespaces=())
    query: str = Field(..., min_length=1, max_length=255)
    social_platforms: list[str] | None = Field(default=None)
    model: str | None = Field(default=None)
    mode: str = Field(default="pharma", pattern="^(pharma|natural)$")


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
    model_config = ConfigDict(protected_namespaces=())
    id: int
    medication_name: str
    summary: str
    overall_alignment: float
    comparison_matrix: dict
    academic_sources: list[dict]
    social_sources: list[dict]
    social_platforms: list[str] | None = None
    created_at: datetime
    cost: float = 0.0
    model_used: str | None = None
    mode: str = "pharma"
    deep_dives: list[dict] = Field(default_factory=list)


class HistoryItem(BaseModel):
    model_config = ConfigDict(protected_namespaces=())
    id: int
    medication_name: str
    overall_alignment: float
    created_at: datetime
    model_used: str | None = None
    mode: str = "pharma"


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
    cost: float = 0.0


class CompareSearchRequest(BaseModel):
    model_config = ConfigDict(protected_namespaces=())
    query: str = Field(..., min_length=1, max_length=255)
    social_platforms: list[str] | None = Field(default=None)
    model_a: str = Field(...)
    model_b: str = Field(...)
    mode: str = Field(default="pharma", pattern="^(pharma|natural)$")


class CompareSearchResponse(BaseModel):
    result_a: SearchResponse
    result_b: SearchResponse


class OpenRouterModel(BaseModel):
    id: str
    name: str
    description: str | None = None
