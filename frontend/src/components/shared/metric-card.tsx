import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function MetricCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "navy",
}: {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  tone?: "navy" | "building" | "road" | "water" | "high";
}) {
  const toneClass = {
    navy: "bg-navy/8 text-navy",
    building: "bg-building/12 text-amber-800",
    road: "bg-road/12 text-orange-800",
    water: "bg-water/12 text-cyan-800",
    high: "bg-confidence-high/12 text-emerald-800",
  }[tone];

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {label}
          </p>
          <p className="mt-2 font-sans text-2xl font-semibold tracking-tight text-navy tabular-nums">
            {value}
          </p>
          {hint ? (
            <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
          ) : null}
        </div>
        <span
          className={cn(
            "flex size-9 items-center justify-center rounded-lg",
            toneClass,
          )}
        >
          <Icon className="size-4" />
        </span>
      </div>
    </Card>
  );
}
