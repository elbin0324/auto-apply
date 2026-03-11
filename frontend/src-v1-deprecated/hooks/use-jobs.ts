import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { JobListResponse, JobSearchParams } from "@/types/job";

export function useJobs(params: JobSearchParams = {}) {
  const {
    query,
    location,
    location_type,
    salary_min,
    category,
    status,
    page = 1,
    per_page = 20,
    sort_by = "match_score",
  } = params;

  return useQuery({
    queryKey: ["jobs", params],
    queryFn: () => {
      const sp = new URLSearchParams();
      if (query) sp.set("query", query);
      if (location) sp.set("location", location);
      if (location_type?.length) {
        for (const t of location_type) sp.append("location_type", t);
      }
      if (salary_min != null) sp.set("salary_min", String(salary_min));
      if (category) sp.set("category", category);
      if (status) sp.set("status", status);
      sp.set("page", String(page));
      sp.set("per_page", String(per_page));
      if (sort_by) sp.set("sort_by", sort_by);
      return api.get<JobListResponse>(`/api/jobs?${sp.toString()}`);
    },
  });
}
