import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { exportsApi, type CreateExportInput } from "@/lib/api/exports";
import { queryKeys } from "@/lib/query-keys";

export function useExports() {
  return useQuery({
    queryKey: queryKeys.exports.all,
    queryFn: () => exportsApi.list(),
  });
}

export function useCreateExport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateExportInput) => exportsApi.create(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.exports.all });
    },
  });
}
