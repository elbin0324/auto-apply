import type { Job } from "./job";

export interface GeneratedApplicationField {
  name: string;
  label: string;
  field_type: "text" | "select" | "checkbox" | "textarea" | "radio" | "file";
  options: { value: string; label: string }[];
  is_required: boolean;
  page_number: number;
}

export interface GeneratedApplicationAnswer {
  field_name: string;
  value: string;
  source: string;
}

export interface GeneratedApplication {
  task_id?: string | null;
  job_url?: string | null;
  ats_name?: string | null;
  pages_found: number;
  created_at?: string | null;
  fields: GeneratedApplicationField[];
  answers: GeneratedApplicationAnswer[];
}

export interface Application {
  id: string;
  user_id: string;
  job_id?: string | null;
  status: string;
  applied_at?: string | null;
  resume_used_url?: string | null;
  cover_letter_used?: string | null;
  screenshot_url?: string | null;
  error_message?: string | null;
  created_at: string;
  current_phase?: string | null;
  phase_message?: string | null;
  generated_application?: GeneratedApplication | null;
  task_mode?: string | null;
  job?: Job | null;
}

export interface ApplicationListResponse {
  applications: Application[];
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
