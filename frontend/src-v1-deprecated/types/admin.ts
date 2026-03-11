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
  score_jobs: number;
  apply: number;
  enrich: number;
}

export interface AdminOverview {
  user_count: number;
  job_count: number;
  active_job_count: number;
  application_counts: Record<string, number>;
  total_applications: number;
  queue_depths: QueueDepths;
}

export interface AdminQueueStatus {
  score_jobs_queue_depth: number;
  apply_queue_depth: number;
  enrich_queue_depth: number;
}

export interface WipeResult {
  affected: number;
  action: string;
}

export interface WorkerStatus {
  name: string;
  worker_id: string | null;
  started_at: string | null;
  last_beat_at: string | null;
  tasks_processed: number;
  tasks_failed: number;
  current_task: string;
  status: "idle" | "processing" | "offline";
  is_alive: boolean;
}

export interface WorkersOverview {
  workers: WorkerStatus[];
}

export interface TriggerResult {
  triggered: string;
  detail: string;
}

export interface QueuePurgeResult {
  purged: number;
  queue: string;
}

export interface DLQItem {
  envelope: Record<string, unknown>;
  error: string;
  failed_at: string;
}

export interface DLQStatus {
  queue_name: string;
  depth: number;
  items: DLQItem[];
}

export interface DLQOverview {
  queues: Record<string, number>;
  total: number;
}

export interface DLQReplayResult {
  replayed: boolean;
  queue_name: string;
}
