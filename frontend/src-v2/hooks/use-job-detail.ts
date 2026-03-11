import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Job, MatchBreakdown } from "@/types/job";

export function useJobDetail(jobId: string | null) {
  const job = useQuery({
    queryKey: ["job", jobId],
    queryFn: () => api.get<Job>(`/api/jobs/${jobId}`),
    enabled: !!jobId,
  });

  const match = useQuery({
    queryKey: ["job-match", jobId],
    queryFn: () => api.get<MatchBreakdown>(`/api/jobs/${jobId}/match`),
    enabled: !!jobId,
  });

  return { job, match };
}
