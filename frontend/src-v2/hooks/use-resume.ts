import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useToastStore } from "@/stores/toast-store";

export function useResumeUpload() {
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);

  const upload = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      return api.upload("/api/profile/resume/upload", formData);
    },
    onSuccess: () => {
      addToast({ message: "Resume uploaded.", variant: "success" });
    },
  });

  const parse = useMutation({
    mutationFn: () => api.post("/api/profile/resume/parse"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      addToast({ message: "Resume parsed successfully.", variant: "success" });
    },
  });

  return { upload, parse };
}
