import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import type { UserResponse } from "@/types/user";

export function useCompleteOnboarding() {
  return useMutation({
    mutationFn: () =>
      api.post<UserResponse>("/api/auth/complete-onboarding"),
    onSuccess: (data) => {
      useAuthStore.getState().setUser(data);
    },
  });
}
