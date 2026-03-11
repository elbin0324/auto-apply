import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { JobResponse, MatchFactors } from "@/types/job";

export function useJobDetail(jobId: string) {
  return useQuery({
    queryKey: ["job", jobId],
    queryFn: () => api.get<JobResponse>(`/api/jobs/${jobId}`),
    enabled: !!jobId,
  });
}

export function useJobMatch(jobId: string) {
  return useQuery({
    queryKey: ["job-match", jobId],
    queryFn: () => api.get<MatchFactors>(`/api/jobs/${jobId}/match`),
    enabled: !!jobId,
    retry: false,
  });
}
