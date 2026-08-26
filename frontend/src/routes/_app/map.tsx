import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { GeoMapHost } from "@/components/map/geo-map-host";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PRIMARY_IMAGE_ID } from "@/lib/constants";
import { useMapFeatures } from "@/hooks/use-features";
import { useImages } from "@/hooks/use-images";
import type { Feature } from "@/lib/types";

type Search = {
  imageId?: string;
  featureId?: string;
};

export const Route = createFileRoute("/_app/map")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    imageId: typeof s.imageId === "string" ? s.imageId : undefined,
    featureId: typeof s.featureId === "string" ? s.featureId : undefined,
  }),
  component: MapExplorerPage,
});

function MapExplorerPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/map" });
  const images = useImages();
  const imageId = search.imageId ?? PRIMARY_IMAGE_ID;
  const feats = useMapFeatures(imageId);
  const [selected, setSelected] = useState<Feature | null>(null);

  useEffect(() => {
    if (!search.featureId || !feats.data) return;
    setSelected(feats.data.find((x) => x.feature_id === search.featureId) ?? null);
  }, [search.featureId, feats.data]);

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] min-h-0 flex-col">
      <div className="flex items-center gap-3 border-b border-border bg-card px-3 py-2 sm:px-4">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold tracking-[0.14em] text-indigo uppercase">
            GIS
          </p>
          <h1 className="truncate text-sm font-semibold text-navy sm:text-base">
            Map explorer
          </h1>
        </div>
        <Select
          value={imageId}
          onValueChange={(v) =>
            void navigate({ search: { imageId: v, featureId: undefined } })
          }
        >
          <SelectTrigger className="h-9 w-[min(100%,16rem)]" aria-label="Image">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(images.data?.items ?? [])
              .filter((i) => i.status === "COMPLETED")
              .map((img) => (
                <SelectItem key={img.image_id} value={img.image_id}>
                  {img.filename}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>
      <div className="relative min-h-0 flex-1">
        {feats.isLoading ? (
          <div className="p-6">
            <LoadingState label="Loading features" />
          </div>
        ) : feats.isError ? (
          <div className="p-6">
            <ErrorState error={feats.error} onRetry={() => void feats.refetch()} />
          </div>
        ) : (
          <GeoMapHost
            className="absolute inset-0 min-h-0"
            features={feats.data ?? []}
            selectedId={selected?.feature_id ?? null}
            onSelect={(f) => {
              setSelected(f);
              void navigate({
                search: { imageId, featureId: f?.feature_id },
              });
            }}
            onReview={(f) =>
              void navigate({
                to: "/review",
                search: { featureId: f.feature_id, imageId: f.image_id },
              })
            }
            onEdit={() => toast.message("Vertex editing is available in Review & QA.")}
          />
        )}
      </div>
    </div>
  );
}
