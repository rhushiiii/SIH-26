import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Building2,
  CheckSquare,
  Droplets,
  Layers,
  Map as MapIcon,
  Route as RouteIcon,
  ShieldCheck,
  Upload,
  Workflow,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PipelineStrip } from "@/components/dashboard/pipeline-strip";
import { JobPipeline } from "@/components/jobs/job-pipeline";
import { JobStatusBadge } from "@/components/shared/status-badge";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { MetricCard } from "@/components/shared/metric-card";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime, formatNumber, formatPercent } from "@/lib/format";
import { useDashboard } from "@/hooks/use-analytics";
import { useJobs } from "@/hooks/use-jobs";
import { useReviewQueue } from "@/hooks/use-reviews";

export const Route = createFileRoute("/_app/")({
  component: DashboardPage,
});

const QUICK = [
  {
    to: "/images/upload" as const,
    label: "Upload image",
    hint: "Ingest GeoTIFF / RGB",
    icon: Upload,
  },
  {
    to: "/map" as const,
    label: "View map",
    hint: "Inspect GIS layers",
    icon: MapIcon,
  },
  {
    to: "/review" as const,
    label: "Review features",
    hint: "Human QA queue",
    icon: CheckSquare,
  },
  {
    to: "/exports" as const,
    label: "Export data",
    hint: "GeoJSON or CSV",
    icon: Layers,
  },
];

function DashboardPage() {
  const dash = useDashboard();
  const jobs = useJobs();
  const queue = useReviewQueue();

  if (dash.isError) {
    return (
      <div className="p-6">
        <ErrorState error={dash.error} onRetry={() => void dash.refetch()} />
      </div>
    );
  }

  const d = dash.data;
  const recent = jobs.data?.items ?? [];
  const live = recent.find(
    (j) => !["COMPLETED", "FAILED", "CANCELLED", "QUEUED"].includes(j.status),
  );
  const chart = [
    { name: "Completed", count: recent.filter((j) => j.status === "COMPLETED").length, fill: "#10B981" },
    { name: "Running", count: recent.filter((j) => !["COMPLETED", "FAILED", "CANCELLED", "QUEUED"].includes(j.status)).length, fill: "#4338CA" },
    { name: "Queued", count: recent.filter((j) => j.status === "QUEUED").length, fill: "#071A33" },
    { name: "Failed", count: recent.filter((j) => j.status === "FAILED").length, fill: "#EF4444" },
  ];

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <PageHeader
        eyebrow="Operations"
        title="Processing environment"
        description="Raw drone imagery → AI segmentation → GIS features → confidence → human validation → map → export."
        actions={
          <Button asChild>
            <Link to="/images/upload">
              <Upload className="size-4" />
              Upload image
            </Link>
          </Button>
        }
      />

      <Card className="p-4">
        <p className="mb-3 text-[11px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
          Intelligence pipeline
        </p>
        <PipelineStrip />
      </Card>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Total images"
          value={formatNumber(d?.total_images ?? 0)}
          icon={Layers}
          tone="navy"
          hint="Orthophotos in workspace"
        />
        <MetricCard
          label="Total jobs"
          value={formatNumber(d?.total_jobs ?? 0)}
          icon={Workflow}
          tone="navy"
          hint="Queued through completed"
        />
        <MetricCard
          label="Total features"
          value={formatNumber(d?.total_features ?? 0)}
          icon={Building2}
          tone="building"
          hint={`${formatNumber(d?.building_count ?? 0)} buildings`}
        />
        <MetricCard
          label="High confidence"
          value={formatPercent(d?.high_confidence_pct ?? 0, 1)}
          icon={ShieldCheck}
          tone="high"
          hint="Share of auto-accepted features"
        />
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <MetricCard
          label="Buildings"
          value={formatNumber(d?.building_count ?? 0)}
          icon={Building2}
          tone="building"
        />
        <MetricCard
          label="Road length"
          value={`${formatNumber(d?.road_length_km ?? 0, 0)} km`}
          icon={RouteIcon}
          tone="road"
        />
        <MetricCard
          label="Waterbodies"
          value={formatNumber(d?.waterbody_count ?? 0)}
          icon={Droplets}
          tone="water"
        />
      </section>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Recent jobs</CardTitle>
          </CardHeader>
          <CardContent>
            {jobs.isLoading ? (
              <LoadingState />
            ) : recent.length === 0 ? (
              <p className="text-sm text-muted-foreground">No jobs yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-sm">
                  <thead className="text-left text-xs tracking-wide text-muted-foreground uppercase">
                    <tr>
                      <th className="pb-2 font-medium">Raster</th>
                      <th className="pb-2 font-medium">Status</th>
                      <th className="pb-2 font-medium">Progress</th>
                      <th className="pb-2 font-medium">Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recent.slice(0, 6).map((job) => (
                      <tr key={job.job_id} className="border-t border-border">
                        <td className="py-2.5">
                          <Link
                            to="/jobs/$jobId"
                            params={{ jobId: job.job_id }}
                            className="font-medium text-navy hover:underline"
                          >
                            {job.filename}
                          </Link>
                        </td>
                        <td className="py-2.5">
                          <JobStatusBadge status={job.status} />
                        </td>
                        <td className="py-2.5 font-mono text-xs tabular-nums">
                          {job.progress}%
                        </td>
                        <td className="py-2.5 text-muted-foreground">
                          {formatDateTime(job.updated_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick actions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            {QUICK.map((q) => (
              <Link
                key={q.to}
                to={q.to}
                className="flex items-center gap-3 rounded-lg border border-border px-3 py-2.5 hover:bg-muted"
              >
                <span className="flex size-9 items-center justify-center rounded-md bg-navy text-white">
                  <q.icon className="size-4" />
                </span>
                <span>
                  <span className="block text-sm font-medium text-navy">{q.label}</span>
                  <span className="block text-xs text-muted-foreground">{q.hint}</span>
                </span>
              </Link>
            ))}
            <p className="pt-1 text-xs text-muted-foreground">
              Review queue: {queue.data?.length ?? 0} features waiting.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Processing overview</CardTitle>
          </CardHeader>
          <CardContent className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chart} barSize={28}>
                <CartesianGrid stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {chart.map((row) => (
                    <Cell key={row.name} fill={row.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{live ? "Live pipeline" : "Last completed pipeline"}</CardTitle>
          </CardHeader>
          <CardContent>
            {live || recent[0] ? (
              <JobPipeline job={live ?? recent[0]!} />
            ) : (
              <p className="text-sm text-muted-foreground">No jobs in this workspace.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
