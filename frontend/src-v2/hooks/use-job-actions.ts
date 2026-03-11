import { useState, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useToastStore } from "@/stores/toast-store";

export function useJobActions() {
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);
  const [applyingJobId, setApplyingJobId] = useState<string | null>(null);
  const [exitingJobId, setExitingJobId] = useState<string | null>(null);

  const apply = useMutation({
    mutationFn: (jobId: string) => api.post(`/api/jobs/${jobId}/queue`),
    onMutate: (jobId) => {
      setApplyingJobId(jobId);
    },
    onSuccess: (_data, jobId) => {
      setApplyingJobId(null);
      setExitingJobId(jobId);
    },
    onError: () => {
      setApplyingJobId(null);
    },
  });

  const onExitComplete = useCallback(() => {
    if (!exitingJobId) return;
    const removedId = exitingJobId;

    // Optimistically strip the job from cached lists BEFORE clearing
    // exitingJobId, so it never briefly reappears between renders.
    queryClient.setQueriesData<{ jobs: { id: string }[] }>(
      { queryKey: ["jobs"] },
      (old) => {
        if (!old?.jobs) return old;
        return { ...old, jobs: old.jobs.filter((j) => j.id !== removedId) };
      },
    );

    setExitingJobId(null);
    queryClient.invalidateQueries({ queryKey: ["jobs"] });
    queryClient.invalidateQueries({ queryKey: ["queue-status"] });
    addToast({
      message: "Queued for takeoff.",
      variant: "success",
      action: { label: "View Queue", href: "/queue" },
    });
  }, [exitingJobId, queryClient, addToast]);

  const skip = useMutation({
    mutationFn: (jobId: string) => api.post(`/api/jobs/${jobId}/skip`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      addToast({ message: "Job skipped.", variant: "success" });
    },
  });

  return { apply, skip, applyingJobId, exitingJobId, onExitComplete };
}
