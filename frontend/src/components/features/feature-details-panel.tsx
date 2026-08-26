import { Link } from "@tanstack/react-router";
import { MapPinned, Pencil, ShieldCheck, X } from "lucide-react";
import { ConfidenceBadge } from "@/components/shared/confidence-badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { TypeBadge } from "@/components/shared/type-badge";
import { Button } from "@/components/ui/button";
import { formatArea, formatConfidence, formatCoord, formatLength } from "@/lib/format";
import { centroidOf } from "@/lib/geo";
import type { Feature } from "@/lib/types";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border py-2 last:border-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-right text-sm font-medium text-navy">{children}</dd>
    </div>
  );
}

export function FeatureDetailsPanel({
  feature,
  onClose,
  onReview,
  onEdit,
}: {
  feature: Feature;
  onClose?: () => void;
  onReview?: () => void;
  onEdit?: () => void;
}) {
  const c = centroidOf(feature.geometry);
  const p = feature.properties;
  return (
    <aside className="flex h-full flex-col bg-card">
      <div className="flex items-start justify-between gap-2 border-b border-border px-4 py-3">
        <div>
          <p className="font-mono text-[11px] text-muted-foreground">{feature.feature_id}</p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <TypeBadge type={feature.feature_type} />
            <ConfidenceBadge level={p.confidence_level} />
          </div>
        </div>
        {onClose ? (
          <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close panel">
            <X className="size-4" />
          </Button>
        ) : null}
      </div>
      <dl className="flex-1 overflow-auto px-4 py-2">
        <Row label="Feature ID">
          <span className="font-mono text-xs">{feature.feature_id}</span>
        </Row>
        <Row label="Type">{feature.feature_type}</Row>
        {p.area_m2 != null ? <Row label="Area">{formatArea(p.area_m2)}</Row> : null}
        {p.perimeter_m != null ? (
          <Row label="Perimeter">{formatLength(p.perimeter_m)}</Row>
        ) : null}
        {p.length_m != null ? <Row label="Length">{formatLength(p.length_m)}</Row> : null}
        <Row label="Confidence">{formatConfidence(p.confidence)}</Row>
        <Row label="Confidence level">{p.confidence_level}</Row>
        <Row label="Status">
          <StatusBadge status={p.status} />
        </Row>
        <Row label="Centroid">
          <span className="font-mono text-xs">
            {formatCoord(c.lat, 5)}, {formatCoord(c.lng, 5)}
          </span>
        </Row>
        {feature.feature_type === "BUILDING" ? (
          <>
            <Row label="Roof type">{p.roof_type ?? "—"}</Row>
            <Row label="Roof confidence">
              {p.roof_confidence != null ? formatConfidence(p.roof_confidence) : "—"}
            </Row>
          </>
        ) : null}
      </dl>
      <div className="grid grid-cols-3 gap-2 border-t border-border p-3">
        <Button asChild variant="outline" size="sm">
          <Link
            to="/map"
            search={{ imageId: feature.image_id, featureId: feature.feature_id }}
          >
            <MapPinned className="size-3.5" />
            Map
          </Link>
        </Button>
        <Button variant="outline" size="sm" onClick={onEdit}>
          <Pencil className="size-3.5" />
          Edit
        </Button>
        <Button size="sm" onClick={onReview}>
          <ShieldCheck className="size-3.5" />
          Review
        </Button>
      </div>
    </aside>
  );
}
