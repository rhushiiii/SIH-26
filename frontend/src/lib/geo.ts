import type { BBox, Feature, GeoPosition } from "@/lib/types";

export function centroidOf(geometry: GeoJSON.Geometry): GeoPosition {
  const pts = flattenCoords(geometry);
  if (pts.length === 0) return { lat: 0, lng: 0 };
  const sum = pts.reduce(
    (acc, [lng, lat]) => ({ lat: acc.lat + lat, lng: acc.lng + lng }),
    { lat: 0, lng: 0 },
  );
  return { lat: sum.lat / pts.length, lng: sum.lng / pts.length };
}

export function boundsOf(geometry: GeoJSON.Geometry): BBox {
  const pts = flattenCoords(geometry);
  const lngs = pts.map((p) => p[0]);
  const lats = pts.map((p) => p[1]);
  return {
    west: Math.min(...lngs),
    south: Math.min(...lats),
    east: Math.max(...lngs),
    north: Math.max(...lats),
  };
}

export function flattenCoords(geometry: GeoJSON.Geometry): [number, number][] {
  switch (geometry.type) {
    case "Point":
      return [geometry.coordinates as [number, number]];
    case "MultiPoint":
    case "LineString":
      return geometry.coordinates as [number, number][];
    case "MultiLineString":
    case "Polygon":
      return (geometry.coordinates as [number, number][][]).flat();
    case "MultiPolygon":
      return (geometry.coordinates as [number, number][][][]).flat(2);
    case "GeometryCollection":
      return geometry.geometries.flatMap(flattenCoords);
    default:
      return [];
  }
}

export function toFeatureCollection(features: Feature[]): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: features.map((f) => ({
      type: "Feature",
      id: f.feature_id,
      geometry: f.geometry,
      properties: {
        ...f.properties,
        feature_id: f.feature_id,
        image_id: f.image_id,
        feature_type: f.feature_type,
      },
    })),
  };
}

export function metersToLngLat(
  east: number,
  north: number,
  originLng: number,
  originLat: number,
): [number, number] {
  const dLat = north / 111_320;
  const dLng = east / (111_320 * Math.cos((originLat * Math.PI) / 180));
  return [originLng + dLng, originLat + dLat];
}
