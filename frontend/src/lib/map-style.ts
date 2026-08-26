import { FEATURE_COLORS } from "@/lib/constants";
import type { ConfidenceLevel, FeatureType } from "@/lib/types";

export interface MapFeatureProps {
  feature_id?: string;
  feature_type?: FeatureType;
  confidence?: number;
  confidence_level?: ConfidenceLevel;
  status?: string;
}

export interface PathStyle {
  color: string;
  fillColor: string;
  weight: number;
  opacity: number;
  fillOpacity: number;
  dashArray?: string;
  lineJoin: "round";
  lineCap: "round";
}

export function featurePathStyle(
  props: MapFeatureProps,
  selectedId?: string | null,
): PathStyle {
  const type = props.feature_type ?? "BUILDING";
  const color = FEATURE_COLORS[type];
  const isLow = props.confidence_level === "LOW";
  const selected = selectedId != null && props.feature_id === selectedId;
  const isLine = type === "ROAD";

  return {
    color: selected ? "#071A33" : color,
    fillColor: color,
    weight: selected ? 3 : isLine ? 3.5 : isLow ? 1.5 : 1.25,
    opacity: selected ? 1 : isLow ? 0.85 : 0.95,
    fillOpacity: selected ? 0.55 : isLine ? 0.15 : isLow ? 0.22 : 0.42,
    dashArray: isLow ? "6 4" : undefined,
    lineJoin: "round",
    lineCap: "round",
  };
}

export function leafletStyleFromGeoJSON(
  feature: GeoJSON.Feature | undefined,
  selectedId?: string | null,
): PathStyle {
  const props = (feature?.properties ?? {}) as MapFeatureProps;
  return featurePathStyle(props, selectedId);
}
