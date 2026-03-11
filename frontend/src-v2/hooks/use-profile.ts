import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Profile } from "@/types/profile";

export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    staleTime: 60_000,
    queryFn: () => api.get<Profile>("/api/profile"),
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Profile>) => api.put("/api/profile", data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["profile"] }),
  });
}

export function useUpdateExperiences() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (experiences: unknown[]) =>
      api.put("/api/profile/experiences", { experiences }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["profile"] }),
  });
}

export function useUpdateSkills() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (skills: string[]) => api.put("/api/profile/skills", { skills }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["profile"] }),
  });
}
