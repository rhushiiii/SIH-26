import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-[11px] font-semibold tracking-wide uppercase",
  {
    variants: {
      variant: {
        default: "bg-secondary text-secondary-foreground",
        navy: "bg-navy/10 text-navy",
        outline: "border border-border text-muted-foreground",
        success: "bg-confidence-high/12 text-confidence-high",
        warning: "bg-building/12 text-building",
        danger: "bg-confidence-low/12 text-confidence-low",
        building: "bg-building/15 text-amber-800",
        road: "bg-road/15 text-orange-800",
        water: "bg-water/15 text-cyan-800",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
