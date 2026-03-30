import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type {
  PlansResponse,
  SubscriptionStatus,
  CheckoutSession,
  PortalSession,
} from "@/types/billing";

export function usePlans() {
  return useQuery({
    queryKey: ["billing-plans"],
    queryFn: () => api.get<PlansResponse>("/api/billing/plans"),
    staleTime: 60_000 * 60, // Plans rarely change
  });
}

export function useSubscription() {
  return useQuery({
    queryKey: ["subscription"],
    queryFn: () => api.get<SubscriptionStatus>("/api/billing/subscription"),
    staleTime: 30_000,
  });
}

export function useCheckout() {
  return useMutation({
    mutationFn: async (plan: string) => {
      const session = await api.post<CheckoutSession>("/api/billing/checkout", {
        plan,
      });
      window.location.href = session.checkout_url;
      return session;
    },
  });
}

export function usePortalSession() {
  return useMutation({
    mutationFn: async () => {
      const session = await api.post<PortalSession>("/api/billing/portal");
      window.location.href = session.portal_url;
      return session;
    },
  });
}
