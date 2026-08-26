import { Progress } from "@/components/ui/progress";
import { JobStatusBadge } from "@/components/shared/status-badge";
import type { Job } from "@/lib/types";

export function JobProgress({ job }: { job: Job }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <JobStatusBadge status={job.status} />
        <span className="font-mono text-sm font-semibold tabular-nums text-navy">
          {job.progress}%
        </span>
      </div>
      <Progress value={job.progress} />
      <p className="text-xs text-muted-foreground">
        Stage {job.stage}
        {job.tiles_total
          ? ` · tiles ${job.tiles_processed ?? 0}/${job.tiles_total}`
          : null}
      </p>
    </div>
  );
}
