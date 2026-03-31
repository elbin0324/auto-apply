import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { useNavigate } from "@tanstack/react-router";

export function useOnboarding() {
  const [step, setStep] = useState(1);
  const queryClient = useQueryClient();
  const { setUser, user } = useAuthStore();
  const navigate = useNavigate();

  const complete = useMutation({
    mutationFn: () => api.post("/api/auth/complete-onboarding"),
    onSuccess: () => {
      if (user) {
        setUser({ ...user, onboarding_completed: true });
      }
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      navigate({ to: "/" });
    },
  });

  return { step, setStep, complete };
}
