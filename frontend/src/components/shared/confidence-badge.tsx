import { Badge } from "@/components/ui/badge";
import { formatPercent } from "@/lib/format";
import type { ConfidenceLevel } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ConfidenceBadge({
  level,
  score,
}: {
  level: ConfidenceLevel;
  score?: number;
}) {
  const variant = level === "HIGH" ? "success" : level === "MEDIUM" ? "warning" : "danger";
  return (
    <Badge variant={variant} className="normal-case tracking-normal">
      <span
        className={cn(
          "size-1.5 rounded-full",
          level === "HIGH" && "bg-confidence-high",
          level === "MEDIUM" && "bg-building",
          level === "LOW" && "bg-confidence-low",
        )}
        aria-hidden
      />
      {level}
      {score != null ? (
        <span className="font-mono font-medium tabular-nums">
          {formatPercent(score, 1)}
        </span>
      ) : null}
    </Badge>
  );
}
