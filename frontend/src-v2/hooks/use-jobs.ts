import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { JobListResponse } from "@/types/job";

export interface UseJobsParams {
  query?: string;
  location_type?: string;
  experience_level?: string;
  sort_by?: string;
  page?: number;
  per_page?: number;
}

export function useJobs(params: UseJobsParams) {
  return useQuery({
    queryKey: ["jobs", params],
    staleTime: 30_000,
    queryFn: () => {
      const searchParams = new URLSearchParams();
      searchParams.set("status", "new");
      if (params.query) searchParams.set("query", params.query);
      if (params.location_type) searchParams.set("location_type", params.location_type);
      if (params.experience_level) searchParams.set("experience_level", params.experience_level);
      if (params.sort_by) searchParams.set("sort_by", params.sort_by);
      if (params.page) searchParams.set("page", String(params.page));
      searchParams.set("per_page", String(params.per_page ?? 20));
      return api.get<JobListResponse>(`/api/jobs?${searchParams.toString()}`);
    },
  });
}
