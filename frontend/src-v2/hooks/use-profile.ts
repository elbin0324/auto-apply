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
    mutationFn: (experiences: unknown[]) => {
      // Backend expects list[ExperienceCreate] directly — strip id/profile_id
      const payload = (experiences as Record<string, unknown>[]).map(
        ({ id: _id, profile_id: _pid, ...rest }) => rest,
      );
      return api.put("/api/profile/experiences", payload);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["profile"] }),
  });
}

export function useUpdateSkills() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (skills: string[]) => {
      // Backend expects list[SkillCreate] — map strings to {name, category, proficiency}
      const payload = skills.map((name) => ({
        name,
        category: "technical",
        proficiency: "intermediate",
      }));
      return api.put("/api/profile/skills", payload);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["profile"] }),
  });
}
