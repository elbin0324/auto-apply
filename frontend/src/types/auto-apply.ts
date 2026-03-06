export interface AutoApplyConfigUpdate {
  target_titles?: string[] | null;
  target_locations?: string[] | null;
  min_salary?: number | null;
  max_salary?: number | null;
  excluded_companies?: string[] | null;
  preferred_industries?: string[] | null;
  location_type_pref?: string[] | null;
  employment_type_pref?: string[] | null;
  experience_level?: string | null;
  daily_apply_limit?: number | null;
  apply_mode?: "safe" | "hybrid" | "auto" | null;
  auto_apply_threshold?: number | null;
}

export interface AutoApplyConfigResponse {
  id: string;
  user_id: string;
  is_active: boolean;
  target_titles?: string[] | null;
  target_locations?: string[] | null;
  min_salary?: number | null;
  max_salary?: number | null;
  excluded_companies?: string[] | null;
  preferred_industries?: string[] | null;
  location_type_pref?: string[] | null;
  employment_type_pref?: string[] | null;
  experience_level?: string | null;
  daily_apply_limit: number;
  apply_mode: "safe" | "hybrid" | "auto";
  auto_apply_threshold: number;
}

export interface QueueStatus {
  queue_depth: number;
  pending_review_count: number;
  in_progress_count: number;
}
