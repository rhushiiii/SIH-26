import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { imagesApi } from "@/lib/api/images";
import { queryKeys } from "@/lib/query-keys";

export function useImages() {
  return useQuery({
    queryKey: queryKeys.images.all,
    queryFn: () => imagesApi.list(),
  });
}

export function useImage(imageId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.images.detail(imageId ?? ""),
    queryFn: () => imagesApi.get(imageId!),
    enabled: Boolean(imageId),
  });
}

export function useUploadImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => imagesApi.create(file),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.images.all });
    },
  });
}

export function useStartProcessing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (imageId: string) => imagesApi.startProcessing(imageId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.images.all });
      void qc.invalidateQueries({ queryKey: queryKeys.jobs.all });
    },
  });
}
