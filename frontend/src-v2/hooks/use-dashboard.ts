import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ApplicationStats, ApplicationListResponse } from "@/types/application";
import type { QueueStatus } from "@/types/auto-apply";

export function useDashboardStats() {
  return useQuery({
    queryKey: ["application-stats"],
    staleTime: 10_000,
    queryFn: () => api.get<ApplicationStats>("/api/applications/stats"),
  });
}

export function useQueueStatus() {
  return useQuery({
    queryKey: ["queue-status"],
    queryFn: () => api.get<QueueStatus>("/api/auto-apply/queue"),
    refetchInterval: 10_000,
  });
}

export function useRecentApplications(limit = 5) {
  return useQuery({
    queryKey: ["recent-applications", limit],
    queryFn: () =>
      api.get<ApplicationListResponse>(
        `/api/applications?page=1&per_page=${limit}&sort=created_at&order=desc`,
      ),
  });
}
