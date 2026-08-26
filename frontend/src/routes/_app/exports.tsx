import { createFileRoute } from "@tanstack/react-router";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { ExportPanel } from "@/components/exports/export-panel";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getApiBaseUrl } from "@/lib/config";
import { formatDateTime, formatNumber } from "@/lib/format";
import { useCreateExport, useExports } from "@/hooks/use-exports";
import { useImages } from "@/hooks/use-images";

export const Route = createFileRoute("/_app/exports")({
  component: ExportsPage,
});

function ExportsPage() {
  const images = useImages();
  const list = useExports();
  const create = useCreateExport();
  const apiBase = getApiBaseUrl().replace(/\/api\/v1\/?$/, "");

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <PageHeader
        eyebrow="Delivery"
        title="Exports"
        description="Package accepted GIS layers as GeoJSON or CSV. Downloads are issued by the export API."
      />
      <Card>
        <CardHeader>
          <CardTitle>New export</CardTitle>
        </CardHeader>
        <CardContent>
          <ExportPanel
            images={images.data?.items ?? []}
            pending={create.isPending}
            onExport={(input) =>
              create.mutate(input, {
                onSuccess: (rec) => toast.success(`Export ready · ${rec.filename}`),
                onError: (e) => toast.error(e.message),
              })
            }
          />
        </CardContent>
      </Card>
      {list.isLoading ? (
        <LoadingState />
      ) : list.isError ? (
        <ErrorState error={list.error} onRetry={() => void list.refetch()} />
      ) : !list.data?.items.length ? (
        <EmptyState title="No exports yet" description="Create a GeoJSON or CSV package above." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-muted/50 text-left text-xs tracking-wide text-muted-foreground uppercase">
              <tr>
                <th className="px-4 py-3 font-medium">File</th>
                <th className="px-4 py-3 font-medium">Format</th>
                <th className="px-4 py-3 font-medium">Layers</th>
                <th className="px-4 py-3 font-medium">Features</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {list.data.items.map((row) => (
                <tr key={row.export_id} className="border-t border-border">
                  <td className="px-4 py-3">
                    {row.download_url && row.download_url !== "#" ? (
                      <a
                        href={
                          row.download_url.startsWith("http")
                            ? row.download_url
                            : `${apiBase}${row.download_url}`
                        }
                        download={row.filename}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 font-medium text-navy hover:underline"
                      >
                        {row.filename}
                        <Download className="size-3.5 text-muted-foreground" />
                      </a>
                    ) : (
                      <p className="font-medium text-navy">{row.filename}</p>
                    )}
                    <p className="font-mono text-[11px] text-muted-foreground">
                      {row.export_id}
                    </p>
                  </td>
                  <td className="px-4 py-3">{row.format}</td>

                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {row.layers.map((l) => (
                        <Badge key={l} variant="outline" className="normal-case">
                          {l}
                        </Badge>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 tabular-nums">
                    {formatNumber(row.feature_count ?? 0)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={row.status === "COMPLETED" ? "success" : "warning"}>
                      {row.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDateTime(row.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
