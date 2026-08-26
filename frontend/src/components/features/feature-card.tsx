import { ConfidenceBadge } from "@/components/shared/confidence-badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { TypeBadge } from "@/components/shared/type-badge";
import { Card } from "@/components/ui/card";
import { formatArea, formatLength } from "@/lib/format";
import type { Feature } from "@/lib/types";

export function FeatureCard({
  feature,
  onClick,
}: {
  feature: Feature;
  onClick?: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className="w-full text-left">
      <Card className="p-3 transition-shadow hover:shadow-md">
        <p className="font-mono text-xs text-muted-foreground">{feature.feature_id}</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <TypeBadge type={feature.feature_type} />
          <ConfidenceBadge
            level={feature.properties.confidence_level}
            score={feature.properties.confidence}
          />
        </div>
        <p className="mt-2 text-sm font-medium text-navy">
          {feature.feature_type === "ROAD"
            ? formatLength(feature.properties.length_m)
            : formatArea(feature.properties.area_m2)}
        </p>
        <div className="mt-2">
          <StatusBadge status={feature.properties.status} />
        </div>
      </Card>
    </button>
  );
}
