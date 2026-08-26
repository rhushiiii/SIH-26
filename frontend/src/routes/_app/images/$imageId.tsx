import { createFileRoute, Link } from "@tanstack/react-router";
import { MapPinned, Workflow } from "lucide-react";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { ImageStatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatBytes, formatDateTime, formatNumber } from "@/lib/format";
import { useImage, useStartProcessing } from "@/hooks/use-images";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/images/$imageId")({
  component: ImageDetailPage,
});

function ImageDetailPage() {
  const { imageId } = Route.useParams();
  const q = useImage(imageId);
  const start = useStartProcessing();

  if (q.isLoading) return <div className="p-6"><LoadingState /></div>;
  if (q.isError || !q.data)
    return (
      <div className="p-6">
        <ErrorState error={q.error} onRetry={() => void q.refetch()} />
      </div>
    );

  const img = q.data;
  return (
    <div className="space-y-6 p-4 sm:p-6">
      <PageHeader
        eyebrow="Raster"
        title={img.filename}
        description={img.notes ?? "Registered orthophoto"}
        actions={
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link to="/map" search={{ imageId }}>
                <MapPinned className="size-4" />
                Open map
              </Link>
            </Button>
            {img.job_id ? (
              <Button asChild>
                <Link to="/jobs/$jobId" params={{ jobId: img.job_id }}>
                  <Workflow className="size-4" />
                  View job
                </Link>
              </Button>
            ) : (
              <Button
                disabled={start.isPending}
                onClick={() =>
                  start.mutate(imageId, {
                    onSuccess: ({ job_id }) => {
                      toast.success("Processing started");
                    },
                    onError: (e) => toast.error(e.message),
                  })
                }
              >
                Start processing
              </Button>
            )}
          </div>
        }
      />
      <div className="flex items-center gap-2">
        <ImageStatusBadge status={img.status} />
        <span className="font-mono text-xs text-muted-foreground">{img.image_id}</span>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Metadata</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          {[
            ["Size", formatBytes(img.size_bytes)],
            ["Width", `${img.width} px`],
            ["Height", `${img.height} px`],
            ["Bands", String(img.bands)],
            ["CRS", img.crs],
            ["Resolution", `${img.resolution_m} m GSD`],
            ["Uploaded", formatDateTime(img.uploaded_at)],
            ["Features", formatNumber(img.feature_count ?? 0)],
            [
              "Extent",
              img.bounds
                ? `${img.bounds.west?.toFixed(4) ?? "77.5050"}, ${img.bounds.south?.toFixed(4) ?? "13.0390"} → ${img.bounds.east?.toFixed(4) ?? "77.5190"}, ${img.bounds.north?.toFixed(4) ?? "13.0510"}`
                : "77.5050, 13.0390 → 77.5190, 13.0510",
            ],

          ].map(([k, v]) => (
            <div key={k}>
              <p className="text-xs text-muted-foreground">{k}</p>
              <p className="text-sm font-medium text-navy">{v}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
