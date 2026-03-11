export interface JobRequirements {
  required_skills?: string[];
  preferred_skills?: string[];
  education?: string;
  benefits?: string[];
  key_responsibilities?: string[];
  visa_sponsorship?: boolean;
  salary_mentioned?: {
    min?: number;
    max?: number;
    currency?: string;
    type?: string;
  } | null;
}

export interface MatchFactors {
  combined_method?: string;
  model?: string;
  matched_skills?: string[];
  missing_skills?: string[];
  preferred_skills?: string[];
  reasoning?: string;
  batch_id?: string;
  latency_ms?: number;
}

export interface Job {
  id: string;
  external_id?: string | null;
  title: string;
  company?: string | null;
  company_logo_url?: string | null;
  location?: string | null;
  location_type?: "remote" | "hybrid" | "onsite" | null;
  salary_min?: number | null;
  salary_max?: number | null;
  salary_currency: string;
  description?: string | null;
  description_clean?: string | null;
  requirements?: JobRequirements | null;
  experience_level?: string | null;
  employment_type?: string | null;
  years_experience_min?: number | null;
  years_experience_max?: number | null;
  enriched_at?: string | null;
  tags: string[];
  url: string;
  apply_url?: string | null;
  source: string;
  category?: string | null;
  posted_at?: string | null;
  is_active: boolean;
  match_score?: number | null;
  match_factors?: MatchFactors | null;
  application_status?: string | null;
  application_id?: string | null;
}

export interface JobListResponse {
  jobs: Job[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

export interface MatchBreakdown {
  combined_method: string;
  model: string;
  matched_skills: string[];
  missing_skills: string[];
  preferred_skills: string[];
  reasoning: string;
}
