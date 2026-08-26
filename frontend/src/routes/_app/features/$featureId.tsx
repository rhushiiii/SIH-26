import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { FeatureDetailsPanel } from "@/components/features/feature-details-panel";
import { GeoMapHost } from "@/components/map/geo-map-host";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PRIMARY_IMAGE_ID } from "@/lib/constants";
import { useFeature, useMapFeatures } from "@/hooks/use-features";

type Search = { imageId?: string };

export const Route = createFileRoute("/_app/features/$featureId")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    imageId: typeof s.imageId === "string" ? s.imageId : undefined,
  }),
  component: FeatureDetailPage,
});

function FeatureDetailPage() {
  const { featureId } = Route.useParams();
  const { imageId } = Route.useSearch();
  const resolvedImage = imageId ?? PRIMARY_IMAGE_ID;
  const q = useFeature(resolvedImage, featureId);
  const mapFeats = useMapFeatures(resolvedImage);
  const navigate = useNavigate();

  if (q.isLoading)
    return (
      <div className="p-6">
        <LoadingState />
      </div>
    );
  if (q.isError || !q.data)
    return (
      <div className="p-6">
        <ErrorState error={q.error} onRetry={() => void q.refetch()} />
      </div>
    );

  const feature = q.data;
  const around = mapFeats.data ?? [feature];

  return (
    <div className="grid h-full min-h-[640px] lg:grid-cols-[1fr_320px]">
      <GeoMapHost
        className="min-h-[360px] lg:min-h-full"
        chrome="minimal"
        features={around}
        selectedId={feature.feature_id}
        onSelect={(f) => {
          if (!f) return;
          void navigate({
            to: "/features/$featureId",
            params: { featureId: f.feature_id },
            search: { imageId: f.image_id },
          });
        }}
        onReview={(f) =>
          void navigate({
            to: "/review",
            search: { featureId: f.feature_id, imageId: f.image_id },
          })
        }
        onEdit={() => toast.message("Open Review & QA to edit geometry.")}
      />
      <div className="hidden border-l border-border lg:block">
        <FeatureDetailsPanel
          feature={feature}
          onReview={() =>
            void navigate({
              to: "/review",
              search: { featureId: feature.feature_id, imageId: feature.image_id },
            })
          }
          onEdit={() => toast.message("Open Review & QA to edit geometry.")}
        />
      </div>
    </div>
  );
}
