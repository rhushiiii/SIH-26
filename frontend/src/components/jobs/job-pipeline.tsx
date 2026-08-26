import { Check, Circle, LoaderCircle } from "lucide-react";
import { JOB_STAGE_COPY, JOB_STAGE_ORDER } from "@/lib/constants";
import type { Job, JobStage } from "@/lib/types";
import { cn } from "@/lib/utils";

function Icon({ stage }: { stage: JobStage }) {
  if (stage.status === "COMPLETED")
    return <Check className="size-3.5 text-confidence-high" />;
  if (stage.status === "RUNNING")
    return <LoaderCircle className="size-3.5 animate-spin text-indigo" />;
  if (stage.status === "FAILED")
    return <Circle className="size-3.5 fill-confidence-low text-confidence-low" />;
  return <Circle className="size-3.5 text-border" />;
}

export function JobPipeline({ job, orientation = "vertical" }: { job: Job; orientation?: "vertical" | "horizontal" }) {
  if (orientation === "horizontal") {
    return (
      <ol className="flex flex-wrap items-center gap-2">
        {job.stages.map((stage, i) => (
          <li key={stage.name} className="flex items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium",
                stage.status === "COMPLETED" && "bg-confidence-high/10 text-emerald-800",
                stage.status === "RUNNING" && "bg-indigo/10 text-indigo",
                stage.status === "FAILED" && "bg-confidence-low/10 text-confidence-low",
                stage.status === "PENDING" && "text-muted-foreground",
                stage.status === "SKIPPED" && "text-muted-foreground line-through",
              )}
            >
              <Icon stage={stage} />
              {stage.name}
            </span>
            {i < job.stages.length - 1 ? (
              <span className="h-px w-4 bg-border" aria-hidden />
            ) : null}
          </li>
        ))}
      </ol>
    );
  }

  return (
    <ol className="space-y-0">
      {JOB_STAGE_ORDER.map((name) => {
        const stage = job.stages.find((s) => s.name === name);
        if (!stage) return null;
        return (
          <li key={name} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span className="flex size-7 items-center justify-center rounded-full border border-border bg-card">
                <Icon stage={stage} />
              </span>
              <span className="w-px flex-1 bg-border" />
            </div>
            <div className="flex-1 pb-5">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-sm font-semibold text-navy">{stage.name}</p>
                {stage.status === "RUNNING" ? (
                  <span className="font-mono text-xs tabular-nums text-muted-foreground">
                    {stage.progress}%
                  </span>
                ) : null}
              </div>
              <p className="text-xs text-muted-foreground">{JOB_STAGE_COPY[name]}</p>
              {stage.status === "RUNNING" ? (
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-indigo transition-[width] duration-300"
                    style={{ width: `${stage.progress}%` }}
                  />
                </div>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
