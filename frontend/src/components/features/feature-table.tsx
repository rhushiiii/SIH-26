import { useNavigate } from "@tanstack/react-router";
import { ConfidenceBadge } from "@/components/shared/confidence-badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { TypeBadge } from "@/components/shared/type-badge";
import { formatArea, formatConfidence, formatLength } from "@/lib/format";
import type { Feature } from "@/lib/types";
import { cn } from "@/lib/utils";

export function FeatureTable({
  features,
  selectedId,
  onSelect,
}: {
  features: Feature[];
  selectedId?: string | null;
  onSelect?: (feature: Feature) => void;
}) {
  const navigate = useNavigate();
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="bg-muted/60 text-xs tracking-wide text-muted-foreground uppercase">
          <tr>
            <th className="px-4 py-3 font-medium">ID</th>
            <th className="px-4 py-3 font-medium">Type</th>
            <th className="px-4 py-3 font-medium">Area / length</th>
            <th className="px-4 py-3 font-medium">Confidence</th>
            <th className="px-4 py-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {features.map((f) => (
            <tr
              key={f.feature_id}
              tabIndex={0}
              className={cn(
                "cursor-pointer border-t border-border hover:bg-muted/50",
                selectedId === f.feature_id && "bg-secondary",
              )}
              onClick={() => {
                onSelect?.(f);
                if (!onSelect) {
                  void navigate({
                    to: "/features/$featureId",
                    params: { featureId: f.feature_id },
                    search: { imageId: f.image_id },
                  });
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  (e.currentTarget as HTMLTableRowElement).click();
                }
              }}
            >
              <td className="px-4 py-2.5 font-mono text-xs text-navy">{f.feature_id}</td>
              <td className="px-4 py-2.5">
                <TypeBadge type={f.feature_type} />
              </td>
              <td className="px-4 py-2.5 tabular-nums">
                {f.feature_type === "ROAD"
                  ? formatLength(f.properties.length_m)
                  : formatArea(f.properties.area_m2)}
              </td>
              <td className="px-4 py-2.5">
                <ConfidenceBadge
                  level={f.properties.confidence_level}
                  score={f.properties.confidence}
                />
              </td>
              <td className="px-4 py-2.5">
                <StatusBadge status={f.properties.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function FeatureMeasure({ feature }: { feature: Feature }) {
  return (
    <span className="tabular-nums">
      {feature.feature_type === "ROAD"
        ? formatLength(feature.properties.length_m)
        : formatArea(feature.properties.area_m2)}
      <span className="sr-only">
        {" "}
        confidence {formatConfidence(feature.properties.confidence)}
      </span>
    </span>
  );
}
