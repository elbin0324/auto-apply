import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useToastStore } from "@/stores/toast-store";

function useInvalidateQueue() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ["applications"] });
    queryClient.invalidateQueries({ queryKey: ["application-stats"] });
    queryClient.invalidateQueries({ queryKey: ["queue-status"] });
  };
}

export function useReviewActions() {
  const invalidate = useInvalidateQueue();
  const addToast = useToastStore((s) => s.addToast);

  const approve = useMutation({
    mutationFn: (appId: string) =>
      api.post(`/api/auto-apply/review/${appId}?action=approve`),
    onSuccess: () => {
      invalidate();
      addToast({ message: "Application approved.", variant: "success" });
    },
  });

  const reject = useMutation({
    mutationFn: (appId: string) =>
      api.post(`/api/auto-apply/review/${appId}?action=reject`),
    onSuccess: () => {
      invalidate();
      addToast({ message: "Application rejected.", variant: "success" });
    },
  });

  const batchAction = useMutation({
    mutationFn: async ({ ids, action }: { ids: string[]; action: "approve" | "reject" }) => {
      for (const id of ids) {
        await api.post(`/api/auto-apply/review/${id}?action=${action}`);
      }
    },
    onSuccess: (_data, { ids, action }) => {
      invalidate();
      addToast({
        message: `${ids.length} application${ids.length > 1 ? "s" : ""} ${action === "approve" ? "approved" : "rejected"}.`,
        variant: "success",
      });
    },
  });

  const approvingId = approve.isPending ? (approve.variables as string) : null;
  const rejectingId = reject.isPending ? (reject.variables as string) : null;
  const isBatchPending = batchAction.isPending;

  return { approve, reject, batchAction, approvingId, rejectingId, isBatchPending };
}
