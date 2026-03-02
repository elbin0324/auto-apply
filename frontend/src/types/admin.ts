export interface AdminUserSummary {
  id: string;
  email: string;
  role: string;
  created_at: string;
  has_profile: boolean;
  full_name: string | null;
  application_count: number;
  applied_count: number;
  auto_apply_active: boolean;
}

export interface AdminUserListResponse {
  users: AdminUserSummary[];
  total: number;
  page: number;
  per_page: number;
}

export interface QueueDepths {
  crawl: number;
  score_jobs: number;
  score_users: number;
  apply: number;
}

export interface AdminOverview {
  user_count: number;
  job_count: number;
  active_job_count: number;
  company_count: number;
  active_company_count: number;
  application_counts: Record<string, number>;
  total_applications: number;
  queue_depths: QueueDepths;
}

export interface AdminQueueStatus {
  crawl_queue_depth: number;
  score_jobs_queue_depth: number;
  score_users_queue_depth: number;
  apply_queue_depth: number;
  crawl_dedup_keys: number;
}

export interface WipeResult {
  affected: number;
  action: string;
}
