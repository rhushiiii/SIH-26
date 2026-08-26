import { PIPELINE_STEPS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function PipelineStrip() {
  return (
    <ol className="flex flex-wrap items-center gap-1.5">
      {PIPELINE_STEPS.map((step, i) => (
        <li key={step} className="flex items-center gap-1.5">
          <span
            className={cn(
              "rounded-md px-2 py-1 text-[11px] font-semibold tracking-wide uppercase",
              i === 0 && "bg-navy text-white",
              i > 0 && i < PIPELINE_STEPS.length - 1 && "bg-secondary text-secondary-foreground",
              i === PIPELINE_STEPS.length - 1 && "bg-confidence-high/12 text-emerald-800",
            )}
          >
            {step}
          </span>
          {i < PIPELINE_STEPS.length - 1 ? (
            <span className="text-border" aria-hidden>
              →
            </span>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
