import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ApplicationListResponse, ApplicationStats } from "@/types/application";
import type { QueueStatus } from "@/types/auto-apply";

export function useApplications(
  params: { status?: string; page?: number; per_page?: number } = {},
) {
  return useQuery({
    queryKey: ["applications", params],
    queryFn: () => {
      const sp = new URLSearchParams();
      if (params.status) sp.set("status", params.status);
      sp.set("page", String(params.page ?? 1));
      sp.set("per_page", String(params.per_page ?? 20));
      return api.get<ApplicationListResponse>(`/api/applications?${sp.toString()}`);
    },
  });
}

export function useApplicationStats() {
  return useQuery({
    queryKey: ["application-stats"],
    queryFn: () => api.get<ApplicationStats>("/api/applications/stats"),
  });
}

export function useQueueStatus() {
  return useQuery({
    queryKey: ["queue-status"],
    queryFn: () => api.get<QueueStatus>("/api/auto-apply/queue"),
    refetchInterval: 60_000,
  });
}
