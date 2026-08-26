import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { FilterPanel, type FeatureFilters } from "@/components/map/filter-panel";
import { FeatureTable } from "@/components/features/feature-table";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { TableSkeleton } from "@/components/shared/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PAGE_SIZE, PRIMARY_IMAGE_ID } from "@/lib/constants";
import { useDebounce } from "@/hooks/use-debounce";
import { useFeatures } from "@/hooks/use-features";
import { useImages } from "@/hooks/use-images";

export const Route = createFileRoute("/_app/features/")({
  component: FeaturesPage,
});

function FeaturesPage() {
  const images = useImages();
  const completedImages = (images.data?.items ?? []).filter((i) => i.status === "COMPLETED");
  const fallbackImageId =
    completedImages[0]?.image_id ??
    images.data?.items?.[0]?.image_id ??
    PRIMARY_IMAGE_ID;
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const imageId =
    selectedImageId ??
    (images.data?.items?.some((i) => i.image_id === PRIMARY_IMAGE_ID)
      ? PRIMARY_IMAGE_ID
      : fallbackImageId);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const debounced = useDebounce(q);
  const [filters, setFilters] = useState<FeatureFilters>({
    type: "ALL",
    confidence: "ALL",
    status: "ALL",
  });
  const navigate = useNavigate();
  const list = useFeatures({
    image_id: imageId,
    page,
    page_size: PAGE_SIZE,
    q: debounced,
    ...filters,
  });


  const total = list.data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-5 p-4 sm:p-6">
      <PageHeader
        eyebrow="Vector"
        title="GIS features"
        description="Buildings, roads, and waterbodies returned by the public features API. Geometry is rendered as received — never reconstructed."
      />
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
        <div className="w-full lg:max-w-xs">
          <Select
            value={imageId}
            onValueChange={(v) => {
              setSelectedImageId(v);
              setPage(1);
            }}
          >

            <SelectTrigger aria-label="Image">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(images.data?.items ?? []).map((img) => (
                <SelectItem key={img.image_id} value={img.image_id}>
                  {img.filename}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
          placeholder="Search feature ID"
          aria-label="Search features"
          className="lg:max-w-xs"
        />
      </div>
      <FilterPanel
        value={filters}
        onChange={(f) => {
          setFilters(f);
          setPage(1);
        }}
      />
      {list.isLoading ? (
        <TableSkeleton />
      ) : list.isError ? (
        <ErrorState error={list.error} onRetry={() => void list.refetch()} />
      ) : !list.data?.items.length ? (
        <EmptyState title="No features match" description="Adjust filters or pick another image." />
      ) : (
        <>
          <p className="text-xs text-muted-foreground">
            Showing {(page - 1) * PAGE_SIZE + 1}–
            {Math.min(page * PAGE_SIZE, total)} of {total.toLocaleString()} mapped samples
          </p>
          <FeatureTable
            features={list.data.items}
            onSelect={(f) =>
              void navigate({
                to: "/features/$featureId",
                params: { featureId: f.feature_id },
                search: { imageId: f.image_id },
              })
            }
          />
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <span className="text-xs text-muted-foreground">
              {page} / {pages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= pages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
