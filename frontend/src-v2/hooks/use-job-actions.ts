import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useToastStore } from "@/stores/toast-store";

export function useJobActions() {
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);

  const apply = useMutation({
    mutationFn: (jobId: string) => api.post(`/api/jobs/${jobId}/queue`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      queryClient.invalidateQueries({ queryKey: ["queue-status"] });
      addToast({ message: "Job queued for application.", variant: "success" });
    },
  });

  const skip = useMutation({
    mutationFn: (jobId: string) => api.post(`/api/jobs/${jobId}/skip`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      addToast({ message: "Job skipped.", variant: "success" });
    },
  });

  return { apply, skip };
}
