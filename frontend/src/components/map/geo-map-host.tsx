import { SlidersHorizontal } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { FeatureDetailsPanel } from "@/components/features/feature-details-panel";
import { FilterPanel, type FeatureFilters } from "@/components/map/filter-panel";
import { MapLayerControl, type LayerVisibility } from "@/components/map/map-layer-control";
import { MapToolbar, type BasemapId } from "@/components/map/map-toolbar";
import { LoadingState } from "@/components/shared/loading-state";
import { Button } from "@/components/ui/button";
import { AOI_BOUNDS } from "@/lib/constants";
import { formatCoord } from "@/lib/format";
import type { Feature } from "@/lib/types";
import { cn } from "@/lib/utils";

interface MapHandle {
  zoomIn: () => void;
  zoomOut: () => void;
  fitBounds: (
    bounds: [[number, number], [number, number]],
    options?: { padding?: [number, number] },
  ) => void;
}

interface GeoMapModule {
  GeoMap: typeof import("@/components/map/geo-map").GeoMap;
}

export function GeoMapHost({
  features,
  selectedId,
  onSelect,
  onReview,
  onEdit,
  initialFilters,
  className,
  chrome = "full",
}: {
  features: Feature[];
  selectedId: string | null;
  onSelect: (feature: Feature | null) => void;
  onReview?: (feature: Feature) => void;
  onEdit?: (feature: Feature) => void;
  initialFilters?: Partial<FeatureFilters>;
  className?: string;
  chrome?: "full" | "minimal";
}) {
  const [mod, setMod] = useState<GeoMapModule | null>(null);
  const mapRef = useRef<MapHandle | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [layers, setLayers] = useState<LayerVisibility>({
    orthophoto: true,
    buildings: true,
    roads: true,
    waterbodies: true,
    lowConfidence: true,
  });
  const [filters, setFilters] = useState<FeatureFilters>({
    type: initialFilters?.type ?? "ALL",
    confidence: initialFilters?.confidence ?? "ALL",
    status: initialFilters?.status ?? "ALL",
  });
  const [basemap, setBasemap] = useState<BasemapId>("ortho");
  const [cursor, setCursor] = useState<{ lat: number; lng: number } | null>(null);
  const [zoom, setZoom] = useState(16);
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    let live = true;
    void import("@/components/map/geo-map").then((m) => {
      if (live) setMod(m);
    });
    return () => {
      live = false;
    };
  }, []);

  const selected = features.find((f) => f.feature_id === selectedId) ?? null;
  const full = chrome === "full";

  const fitAoi = useCallback(() => {
    mapRef.current?.fitBounds(AOI_BOUNDS, { padding: [24, 24] });
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn("relative min-h-[420px] overflow-hidden bg-[#d7e0ea]", className)}
    >
      {mod ? (
        <mod.GeoMap
          features={features}
          layers={layers}
          filters={filters}
          selectedId={selectedId}
          onSelect={onSelect}
          basemap={basemap}
          apiRef={mapRef}
          onCursor={setCursor}
          onZoom={setZoom}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-navy/80">
          <LoadingState label="Loading map" />
        </div>
      )}

      <div className="pointer-events-none absolute inset-0 z-[400]">
        {full ? (
          <div className="absolute top-3 left-3 max-w-[min(100%-4.5rem,22rem)]">
            <div className="pointer-events-auto">
              <Button
                variant="outline"
                size="sm"
                className="mb-2 bg-card shadow-sm lg:hidden"
                onClick={() => setFiltersOpen((v) => !v)}
                aria-expanded={filtersOpen}
              >
                <SlidersHorizontal className="size-3.5" />
                Filters
              </Button>
              <div
                className={cn(
                  "rounded-lg bg-card/95 p-3 shadow-[var(--shadow-border)] backdrop-blur-sm",
                  !filtersOpen && "hidden lg:block",
                )}
              >
                <FilterPanel value={filters} onChange={setFilters} compact />
              </div>
            </div>
          </div>
        ) : null}

        <div className="absolute top-3 right-3 flex flex-col items-end gap-2">
          <MapToolbar
            onZoomIn={() => mapRef.current?.zoomIn()}
            onZoomOut={() => mapRef.current?.zoomOut()}
            onLocate={fitAoi}
            onFitAoi={fitAoi}
            onFullscreen={() => {
              const el = containerRef.current;
              if (!el) return;
              if (document.fullscreenElement) void document.exitFullscreen();
              else void el.requestFullscreen();
            }}
            basemap={basemap}
            onBasemap={setBasemap}
          />
          {full ? <MapLayerControl value={layers} onChange={setLayers} /> : null}
        </div>

        {full && selected ? (
          <div className="pointer-events-auto absolute top-36 bottom-12 left-3 hidden w-80 overflow-hidden rounded-xl shadow-[var(--shadow-border)] xl:block">
            <FeatureDetailsPanel
              feature={selected}
              onClose={() => onSelect(null)}
              onReview={() => onReview?.(selected)}
              onEdit={() => onEdit?.(selected)}
            />
          </div>
        ) : null}

        {full && selected ? (
          <div className="pointer-events-auto absolute inset-x-0 bottom-9 max-h-[42%] overflow-auto rounded-t-xl shadow-md xl:hidden">
            <FeatureDetailsPanel
              feature={selected}
              onClose={() => onSelect(null)}
              onReview={() => onReview?.(selected)}
              onEdit={() => onEdit?.(selected)}
            />
          </div>
        ) : null}

        <div className="absolute bottom-2 left-1/2 flex max-w-[calc(100%-2rem)] -translate-x-1/2 items-center gap-2 overflow-hidden rounded-md bg-navy/90 px-3 py-1 font-mono text-[11px] text-white">
          <span className="hidden sm:inline">CRS EPSG:3857 / 4326</span>
          <span className="hidden text-white/40 sm:inline">|</span>
          <span>z {zoom.toFixed(0)}</span>
          <span className="text-white/40">|</span>
          <span>
            {cursor
              ? `${formatCoord(cursor.lat, 5)}, ${formatCoord(cursor.lng, 5)}`
              : "—"}
          </span>
        </div>
      </div>
    </div>
  );
}
