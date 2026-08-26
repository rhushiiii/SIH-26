import { createFileRoute, Link } from "@tanstack/react-router";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { JobStatusBadge } from "@/components/shared/status-badge";
import { Progress } from "@/components/ui/progress";
import { formatDateTime } from "@/lib/format";
import { useJobs } from "@/hooks/use-jobs";

export const Route = createFileRoute("/_app/jobs/")({
  component: JobsPage,
});

function JobsPage() {
  const q = useJobs();
  return (
    <div className="space-y-6 p-4 sm:p-6">
      <PageHeader
        eyebrow="Pipeline"
        title="Processing jobs"
        description="Each job validates, tiles, infers, stitches, polygonizes, and scores confidence."
      />
      {q.isLoading ? (
        <LoadingState />
      ) : q.isError ? (
        <ErrorState error={q.error} onRetry={() => void q.refetch()} />
      ) : !q.data?.items.length ? (
        <EmptyState title="No jobs" description="Start processing from an uploaded image." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-muted/50 text-left text-xs tracking-wide text-muted-foreground uppercase">
              <tr>
                <th className="px-4 py-3 font-medium">Job</th>
                <th className="px-4 py-3 font-medium">Raster</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Progress</th>
                <th className="px-4 py-3 font-medium">Updated</th>
              </tr>
            </thead>
            <tbody>
              {q.data.items.map((job) => (
                <tr key={job.job_id} className="border-t border-border">
                  <td className="px-4 py-3">
                    <Link
                      to="/jobs/$jobId"
                      params={{ jobId: job.job_id }}
                      className="font-mono text-xs text-indigo hover:underline"
                    >
                      {job.job_id}
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-medium">{job.filename}</td>
                  <td className="px-4 py-3">
                    <JobStatusBadge status={job.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Progress value={job.progress} className="w-28" />
                      <span className="font-mono text-xs tabular-nums">{job.progress}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDateTime(job.updated_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
