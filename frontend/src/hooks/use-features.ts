import { useQuery } from "@tanstack/react-query";
import { featuresApi } from "@/lib/api/features";
import { queryKeys } from "@/lib/query-keys";
import type { FeatureListParams } from "@/lib/types";

export function useFeatures(params: FeatureListParams) {
  return useQuery({
    queryKey: queryKeys.features.list(params),
    queryFn: () => featuresApi.list(params),
  });
}

export function useMapFeatures(imageId?: string) {
  return useQuery({
    queryKey: queryKeys.features.map(imageId),
    queryFn: () => featuresApi.listAll(imageId),
  });
}

export function useFeature(imageId: string | undefined, featureId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.features.detail(imageId ?? "", featureId ?? ""),
    queryFn: () => featuresApi.get(imageId!, featureId!),
    enabled: Boolean(imageId && featureId),
  });
}
