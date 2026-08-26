import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { UploadDropzone } from "@/components/images/upload-dropzone";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatBytes } from "@/lib/format";
import { useStartProcessing, useUploadImage } from "@/hooks/use-images";
import type { ImageRecord } from "@/lib/types";

export const Route = createFileRoute("/_app/images/upload")({
  component: UploadPage,
});

function UploadPage() {
  const upload = useUploadImage();
  const start = useStartProcessing();
  const navigate = useNavigate();
  const [image, setImage] = useState<ImageRecord | null>(null);

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6">
      <PageHeader
        eyebrow="Ingest"
        title="Upload orthophoto"
        description="Accepted rasters: GeoTIFF, TIFF, PNG, JPG. Metadata is read from the public images API — the UI never inspects the filesystem."
      />
      <UploadDropzone
        disabled={upload.isPending}
        onFile={(file) => {
          upload.mutate(file, {
            onSuccess: (img) => {
              setImage(img);
              toast.success("Raster registered");
            },
            onError: (err) => toast.error(err.message),
          });
        }}
      />
      {image ? (
        <Card>
          <CardHeader>
            <CardTitle>File metadata</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
              <Meta label="Filename" value={image.filename} />
              <Meta label="Size" value={formatBytes(image.size_bytes)} />
              <Meta label="Width" value={`${image.width} px`} />
              <Meta label="Height" value={`${image.height} px`} />
              <Meta label="Bands" value={String(image.bands)} />
              <Meta label="CRS" value={image.crs} />
              <Meta label="Resolution" value={`${image.resolution_m} m`} />
              <Meta label="Image ID" value={image.image_id} mono />
            </dl>
            <div className="mt-5 flex gap-2">
              <Button
                disabled={start.isPending}
                onClick={() => {
                  start.mutate(image.image_id, {
                    onSuccess: ({ job_id }) => {
                      toast.success("Processing started");
                      void navigate({ to: "/jobs/$jobId", params: { jobId: job_id } });
                    },
                    onError: (err) => toast.error(err.message),
                  });
                }}
              >
                Start processing
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  void navigate({
                    to: "/images/$imageId",
                    params: { imageId: image.image_id },
                  })
                }
              >
                View image
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function Meta({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={mono ? "font-mono text-xs" : "font-medium text-navy"}>{value}</dd>
    </div>
  );
}
