import { Badge } from "@/components/ui/badge";
import { FEATURE_LABELS } from "@/lib/constants";
import type { FeatureType } from "@/lib/types";

const variant: Record<FeatureType, "building" | "road" | "water"> = {
  BUILDING: "building",
  ROAD: "road",
  WATERBODY: "water",
};

export function TypeBadge({ type }: { type: FeatureType }) {
  return (
    <Badge variant={variant[type]} className="normal-case tracking-normal">
      <span
        className="size-1.5 rounded-full"
        style={{
          background:
            type === "BUILDING" ? "#F59E0B" : type === "ROAD" ? "#F97316" : "#06B6D4",
        }}
        aria-hidden
      />
      {FEATURE_LABELS[type]}
    </Badge>
  );
}
