import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ApplicationStats } from "@/types/application";

export function useApplicationStats() {
  return useQuery({
    queryKey: ["application-stats"],
    queryFn: () => api.get<ApplicationStats>("/api/applications/stats"),
  });
}
