import type { ConfidenceLevel, FeatureType } from "@/lib/types";
import { FEATURE_LABELS } from "@/lib/constants";

export function formatPercent(value: number, digits = 1): string {
  const pct = value <= 1 ? value * 100 : value;
  return `${pct.toFixed(digits)}%`;
}

export function formatConfidence(value: number): string {
  return formatPercent(value, 1);
}

export function confidenceLevelFromScore(score: number): ConfidenceLevel {
  if (score >= 0.85) return "HIGH";
  if (score >= 0.6) return "MEDIUM";
  return "LOW";
}

export function formatArea(m2?: number): string {
  if (m2 == null) return "—";
  if (m2 >= 1_000_000) return `${(m2 / 1_000_000).toFixed(2)} km²`;
  if (m2 >= 10_000) return `${(m2 / 10_000).toFixed(2)} ha`;
  return `${m2.toLocaleString(undefined, { maximumFractionDigits: 1 })} m²`;
}

export function formatLength(m?: number): string {
  if (m == null) return "—";
  if (m >= 1000) return `${(m / 1000).toFixed(2)} km`;
  return `${m.toFixed(1)} m`;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(1)} MB`;
  return `${(mb / 1024).toFixed(2)} GB`;
}

export function formatNumber(n: number, digits = 0): string {
  return n.toLocaleString(undefined, {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  });
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function featureTypeLabel(type: FeatureType): string {
  return FEATURE_LABELS[type];
}

export function formatCoord(n: number, digits = 6): string {
  return n.toFixed(digits);
}

export function formatCrs(crs: string): string {
  return crs.replace("EPSG:", "EPSG ");
}
