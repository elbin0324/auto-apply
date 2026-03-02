import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type {
  ProfileResponse,
  ProfileUpdate,
  ExperienceCreate,
  ExperienceResponse,
  EducationCreate,
  EducationResponse,
  SkillCreate,
  SkillResponse,
  ApplicationPreferences,
  ApplicationPreferencesUpdate,
} from "@/types/profile";

export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: () => api.get<ProfileResponse>("/api/profile"),
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ProfileUpdate) =>
      api.put<ProfileResponse>("/api/profile", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}

export function useUpdateExperiences() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ExperienceCreate[]) =>
      api.put<ExperienceResponse[]>("/api/profile/experiences", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}

export function useUpdateEducation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: EducationCreate[]) =>
      api.put<EducationResponse[]>("/api/profile/education", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}

export function useUpdateSkills() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SkillCreate[]) =>
      api.put<SkillResponse[]>("/api/profile/skills", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}

export function usePreferences() {
  return useQuery({
    queryKey: ["profile", "preferences"],
    queryFn: () =>
      api.get<ApplicationPreferences | null>("/api/profile/preferences"),
  });
}

export function useUpdatePreferences() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ApplicationPreferencesUpdate) =>
      api.put<ApplicationPreferences>("/api/profile/preferences", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}
