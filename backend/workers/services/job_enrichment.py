"""LLM-powered job description enrichment.

Sends raw job description text to Claude and extracts structured fields.
Follows the same pattern as resume_parser.py.
"""

import json
import logging
from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from config import get_settings
from models.job import Job
from schemas.enrichment import EnrichedJobData, EnrichmentStats
from infra.ai_client import chat_completion

logger = logging.getLogger(__name__)

JOB_ENRICHMENT_SYSTEM = """You are a job description parser. Given raw text from a job posting, extract structured data.
Return ONLY valid JSON matching this exact schema (no markdown, no explanation):

{
  "experience_level": "entry | mid | senior | lead | executive | null",
  "employment_type": "full_time | part_time | contract | internship | null",
  "years_experience_min": "integer or null",
  "years_experience_max": "integer or null",
  "description_clean": "Cleaned, well-formatted version of the job description. Remove boilerplate, fix formatting, keep substance. Use plain text with paragraph breaks.",
  "required_skills": ["skill1", "skill2"],
  "preferred_skills": ["skill1", "skill2"],
  "education": "string describing education requirements, or null",
  "benefits": ["benefit1", "benefit2"],
  "visa_sponsorship": "true | false | null (null if not mentioned)",
  "salary_mentioned": {
    "min": "number or null",
    "max": "number or null",
    "currency": "USD",
    "type": "annual | hourly | monthly"
  },
  "key_responsibilities": ["responsibility1", "responsibility2"]
}

Rules:
- experience_level: Infer from title and requirements. "Junior"/"Associate"/"Entry" = "entry"; no qualifier or "Mid-level" = "mid"; "Senior"/"Staff" = "senior"; "Lead"/"Principal"/"Manager" = "lead"; "VP"/"Director"/"C-level" = "executive"
- employment_type: Default to "full_time" if not specified. "Contract"/"Freelance" = "contract"; "Intern" = "internship"
- years_experience: Extract from phrases like "3+ years", "5-7 years". If "3+ years", min=3, max=null. If "5-7 years", min=5, max=7
- required_skills vs preferred_skills: "Required"/"Must have" = required; "Nice to have"/"Preferred"/"Bonus" = preferred. If unclear, put in required
- salary_mentioned: Only extract if explicitly stated in the text. Do NOT guess. null if not mentioned
- visa_sponsorship: true if "visa sponsorship available", false if "no visa sponsorship" or "must be authorized to work", null if not mentioned
- description_clean: Preserve all substantive content. Remove duplicate headers, HTML artifacts, excessive whitespace, cookie notices, equal opportunity boilerplate. Keep the company description, role summary, requirements, and benefits. Use line breaks between sections
- benefits: Extract specific benefits like "Health insurance", "401(k)", "Remote work", "Unlimited PTO", etc.
- key_responsibilities: Top 5-8 main responsibilities. Keep concise (one line each)"""


async def enrich_single_job(description: str, title: str) -> EnrichedJobData | None:
    """Send a job description to Claude and extract structured data.

    Returns None if the LLM call fails or returns unparseable JSON.
    """
    settings = get_settings()
    prompt = f"Job Title: {title}\n\nJob Description:\n{description}"

    try:
        response_text = await chat_completion(
            prompt=prompt,
            system=JOB_ENRICHMENT_SYSTEM,
            model=settings.enrichment_model,
            max_tokens=settings.enrichment_max_tokens,
        )

        cleaned = response_text.strip()
        if cleaned.startswith("```"):
            lines = cleaned.split("\n")
            cleaned = "\n".join(lines[1:-1])

        data = json.loads(cleaned)
        return EnrichedJobData.model_validate(data)
    except json.JSONDecodeError:
        logger.warning("LLM returned non-JSON response for job '%s'", title)
        return None
    except Exception:
        logger.exception("Enrichment failed for job '%s'", title)
        return None


def _build_requirements_jsonb(enriched: EnrichedJobData) -> dict:
    """Build the requirements JSONB payload from enriched data."""
    result: dict = {}
    if enriched.required_skills:
        result["required_skills"] = enriched.required_skills
    if enriched.preferred_skills:
        result["preferred_skills"] = enriched.preferred_skills
    if enriched.education:
        result["education"] = enriched.education
    if enriched.benefits:
        result["benefits"] = enriched.benefits
    if enriched.visa_sponsorship is not None:
        result["visa_sponsorship"] = enriched.visa_sponsorship
    if enriched.salary_mentioned:
        result["salary_mentioned"] = enriched.salary_mentioned.model_dump()
    if enriched.key_responsibilities:
        result["key_responsibilities"] = enriched.key_responsibilities
    return result


async def enrich_jobs_batch(
    db: AsyncSession,
    job_ids: list[UUID],
) -> EnrichmentStats:
    """Enrich a batch of jobs, updating the DB for each one.

    Skips jobs that:
    - Have no description (nothing to enrich)
    - Are already enriched (enriched_at is not null)
    - Are inactive
    """
    stats = EnrichmentStats()

    result = await db.execute(
        select(Job).where(
            Job.id.in_(job_ids),
            Job.is_active.is_(True),
            Job.enriched_at.is_(None),
        )
    )
    jobs = list(result.scalars().all())

    for job in jobs:
        if not job.description:
            stats.jobs_skipped += 1
            continue

        enriched = await enrich_single_job(job.description, job.title)
        if enriched is None:
            stats.jobs_failed += 1
            continue

        # Update scalar columns
        job.experience_level = enriched.experience_level
        job.employment_type = enriched.employment_type
        job.years_experience_min = enriched.years_experience_min
        job.years_experience_max = enriched.years_experience_max
        job.description_clean = enriched.description_clean
        job.enriched_at = datetime.now(timezone.utc)

        # Build and set requirements JSONB
        requirements = _build_requirements_jsonb(enriched)
        if requirements:
            job.requirements = requirements

        # Backfill salary if crawler didn't set it but LLM extracted it
        if enriched.salary_mentioned and enriched.salary_mentioned.min:
            if job.salary_min is None:
                job.salary_min = enriched.salary_mentioned.min
                job.salary_max = enriched.salary_mentioned.max
                if enriched.salary_mentioned.currency:
                    job.salary_currency = enriched.salary_mentioned.currency
                stats.salary_backfills += 1

        stats.jobs_enriched += 1

    await db.flush()
    return stats
