import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type {
  QueueStatus,
  AutoApplyConfigResponse,
  AutoApplyConfigUpdate,
} from "@/types/auto-apply";

export function useAutoApplyQueue(enabled = true) {
  return useQuery({
    queryKey: ["auto-apply-queue"],
    queryFn: () => api.get<QueueStatus>("/api/auto-apply/queue"),
    refetchInterval: enabled ? 10_000 : false,
  });
}

export function useAutoApplyConfig() {
  return useQuery({
    queryKey: ["auto-apply-config"],
    queryFn: () => api.get<AutoApplyConfigResponse>("/api/auto-apply/config"),
  });
}

export function useUpdateAutoApplyConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AutoApplyConfigUpdate) =>
      api.put<AutoApplyConfigResponse>("/api/auto-apply/config", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auto-apply-config"] });
    },
  });
}

export function useReviewApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      applicationId,
      action,
    }: {
      applicationId: string;
      action: "approve" | "reject";
    }) =>
      api.post<{ status: string }>(
        `/api/auto-apply/review/${applicationId}?action=${action}`,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auto-apply-queue"] });
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
  });
}

export function useStartAutoApply() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<{ status: string }>("/api/auto-apply/start"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auto-apply-config"] });
      queryClient.invalidateQueries({ queryKey: ["auto-apply-queue"] });
    },
  });
}

export function useStopAutoApply() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<{ status: string }>("/api/auto-apply/stop"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auto-apply-config"] });
      queryClient.invalidateQueries({ queryKey: ["auto-apply-queue"] });
    },
  });
}
