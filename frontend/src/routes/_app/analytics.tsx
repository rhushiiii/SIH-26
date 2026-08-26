import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Building2, Droplets, Route as RouteIcon, ShieldCheck } from "lucide-react";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { MetricCard } from "@/components/shared/metric-card";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PRIMARY_IMAGE_ID } from "@/lib/constants";
import { formatArea, formatLength, formatNumber, formatPercent } from "@/lib/format";
import { useAnalytics } from "@/hooks/use-analytics";
import { useImages } from "@/hooks/use-images";

export const Route = createFileRoute("/_app/analytics")({
  component: AnalyticsPage,
});

const TYPE_COLORS = ["#F59E0B", "#F97316", "#06B6D4"];

function AnalyticsPage() {
  const images = useImages();
  const [imageId, setImageId] = useState(PRIMARY_IMAGE_ID);
  const q = useAnalytics(imageId);

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <PageHeader
        eyebrow="Coverage"
        title="Analytics"
        description="Derived from polygonized GIS features — charts stay secondary to the map."
        actions={
          <Select value={imageId} onValueChange={setImageId}>
            <SelectTrigger className="w-64" aria-label="Image">
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
        }
      />
      {q.isLoading ? (
        <LoadingState />
      ) : q.isError || !q.data ? (
        <ErrorState error={q.error} onRetry={() => void q.refetch()} />
      ) : (
        <>
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <MetricCard
              label="Building count"
              value={formatNumber(q.data.building_count)}
              icon={Building2}
              tone="building"
            />
            <MetricCard
              label="Built-up area"
              value={formatArea(q.data.built_up_area_m2)}
              icon={Building2}
              tone="building"
            />
            <MetricCard
              label="Road length"
              value={formatLength(q.data.road_length_m)}
              icon={RouteIcon}
              tone="road"
              hint={`Area ${formatArea(q.data.road_area_m2)}`}
            />
            <MetricCard
              label="Waterbody area"
              value={formatArea(q.data.waterbody_area_m2)}
              icon={Droplets}
              tone="water"
            />
            <MetricCard
              label="Avg building area"
              value={formatArea(q.data.average_building_area_m2)}
              icon={Building2}
              tone="navy"
            />
            <MetricCard
              label="High confidence"
              value={formatPercent(q.data.high_confidence_pct, 1)}
              icon={ShieldCheck}
              tone="high"
              hint={`Built-up coverage ${formatPercent(q.data.built_up_coverage_pct, 1)}`}
            />
          </section>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Feature count by type</CardTitle>
              </CardHeader>
              <CardContent className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={q.data.feature_count_by_type} barSize={32}>
                    <CartesianGrid stroke="#E2E8F0" vertical={false} />
                    <XAxis dataKey="type" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {q.data.feature_count_by_type.map((_, i) => (
                        <Cell key={i} fill={TYPE_COLORS[i] ?? "#4338CA"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Confidence distribution</CardTitle>
              </CardHeader>
              <CardContent className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={q.data.confidence_distribution} barSize={18}>
                    <CartesianGrid stroke="#E2E8F0" vertical={false} />
                    <XAxis dataKey="bucket" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#4338CA" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Features over time</CardTitle>
              </CardHeader>
              <CardContent className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={q.data.features_over_time}>
                    <CartesianGrid stroke="#E2E8F0" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 11 }} domain={["auto", "auto"]} />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke="#2563EB"
                      fill="#2563EB22"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Built-up coverage</CardTitle>
              </CardHeader>
              <CardContent className="flex h-56 items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        {
                          name: "Built-up",
                          value: q.data.built_up_coverage_pct,
                        },
                        {
                          name: "Remainder",
                          value: 100 - q.data.built_up_coverage_pct,
                        },
                      ]}
                      dataKey="value"
                      innerRadius={58}
                      outerRadius={80}
                      paddingAngle={2}
                    >
                      <Cell fill="#F59E0B" />
                      <Cell fill="#E2E8F0" />
                    </Pie>
                    <Tooltip formatter={(v: number) => `${v.toFixed(1)}%`} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
