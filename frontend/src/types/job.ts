export interface JobSearchParams {
  query?: string | null;
  location?: string | null;
  location_type?: string[] | null;
  salary_min?: number | null;
  category?: string | null;
  experience_level?: string[] | null;
  employment_type?: string[] | null;
  page?: number;
  per_page?: number;
  status?: string | null;
  sort_by?: string;
}

export interface JobResponse {
  id: string;
  external_id?: string | null;
  title: string;
  company?: string | null;
  company_logo_url?: string | null;
  location?: string | null;
  location_type?: string | null;
  salary_min?: number | null;
  salary_max?: number | null;
  salary_currency: string;
  description?: string | null;
  description_clean?: string | null;
  requirements?: Record<string, unknown> | null;
  experience_level?: string | null;
  employment_type?: string | null;
  years_experience_min?: number | null;
  years_experience_max?: number | null;
  enriched_at?: string | null;
  tags: string[];
  url: string;
  source: string;
  category?: string | null;
  posted_at?: string | null;
  is_active: boolean;
  match_score?: number | null;
  match_factors?: Record<string, unknown> | null;
  application_status?: string | null;
  application_id?: string | null;
}

export interface JobListResponse {
  jobs: JobResponse[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

export interface MatchFactors {
  job_id: string;
  score: number;
  factors: MatchFactorsDetail;
  computed_at: string;
}

export interface MatchFactorsDetail {
  combined_method: string;
  // LLM scoring fields
  model?: string;
  matched_skills?: string[];
  missing_skills?: string[];
  preferred_skills?: string[];
  reasoning?: string;
  batch_id?: string;
  latency_ms?: number;
  // Legacy heuristic fields
  skill_score?: number;
  title_score?: number;
  location_score?: number;
  [key: string]: unknown;
}
