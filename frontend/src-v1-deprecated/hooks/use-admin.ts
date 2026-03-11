import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type {
  AdminOverview,
  AdminUserListResponse,
  AdminUserSummary,
  AdminQueueStatus,
  WipeResult,
  WorkersOverview,
  TriggerResult,
  QueuePurgeResult,
  DLQOverview,
  DLQStatus,
  DLQReplayResult,
} from "@/types/admin";

export function useAdminOverview() {
  return useQuery({
    queryKey: ["admin", "overview"],
    queryFn: () => api.get<AdminOverview>("/api/admin/overview"),
    refetchInterval: 30_000,
  });
}

export function useAdminUsers(
  params: { page?: number; per_page?: number; search?: string } = {},
) {
  return useQuery({
    queryKey: ["admin", "users", params],
    queryFn: () => {
      const sp = new URLSearchParams();
      if (params.search) sp.set("search", params.search);
      sp.set("page", String(params.page ?? 1));
      sp.set("per_page", String(params.per_page ?? 50));
      return api.get<AdminUserListResponse>(
        `/api/admin/users?${sp.toString()}`,
      );
    },
  });
}

export function useAdminUserDetail(userId: string) {
  return useQuery({
    queryKey: ["admin", "users", userId],
    queryFn: () => api.get<AdminUserSummary>(`/api/admin/users/${userId}`),
    enabled: !!userId,
  });
}

export function useAdminQueues() {
  return useQuery({
    queryKey: ["admin", "queues"],
    queryFn: () => api.get<AdminQueueStatus>("/api/admin/queues"),
    refetchInterval: 10_000,
  });
}

export function useWipeJobs() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      hard = false,
      source,
    }: { hard?: boolean; source?: string } = {}) => {
      const sp = new URLSearchParams();
      if (hard) sp.set("hard", "true");
      if (source) sp.set("source", source);
      return api.delete<WipeResult>(`/api/admin/jobs?${sp.toString()}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
  });
}

export function useWorkers() {
  return useQuery({
    queryKey: ["admin", "workers"],
    queryFn: () => api.get<WorkersOverview>("/api/admin/workers"),
    refetchInterval: 10_000,
  });
}

export function useTriggerFetch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<TriggerResult>("/api/admin/triggers/fetch"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
  });
}

export function useTriggerRescore() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<TriggerResult>("/api/admin/triggers/rescore"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
  });
}

export function useTriggerEnrich() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<TriggerResult>("/api/admin/triggers/enrich"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
  });
}

export function useTriggerRematch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<TriggerResult>("/api/admin/triggers/rematch"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
  });
}

export function usePurgeQueue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (queueName: string) =>
      api.delete<QueuePurgeResult>(`/api/admin/queues/${queueName}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
  });
}

export function useDLQOverview() {
  return useQuery({
    queryKey: ["admin", "dlq"],
    queryFn: () => api.get<DLQOverview>("/api/admin/dlq"),
    refetchInterval: 10_000,
  });
}

export function useDLQDetail(queueName: string) {
  return useQuery({
    queryKey: ["admin", "dlq", queueName],
    queryFn: () => api.get<DLQStatus>(`/api/admin/dlq/${queueName}`),
    enabled: !!queueName,
  });
}

export function useReplayDLQ() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (queueName: string) =>
      api.post<DLQReplayResult>(`/api/admin/dlq/${queueName}/replay`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "dlq"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "queues"] });
    },
  });
}

export function usePurgeDLQ() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (queueName: string) =>
      api.delete<QueuePurgeResult>(`/api/admin/dlq/${queueName}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "dlq"] });
    },
  });
}
