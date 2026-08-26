import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { reviewsApi } from "@/lib/api/reviews";
import { queryKeys } from "@/lib/query-keys";
import type { ReviewRequest } from "@/lib/types";

export function useReviewQueue(imageId?: string) {
  return useQuery({
    queryKey: queryKeys.features.queue(imageId),
    queryFn: () => reviewsApi.queue(imageId),
  });
}

export function useReviewFeature() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      featureId,
      body,
    }: {
      featureId: string;
      body: ReviewRequest;
    }) => reviewsApi.submit(featureId, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.features.all });
      void qc.invalidateQueries({ queryKey: queryKeys.analytics.dashboard });
      void qc.invalidateQueries({ queryKey: ["analytics"] });
    },
  });
}
