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
    summary: str = ""
    strengths: list[str] = Field(default_factory=list)
    concerns: list[str] = Field(default_factory=list)
    key_matches: list[str] = Field(default_factory=list)
    key_gaps: list[str] = Field(default_factory=list)


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


class StructuredAnalysis(BaseModel):
    """Stored in job_match_scores.structured_analysis JSONB column."""

    summary: str = ""
    strengths: list[str] = Field(default_factory=list)
    concerns: list[str] = Field(default_factory=list)
    key_matches: list[str] = Field(default_factory=list)
    key_gaps: list[str] = Field(default_factory=list)


def score_to_label(score: float) -> str:
    """Map a numeric score to a human-readable match label."""
    if score >= 90:
        return "Exceptional match"
    if score >= 75:
        return "Strong match"
    if score >= 60:
        return "Good match"
    if score >= 45:
        return "Moderate match"
    if score >= 30:
        return "Weak match"
    return "Poor match"


class MatchBreakdownResponse(BaseModel):
    """Extended match response for the job detail page."""

    job_id: str
    score: float
    label: str
    summary: str | None = None
    strengths: list[str] | None = None
    concerns: list[str] | None = None
    key_matches: list[str] | None = None
    key_gaps: list[str] | None = None
    factors: dict | None = None
    computed_at: str
