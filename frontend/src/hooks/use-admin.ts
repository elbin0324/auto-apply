import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type {
  AdminOverview,
  AdminUserListResponse,
  AdminUserSummary,
  AdminQueueStatus,
  WipeResult,
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

export function useWipeCompanies() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (hard: boolean = false) =>
      api.delete<WipeResult>(`/api/admin/companies?hard=${hard}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
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
