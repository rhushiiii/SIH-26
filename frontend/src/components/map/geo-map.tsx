import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useMemo } from "react";
import {
  GeoJSON,
  MapContainer,
  ScaleControl,
  TileLayer,
  useMap,
} from "react-leaflet";
import type { BasemapId } from "@/components/map/map-toolbar";
import type { LayerVisibility } from "@/components/map/map-layer-control";
import type { FeatureFilters } from "@/components/map/filter-panel";
import { AOI_BOUNDS, AOI_CENTER } from "@/lib/constants";
import { toFeatureCollection } from "@/lib/geo";
import { leafletStyleFromGeoJSON } from "@/lib/map-style";
import { featureMatches } from "@/mock/features";
import type { Feature, FeatureType } from "@/lib/types";

const ESRI =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
const OSM = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const POSITRON =
  "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";

function FixDefaultIcons() {
  useEffect(() => {
    delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: string })._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    });
  }, []);
  return null;
}

function MapApi({
  apiRef,
}: {
  apiRef: React.MutableRefObject<{
    zoomIn: () => void;
    zoomOut: () => void;
    fitBounds: (
      bounds: [[number, number], [number, number]],
      options?: { padding?: [number, number] },
    ) => void;
  } | null>;
}) {
  const map = useMap();
  useEffect(() => {
    apiRef.current = {
      zoomIn: () => map.zoomIn(),
      zoomOut: () => map.zoomOut(),
      fitBounds: (bounds, options) => map.fitBounds(bounds, options),
    };
    return () => {
      apiRef.current = null;
    };
  }, [map, apiRef]);
  return null;
}

function CursorReadout({
  onCursor,
}: {
  onCursor: (pos: { lat: number; lng: number } | null) => void;
}) {
  const map = useMap();
  useEffect(() => {
    const move = (e: L.LeafletMouseEvent) =>
      onCursor({ lat: e.latlng.lat, lng: e.latlng.lng });
    const out = () => onCursor(null);
    map.on("mousemove", move);
    map.on("mouseout", out);
    return () => {
      map.off("mousemove", move);
      map.off("mouseout", out);
    };
  }, [map, onCursor]);
  return null;
}

function FitSelected({ feature }: { feature?: Feature | null }) {
  const map = useMap();
  useEffect(() => {
    if (!feature) return;
    const layer = L.geoJSON(feature.geometry);
    const b = layer.getBounds();
    if (b.isValid()) map.fitBounds(b.pad(0.65), { animate: true, maxZoom: 18 });
  }, [feature, map]);
  return null;
}

function ZoomWatcher({ onZoom }: { onZoom: (z: number) => void }) {
  const map = useMap();
  useEffect(() => {
    const fire = () => onZoom(map.getZoom());
    fire();
    map.on("zoomend", fire);
    return () => {
      map.off("zoomend", fire);
    };
  }, [map, onZoom]);
  return null;
}

export interface GeoMapProps {
  features: Feature[];
  layers: LayerVisibility;
  filters: FeatureFilters;
  selectedId: string | null;
  onSelect: (feature: Feature) => void;
  basemap: BasemapId;
  apiRef: React.MutableRefObject<{
    zoomIn: () => void;
    zoomOut: () => void;
    fitBounds: (
      bounds: [[number, number], [number, number]],
      options?: { padding?: [number, number] },
    ) => void;
  } | null>;
  onCursor: (pos: { lat: number; lng: number } | null) => void;
  onZoom: (z: number) => void;
}

function LayerBlock({
  type,
  features,
  selectedId,
  onSelect,
}: {
  type: FeatureType;
  features: Feature[];
  selectedId: string | null;
  onSelect: (feature: Feature) => void;
}) {
  const subset = features.filter((f) => f.feature_type === type);
  const data = useMemo(
    () => toFeatureCollection(subset),
    // keyed by ids so we don't rebuild on parent re-renders with same data
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [subset.map((f) => f.feature_id).join("|")],
  );
  const key = `${type}-${subset.length}-${selectedId ?? ""}`;

  if (subset.length === 0) return null;

  return (
    <GeoJSON
      key={key}
      data={data}
      style={(feat) => leafletStyleFromGeoJSON(feat, selectedId)}
      onEachFeature={(feat, layer) => {
        const id = String(
          (feat.properties as { feature_id?: string } | null)?.feature_id ?? "",
        );
        layer.on("click", (e) => {
          L.DomEvent.stopPropagation(e);
          const match = subset.find((f) => f.feature_id === id);
          if (match) onSelect(match);
        });
        layer.on("mouseover", () => {
          (layer as L.Path).setStyle({ weight: 3, fillOpacity: 0.6 });
        });
        layer.on("mouseout", () => {
          (layer as L.Path).setStyle(leafletStyleFromGeoJSON(feat, selectedId));
        });
      }}
    />
  );
}

export function GeoMap({
  features,
  layers,
  filters,
  selectedId,
  onSelect,
  basemap,
  apiRef,
  onCursor,
  onZoom,
}: GeoMapProps) {
  const filtered = features.filter((f) => {
    if (!featureMatches(f, filters)) return false;
    if (!layers.lowConfidence && f.properties.confidence_level === "LOW")
      return false;
    if (f.feature_type === "BUILDING" && !layers.buildings) return false;
    if (f.feature_type === "ROAD" && !layers.roads) return false;
    if (f.feature_type === "WATERBODY" && !layers.waterbodies) return false;
    return true;
  });

  const selected = features.find((f) => f.feature_id === selectedId) ?? null;
  const tileUrl =
    basemap === "streets" ? OSM : basemap === "light" ? POSITRON : ESRI;
  const attrib =
    basemap === "ortho"
      ? "Imagery © Esri"
      : basemap === "light"
        ? "© CARTO © OpenStreetMap"
        : "© OpenStreetMap";

  return (
    <div className="absolute inset-0">
      <MapContainer
        center={AOI_CENTER}
        zoom={16}
        minZoom={13}
        maxZoom={20}
        zoomControl={false}
        attributionControl
        className="h-full w-full"
        maxBounds={AOI_BOUNDS}
        maxBoundsViscosity={0.6}
      >
        <FixDefaultIcons />
        <MapApi apiRef={apiRef} />
        <CursorReadout onCursor={onCursor} />
        <FitSelected feature={selected} />
        <ScaleControl position="bottomleft" metric imperial={false} />
        <ZoomWatcher onZoom={onZoom} />
        <TileLayer
          url={layers.orthophoto || basemap !== "ortho" ? tileUrl : POSITRON}
          attribution={attrib}
          maxZoom={20}
        />
        {layers.waterbodies ? (
          <LayerBlock
            type="WATERBODY"
            features={filtered}
            selectedId={selectedId}
            onSelect={onSelect}
          />
        ) : null}
        {layers.roads ? (
          <LayerBlock
            type="ROAD"
            features={filtered}
            selectedId={selectedId}
            onSelect={onSelect}
          />
        ) : null}
        {layers.buildings ? (
          <LayerBlock
            type="BUILDING"
            features={filtered}
            selectedId={selectedId}
            onSelect={onSelect}
          />
        ) : null}
      </MapContainer>
    </div>
  );
}
