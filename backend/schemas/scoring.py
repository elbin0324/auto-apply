"""Schemas for LLM-based job scoring."""

from pydantic import BaseModel, Field


class LLMScoreResult(BaseModel):
    """Single job score parsed from LLM JSON response."""

    job_index: int
    score: float  # LLM may return out-of-range; clamped to 0-100 downstream
    matched_skills: list[str] = Field(default_factory=list)
    missing_skills: list[str] = Field(default_factory=list)
    preferred_skills: list[str] = Field(default_factory=list)
    reasoning: str = ""


class LLMScoreFactors(BaseModel):
    """Stored in job_match_scores.factors JSONB column."""

    combined_method: str = "llm"
    model: str = ""
    matched_skills: list[str] = Field(default_factory=list)
    missing_skills: list[str] = Field(default_factory=list)
    preferred_skills: list[str] = Field(default_factory=list)
    reasoning: str = ""
    batch_id: str = ""
    latency_ms: int = 0
