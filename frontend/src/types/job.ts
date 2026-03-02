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
  factors: Record<string, unknown>;
  computed_at: string;
}
