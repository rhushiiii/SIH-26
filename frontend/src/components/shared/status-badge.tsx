import { Badge } from "@/components/ui/badge";
import { JOB_STATUS_LABELS, STATUS_LABELS } from "@/lib/constants";
import type { FeatureStatus, ImageStatus, JobStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const featureVariant: Record<FeatureStatus, "success" | "warning" | "danger" | "navy" | "default"> = {
  AUTO_ACCEPTED: "success",
  ACCEPTED: "success",
  REVIEW_RECOMMENDED: "warning",
  HUMAN_REVIEW_REQUIRED: "danger",
  REJECTED: "danger",
  EDITED: "navy",
};

export function StatusBadge({ status }: { status: FeatureStatus }) {
  return (
    <Badge variant={featureVariant[status]} className="normal-case tracking-normal">
      <span
        className={cn(
          "size-1.5 rounded-full",
          featureVariant[status] === "success" && "bg-confidence-high",
          featureVariant[status] === "warning" && "bg-building",
          featureVariant[status] === "danger" && "bg-confidence-low",
          featureVariant[status] === "navy" && "bg-navy",
        )}
        aria-hidden
      />
      {STATUS_LABELS[status]}
    </Badge>
  );
}

export function JobStatusBadge({ status }: { status: JobStatus }) {
  const terminal = ["COMPLETED", "FAILED", "CANCELLED"].includes(status);
  const variant =
    status === "COMPLETED"
      ? "success"
      : status === "FAILED"
        ? "danger"
        : status === "CANCELLED"
          ? "outline"
          : status === "QUEUED"
            ? "navy"
            : "warning";
  return (
    <Badge variant={variant} className="normal-case tracking-normal">
      <span
        className={cn(
          "size-1.5 rounded-full",
          !terminal && status !== "QUEUED" && "animate-pulse",
          variant === "success" && "bg-confidence-high",
          variant === "danger" && "bg-confidence-low",
          variant === "warning" && "bg-building",
          variant === "navy" && "bg-navy",
          variant === "outline" && "bg-muted-foreground",
        )}
        aria-hidden
      />
      {JOB_STATUS_LABELS[status]}
    </Badge>
  );
}

export function ImageStatusBadge({ status }: { status: ImageStatus }) {
  const variant =
    status === "COMPLETED"
      ? "success"
      : status === "FAILED"
        ? "danger"
        : status === "PROCESSING"
          ? "warning"
          : "navy";
  return (
    <Badge variant={variant} className="normal-case tracking-normal">
      {status === "UPLOADED"
        ? "Uploaded"
        : status === "PROCESSING"
          ? "Processing"
          : status === "COMPLETED"
            ? "Completed"
            : "Failed"}
    </Badge>
  );
}
