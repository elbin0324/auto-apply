import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type {
  ApplicationListResponse,
  ApplicationDetail,
} from "@/types/application";

interface UseApplicationsParams {
  status?: string | null;
  date_from?: string | null;
  date_to?: string | null;
  page?: number;
  per_page?: number;
}

export function useApplications(params: UseApplicationsParams = {}) {
  const { status, date_from, date_to, page = 1, per_page = 20 } = params;

  return useQuery({
    queryKey: ["applications", { status, date_from, date_to, page, per_page }],
    queryFn: () => {
      const searchParams = new URLSearchParams();
      if (status) searchParams.set("status", status);
      if (date_from) searchParams.set("date_from", date_from);
      if (date_to) searchParams.set("date_to", date_to);
      searchParams.set("page", String(page));
      searchParams.set("per_page", String(per_page));
      return api.get<ApplicationListResponse>(
        `/api/applications?${searchParams.toString()}`,
      );
    },
  });
}

export function useApplicationDetail(applicationId: string) {
  return useQuery({
    queryKey: ["applications", applicationId],
    queryFn: () =>
      api.get<ApplicationDetail>(`/api/applications/${applicationId}`),
    enabled: !!applicationId,
  });
}
