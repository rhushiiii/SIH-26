import { createFileRoute, Link } from "@tanstack/react-router";
import { Upload } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { ImageStatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatBytes, formatDateTime, formatNumber } from "@/lib/format";
import { useImages } from "@/hooks/use-images";

export const Route = createFileRoute("/_app/images/")({
  component: ImagesPage,
});

function ImagesPage() {
  const q = useImages();
  return (
    <div className="space-y-6 p-4 sm:p-6">
      <PageHeader
        eyebrow="Ingest"
        title="Orthophoto library"
        description="Validated rasters ready for tiling, inference, and GIS write-back."
        actions={
          <Button asChild>
            <Link to="/images/upload">
              <Upload className="size-4" />
              Upload image
            </Link>
          </Button>
        }
      />
      {q.isLoading ? (
        <LoadingState />
      ) : q.isError ? (
        <ErrorState error={q.error} onRetry={() => void q.refetch()} />
      ) : !q.data?.items.length ? (
        <EmptyState
          title="No images yet"
          description="Upload a GeoTIFF to start the pipeline."
          action={
            <Button asChild>
              <Link to="/images/upload">Upload image</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {q.data.items.map((img) => (
            <Link
              key={img.image_id}
              to="/images/$imageId"
              params={{ imageId: img.image_id }}
            >
              <Card className="h-full overflow-hidden transition-shadow hover:shadow-md">
                <div className="relative h-28 bg-navy">
                  <div
                    className="absolute inset-0 opacity-70"
                    style={{
                      background:
                        "linear-gradient(135deg, #12325c 0%, #071A33 40%, #0e4a5c 100%)",
                    }}
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(245,158,11,0.18)_1px,transparent_1px),linear-gradient(to_bottom,rgba(6,182,212,0.18)_1px,transparent_1px)] bg-size-[18px_18px]" />
                  <div className="absolute right-3 bottom-3">
                    <ImageStatusBadge status={img.status} />
                  </div>
                </div>
                <div className="space-y-2 p-4">
                  <p className="truncate font-semibold text-navy">{img.filename}</p>
                  <p className="font-mono text-[11px] text-muted-foreground">
                    {img.image_id} · {img.crs} · {img.resolution_m} m
                  </p>
                  <dl className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <dt className="text-muted-foreground">Size</dt>
                      <dd className="font-medium tabular-nums">{formatBytes(img.size_bytes)}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Pixels</dt>
                      <dd className="font-medium tabular-nums">
                        {img.width}×{img.height}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Features</dt>
                      <dd className="font-medium tabular-nums">
                        {formatNumber(img.feature_count ?? 0)}
                      </dd>
                    </div>
                  </dl>
                  <p className="text-xs text-muted-foreground">
                    {formatDateTime(img.uploaded_at)}
                  </p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
