import type { JobResponse } from "./job";

export type ApplicationStatus =
  | "queued"
  | "pending_review"
  | "in_progress"
  | "applied"
  | "failed"
  | "skipped"
  | "withdrawn";

export interface ApplicationDetail {
  id: string;
  user_id: string;
  job_id?: string | null;
  status: ApplicationStatus;
  applied_at?: string | null;
  resume_used_url?: string | null;
  cover_letter_used?: string | null;
  screenshot_url?: string | null;
  error_message?: string | null;
  created_at: string;
  job?: JobResponse | null;
}

export interface ApplicationListResponse {
  applications: ApplicationDetail[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

export interface ApplicationStats {
  total: number;
  applied: number;
  pending: number;
  failed: number;
  skipped: number;
  this_week: number;
  success_rate: number;
}
