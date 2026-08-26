import { createFileRoute, Link } from "@tanstack/react-router";
import { MapPinned, RotateCcw, Square } from "lucide-react";
import { toast } from "sonner";
import { JobPipeline } from "@/components/jobs/job-pipeline";
import { JobProgress } from "@/components/jobs/job-progress";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/format";
import { useCancelJob, useJob, useRetryJob } from "@/hooks/use-jobs";

export const Route = createFileRoute("/_app/jobs/$jobId")({
  component: JobDetailPage,
});

function JobDetailPage() {
  const { jobId } = Route.useParams();
  const q = useJob(jobId);
  const cancel = useCancelJob();
  const retry = useRetryJob();

  if (q.isLoading) return <div className="p-6"><LoadingState /></div>;
  if (q.isError || !q.data)
    return (
      <div className="p-6">
        <ErrorState error={q.error} onRetry={() => void q.refetch()} />
      </div>
    );

  const job = q.data;
  const active = !["COMPLETED", "FAILED", "CANCELLED"].includes(job.status);

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <PageHeader
        eyebrow="Pipeline"
        title={job.filename}
        description={`Job ${job.job_id} · image ${job.image_id}`}
        actions={
          <div className="flex gap-2">
            {active ? (
              <Button
                variant="outline"
                disabled={cancel.isPending}
                onClick={() =>
                  cancel.mutate(job.job_id, {
                    onSuccess: () => toast.message("Job cancelled"),
                    onError: (e) => toast.error(e.message),
                  })
                }
              >
                <Square className="size-4" />
                Cancel
              </Button>
            ) : null}
            {job.status === "FAILED" && job.retry_supported ? (
              <Button
                disabled={retry.isPending}
                onClick={() =>
                  retry.mutate(job.job_id, {
                    onSuccess: () => toast.success("Retry queued"),
                    onError: (e) => toast.error(e.message),
                  })
                }
              >
                <RotateCcw className="size-4" />
                Retry
              </Button>
            ) : null}
            {job.status === "COMPLETED" ? (
              <Button asChild>
                <Link to="/map" search={{ imageId: job.image_id }}>
                  <MapPinned className="size-4" />
                  Open map
                </Link>
              </Button>
            ) : null}
          </div>
        }
      />

      {job.status === "FAILED" && job.error ? (
        <div
          role="alert"
          className="rounded-xl border border-confidence-low/30 bg-card px-4 py-3"
        >
          <p className="text-sm font-semibold text-navy">Processing failed</p>
          <p className="mt-1 text-sm text-muted-foreground">{job.error.message}</p>
          <p className="mt-1 font-mono text-xs text-confidence-low">{job.error.code}</p>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Stage pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            <JobPipeline job={job} />
          </CardContent>
        </Card>
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <JobProgress job={job} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Run metadata</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Created</p>
                <p>{formatDateTime(job.created_at)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Updated</p>
                <p>{formatDateTime(job.updated_at)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Tiles</p>
                <p className="tabular-nums">
                  {job.tiles_processed ?? 0}/{job.tiles_total ?? 0}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Image</p>
                <Link
                  to="/images/$imageId"
                  params={{ imageId: job.image_id }}
                  className="text-indigo hover:underline"
                >
                  {job.image_id}
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
