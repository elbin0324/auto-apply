import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ApplicationPreferences } from "@/types/profile";

export function useApplicationPreferences() {
  return useQuery({
    queryKey: ["application-preferences"],
    staleTime: 60_000,
    queryFn: () => api.get<ApplicationPreferences | null>("/api/profile/preferences"),
  });
}

export function useUpdateApplicationPreferences() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ApplicationPreferences>) =>
      api.put<ApplicationPreferences>("/api/profile/preferences", data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["application-preferences"] }),
  });
}
