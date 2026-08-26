import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { jobsApi } from "@/lib/api/jobs";
import { queryKeys } from "@/lib/query-keys";
import type { Job } from "@/lib/types";

function isActive(job?: Job) {
  if (!job) return true;
  return !["COMPLETED", "FAILED", "CANCELLED"].includes(job.status);
}

export function useJobs() {
  return useQuery({
    queryKey: queryKeys.jobs.all,
    queryFn: () => jobsApi.list(),
    refetchInterval: (q) => {
      const items = q.state.data?.items ?? [];
      return items.some(isActive) ? 1800 : false;
    },
  });
}

export function useJob(jobId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.jobs.detail(jobId ?? ""),
    queryFn: () => jobsApi.get(jobId!),
    enabled: Boolean(jobId),
    refetchInterval: (q) => (isActive(q.state.data) ? 1400 : false),
  });
}

export function useCancelJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (jobId: string) => jobsApi.cancel(jobId),
    onSuccess: (_data, jobId) => {
      void qc.invalidateQueries({ queryKey: queryKeys.jobs.all });
      void qc.invalidateQueries({ queryKey: queryKeys.jobs.detail(jobId) });
      void qc.invalidateQueries({ queryKey: queryKeys.images.all });
    },
  });
}

export function useRetryJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (jobId: string) => jobsApi.retry(jobId),
    onSuccess: (_data, jobId) => {
      void qc.invalidateQueries({ queryKey: queryKeys.jobs.all });
      void qc.invalidateQueries({ queryKey: queryKeys.jobs.detail(jobId) });
      void qc.invalidateQueries({ queryKey: queryKeys.images.all });
    },
  });
}
