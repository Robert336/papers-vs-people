import time
from typing import Any

ACADEMIC_DOMAINS = [
    "pubmed.gov",
    "ncbi.nlm.nih.gov",
    "clinicaltrials.gov",
    "fda.gov",
    "nih.gov",
    "cochrane.org",
    "sciencedirect.com",
    "springer.com",
    "wiley.com",
    "nejm.org",
    "thelancet.com",
    "jamanetwork.com",
    "bmj.com",
    "nature.com",
]

SOCIAL_DOMAINS = [
    "reddit.com",
    "x.com",
    "twitter.com",
    "drugs.com",
    "webmd.com",
    "youtube.com",
    "patient.info",
    "drugsforum.com",
    "redditinvestigator.com",
    "quora.com",
]


def calculate_domain_coverage(results: list[dict], expected_domains: list[str]) -> float:
    if not expected_domains:
        return 0.0
    found = {r.get("domain") for r in results if r.get("domain")}
    return len(found & set(expected_domains)) / len(expected_domains)


def extract_alignment_stats(matrix: dict[str, Any]) -> dict[str, Any]:
    aspects = matrix.get("aspects", [])
    if not aspects:
        return {"avg": None, "std": None, "min": None, "max": None, "count": 0}

    scores = [a.get("alignment", 0) for a in aspects if a.get("alignment") is not None]
    if not scores:
        return {"avg": None, "std": None, "min": None, "max": None, "count": len(aspects)}

    avg = sum(scores) / len(scores)
    variance = sum((s - avg) ** 2 for s in scores) / len(scores)
    return {
        "avg": round(avg, 3),
        "std": round(variance**0.5, 3),
        "min": round(min(scores), 3),
        "max": round(max(scores), 3),
        "count": len(scores),
    }


class MetricsCollector:
    def __init__(self):
        self._query_id: int | None = None
        self._pipeline_start: float = time.perf_counter()
        self._academic_results: list[dict] | None = None
        self._social_results: list[dict] | None = None
        self._academic_latency_ms: int = 0
        self._social_latency_ms: int = 0
        self._academic_error: str | None = None
        self._social_error: str | None = None
        self._llm_latency_ms: int = 0
        self._llm_error: str | None = None
        self._matrix: dict[str, Any] | None = None
        self._model_used: str | None = None

    def set_query_id(self, query_id: int):
        self._query_id = query_id

    def record_search_start(self):
        self._search_start = time.perf_counter()

    def record_academic_search(
        self,
        results: list[dict],
        latency_ms: int,
        error: str | None = None,
    ):
        self._academic_results = results
        self._academic_latency_ms = latency_ms
        self._academic_error = error

    def record_social_search(
        self,
        results: list[dict],
        latency_ms: int,
        error: str | None = None,
    ):
        self._social_results = results
        self._social_latency_ms = latency_ms
        self._social_error = error

    def record_llm_call(self, latency_ms: int, error: str | None = None):
        self._llm_latency_ms = latency_ms
        self._llm_error = error

    def record_matrix(self, matrix: dict[str, Any]):
        self._matrix = matrix

    def record_model(self, model: str | None):
        self._model_used = model

    def finalize(self, pipeline_latency_ms: int) -> dict[str, Any]:
        academic_count = len(self._academic_results) if self._academic_results else 0
        social_count = len(self._social_results) if self._social_results else 0
        search_latency = self._academic_latency_ms + self._social_latency_ms

        academic_coverage = calculate_domain_coverage(
            self._academic_results or [], ACADEMIC_DOMAINS
        )
        social_coverage = calculate_domain_coverage(
            self._social_results or [], SOCIAL_DOMAINS
        )

        alignment_stats = extract_alignment_stats(self._matrix or {})

        status = "success"
        if self._academic_error or self._social_error:
            status = "partial"
        if not self._academic_results and not self._social_results:
            status = "failed"

        return {
            "query_id": self._query_id,
            "search_academic_count": academic_count,
            "search_social_count": social_count,
            "academic_domain_coverage": academic_coverage,
            "social_domain_coverage": social_coverage,
            "search_latency_ms": search_latency,
            "search_error": self._academic_error or self._social_error,
            "llm_latency_ms": self._llm_latency_ms,
            "alignment_score_avg": alignment_stats.get("avg"),
            "alignment_score_std": alignment_stats.get("std"),
            "alignment_score_min": alignment_stats.get("min"),
            "alignment_score_max": alignment_stats.get("max"),
            "aspects_populated": alignment_stats.get("count", 0),
            "llm_error": self._llm_error,
            "model_used": self._model_used,
            "pipeline_latency_ms": pipeline_latency_ms,
            "status": status,
        }
