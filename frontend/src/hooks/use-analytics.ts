import { useQuery } from "@tanstack/react-query";
import { analyticsApi } from "@/lib/api/analytics";
import { queryKeys } from "@/lib/query-keys";

export function useAnalytics(imageId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.analytics.detail(imageId ?? ""),
    queryFn: () => analyticsApi.get(imageId!),
    enabled: Boolean(imageId),
  });
}

export function useDashboard() {
  return useQuery({
    queryKey: queryKeys.analytics.dashboard,
    queryFn: () => analyticsApi.dashboard(),
  });
}
