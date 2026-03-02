import json
import logging

from schemas.profile import ParsedResume
from services.ai_client import chat_completion

logger = logging.getLogger(__name__)

RESUME_PARSE_SYSTEM = """You are a resume parser. Given raw text extracted from a resume PDF, extract structured data.
Return ONLY valid JSON matching this exact schema (no markdown, no explanation):

{
  "full_name": "string or null",
  "email": "string or null",
  "phone": "string or null",
  "location": "string or null",
  "linkedin_url": "string or null",
  "website_url": "string or null",
  "summary": "string or null",
  "experiences": [
    {
      "company": "string",
      "title": "string",
      "location": "string or null",
      "start_date": "YYYY-MM-DD or null",
      "end_date": "YYYY-MM-DD or null",
      "description": "string or null",
      "bullets": ["string"],
      "sort_order": 0
    }
  ],
  "educations": [
    {
      "institution": "string",
      "degree": "string or null",
      "field_of_study": "string or null",
      "start_date": "YYYY-MM-DD or null",
      "end_date": "YYYY-MM-DD or null",
      "gpa": "string or null",
      "sort_order": 0
    }
  ],
  "skills": [
    {
      "name": "string",
      "category": "technical|soft|language|certification",
      "proficiency": "beginner|intermediate|advanced|expert"
    }
  ],
  "raw_text": ""
}

Rules:
- Extract ALL experiences, education, and skills found
- Sort experiences by date (most recent first), set sort_order accordingly (0 = most recent)
- For date fields, approximate to the first of the month if only month/year given (e.g. "Jan 2023" -> "2023-01-01")
- If currently employed, end_date is null
- Categorize skills: programming languages/frameworks/tools = "technical"; communication/leadership = "soft"; spoken languages = "language"; certifications = "certification"
- raw_text should be empty string (caller fills this in)"""


async def parse_resume_text(raw_text: str) -> ParsedResume:
    response_text = await chat_completion(
        prompt=f"Parse this resume:\n\n{raw_text}",
        system=RESUME_PARSE_SYSTEM,
        model="claude-sonnet-4-20250514",
        max_tokens=4096,
    )

    cleaned = response_text.strip()
    if cleaned.startswith("```"):
        lines = cleaned.split("\n")
        cleaned = "\n".join(lines[1:-1])

    data = json.loads(cleaned)
    data["raw_text"] = raw_text
    return ParsedResume.model_validate(data)
