import { createFileRoute } from "@tanstack/react-router";
import { Layers, ShieldAlert, ShieldCheck, ShieldQuestion } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { GeoMapHost } from "@/components/map/geo-map-host";
import { ReviewPanel } from "@/components/review/review-panel";
import { ConfidenceBadge } from "@/components/shared/confidence-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { MetricCard } from "@/components/shared/metric-card";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { TypeBadge } from "@/components/shared/type-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PRIMARY_IMAGE_ID } from "@/lib/constants";
import { formatConfidence, formatNumber, formatPercent } from "@/lib/format";
import { useAnalytics } from "@/hooks/use-analytics";
import { useMapFeatures } from "@/hooks/use-features";
import { useReviewFeature, useReviewQueue } from "@/hooks/use-reviews";
import type { Feature } from "@/lib/types";
import { cn } from "@/lib/utils";

type Search = { featureId?: string; imageId?: string };

export const Route = createFileRoute("/_app/review")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    featureId: typeof s.featureId === "string" ? s.featureId : undefined,
    imageId: typeof s.imageId === "string" ? s.imageId : undefined,
  }),
  component: ReviewPage,
});

function ReviewPage() {
  const search = Route.useSearch();
  const imageId = search.imageId ?? PRIMARY_IMAGE_ID;
  const queue = useReviewQueue(imageId);
  const analytics = useAnalytics(imageId);
  const mapFeats = useMapFeatures(imageId);
  const review = useReviewFeature();
  const [selected, setSelected] = useState<Feature | null>(null);
  const items = queue.data ?? [];

  useEffect(() => {
    if (!queue.data) return;
    if (search.featureId) {
      const hit = queue.data.find((f) => f.feature_id === search.featureId);
      if (hit) {
        setSelected(hit);
        return;
      }
    }
    setSelected((cur) => cur ?? queue.data[0] ?? null);
  }, [queue.data, search.featureId]);

  const a = analytics.data;
  const preview = useMemo(() => {
    if (!selected) return mapFeats.data ?? [];
    const nearby = (mapFeats.data ?? []).filter(
      (f) =>
        f.feature_id === selected.feature_id ||
        f.feature_type === selected.feature_type,
    );
    return nearby.length ? nearby : [selected];
  }, [mapFeats.data, selected]);

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] min-h-0 flex-col">
      <div className="space-y-4 border-b border-border p-4 sm:p-6">
        <PageHeader
          eyebrow="Quality"
          title="Review & QA"
          description="Accept, edit, or reject model output. Decisions invalidate feature and analytics caches."
        />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Total features"
            value={formatNumber(a?.total_features ?? 0)}
            icon={Layers}
            tone="navy"
          />
          <MetricCard
            label="High confidence"
            value={a ? formatPercent(a.high_confidence_pct, 1) : "—"}
            icon={ShieldCheck}
            tone="high"
          />
          <MetricCard
            label="Medium confidence"
            value={a ? formatPercent(a.medium_confidence_pct, 1) : "—"}
            icon={ShieldQuestion}
            tone="building"
          />
          <MetricCard
            label="Low confidence"
            value={a ? formatPercent(a.low_confidence_pct, 1) : "—"}
            icon={ShieldAlert}
            tone="road"
          />
        </div>
      </div>

      {queue.isLoading ? (
        <div className="p-6">
          <LoadingState />
        </div>
      ) : queue.isError ? (
        <div className="p-6">
          <ErrorState error={queue.error} onRetry={() => void queue.refetch()} />
        </div>
      ) : items.length === 0 ? (
        <div className="p-6">
          <EmptyState
            title="Queue clear"
            description="No features currently require human review."
          />
        </div>
      ) : (
        <div className="grid min-h-0 flex-1 lg:grid-cols-[320px_1fr]">
          <aside className="max-h-[40vh] overflow-auto border-b border-border lg:max-h-none lg:border-r lg:border-b-0">
            <p className="px-4 py-3 text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
              Review queue · {items.length}
            </p>
            <ul>
              {items.map((f) => (
                <li key={f.feature_id}>
                  <button
                    type="button"
                    onClick={() => setSelected(f)}
                    className={cn(
                      "flex w-full flex-col gap-1 border-b border-border px-4 py-3 text-left hover:bg-muted/60",
                      selected?.feature_id === f.feature_id && "bg-secondary",
                    )}
                  >
                    <span className="font-mono text-xs text-navy">{f.feature_id}</span>
                    <span className="flex flex-wrap items-center gap-1.5">
                      <TypeBadge type={f.feature_type} />
                      <ConfidenceBadge
                        level={f.properties.confidence_level}
                        score={f.properties.confidence}
                      />
                    </span>
                    <StatusBadge status={f.properties.status} />
                  </button>
                </li>
              ))}
            </ul>
          </aside>
          <div className="grid min-h-[520px] xl:grid-cols-[1fr_340px]">
            <GeoMapHost
              className="min-h-[320px]"
              chrome="minimal"
              features={preview}
              selectedId={selected?.feature_id ?? null}
              onSelect={(f) => f && setSelected(f)}
            />
            {selected ? (
              <Card className="rounded-none border-0 shadow-none xl:border-l">
                <CardHeader>
                  <CardTitle className="font-mono text-sm">{selected.feature_id}</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {selected.feature_type} · {formatConfidence(selected.properties.confidence)}
                  </p>
                </CardHeader>
                <CardContent>
                  <ReviewPanel
                    feature={selected}
                    pending={review.isPending}
                    onSubmit={(action, comment) => {
                      review.mutate(
                        { featureId: selected.feature_id, body: { action, comment } },
                        {
                          onSuccess: () => {
                            toast.success(
                              action === "ACCEPT"
                                ? "Feature accepted"
                                : action === "REJECT"
                                  ? "Feature rejected"
                                  : "Marked as edited",
                            );
                            setSelected(null);
                          },
                          onError: (e) => toast.error(e.message),
                        },
                      );
                    }}
                  />
                </CardContent>
              </Card>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
