import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ProfileResponse, ParsedResume } from "@/types/profile";

export function useUploadResume() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      return api.upload<ProfileResponse>("/api/profile/resume/upload", formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}

export function useParseResume() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<ParsedResume>("/api/profile/resume/parse"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["parsed-resume"] });
    },
  });
}

export function useParsedResume() {
  return useQuery({
    queryKey: ["parsed-resume"],
    queryFn: () => api.get<ParsedResume>("/api/profile/resume/parsed"),
    retry: false,
  });
}
