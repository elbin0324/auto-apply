import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { AutoApplyConfig, QueueStatus } from "@/types/auto-apply";
import type { ApplicationStats } from "@/types/application";

export function useAutoApplyConfig() {
  return useQuery({
    queryKey: ["auto-apply-config"],
    staleTime: 30_000,
    queryFn: () => api.get<AutoApplyConfig>("/api/auto-apply/config"),
  });
}

export function useUpdateAutoApplyConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<AutoApplyConfig>) => api.put("/api/auto-apply/config", data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["auto-apply-config"] }),
  });
}

export function useStartAutopilot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.post("/api/auto-apply/start"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auto-apply-config"] });
      queryClient.invalidateQueries({ queryKey: ["queue-status"] });
    },
  });
}

export function useStopAutopilot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.post("/api/auto-apply/stop"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auto-apply-config"] });
      queryClient.invalidateQueries({ queryKey: ["queue-status"] });
    },
  });
}

export function useQueueStatus() {
  return useQuery({
    queryKey: ["queue-status"],
    queryFn: () => api.get<QueueStatus>("/api/auto-apply/queue"),
    refetchInterval: 10_000,
  });
}

export function useApplicationStats() {
  return useQuery({
    queryKey: ["application-stats"],
    queryFn: () => api.get<ApplicationStats>("/api/applications/stats"),
  });
}
