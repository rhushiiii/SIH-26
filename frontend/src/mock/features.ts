import { metersToLngLat } from "@/lib/geo";
import type {
  ConfidenceLevel,
  Feature,
  FeatureStatus,
  FeatureType,
  RoofType,
} from "@/lib/types";

const ORIGIN_LNG = 77.5048;
const ORIGIN_LAT = 13.0382;

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(202405);

function pick<T>(items: T[]): T {
  return items[Math.floor(rand() * items.length)]!;
}

function range(n: number, min: number, max: number) {
  return min + rand() * (max - min);
}

function rectPolygon(
  east: number,
  north: number,
  w: number,
  h: number,
  rotDeg: number,
): GeoJSON.Polygon {
  const cx = east + w / 2;
  const cy = north + h / 2;
  const rad = (rotDeg * Math.PI) / 180;
  const corners: [number, number][] = [
    [-w / 2, -h / 2],
    [w / 2, -h / 2],
    [w / 2, h / 2],
    [-w / 2, h / 2],
  ].map(([x, y]) => {
    const xr = x * Math.cos(rad) - y * Math.sin(rad);
    const yr = x * Math.sin(rad) + y * Math.cos(rad);
    return metersToLngLat(cx + xr, cy + yr, ORIGIN_LNG, ORIGIN_LAT);
  });
  return { type: "Polygon", coordinates: [[...corners, corners[0]!]] };
}

function irregularPolygon(
  east: number,
  north: number,
  radius: number,
  verts = 8,
): GeoJSON.Polygon {
  const coords: [number, number][] = [];
  for (let i = 0; i < verts; i++) {
    const a = (i / verts) * Math.PI * 2;
    const r = radius * (0.65 + rand() * 0.55);
    coords.push(
      metersToLngLat(
        east + Math.cos(a) * r,
        north + Math.sin(a) * r,
        ORIGIN_LNG,
        ORIGIN_LAT,
      ),
    );
  }
  coords.push(coords[0]!);
  return { type: "Polygon", coordinates: [coords] };
}

function lineString(points: [number, number][]): GeoJSON.LineString {
  return {
    type: "LineString",
    coordinates: points.map(([e, n]) =>
      metersToLngLat(e, n, ORIGIN_LNG, ORIGIN_LAT),
    ),
  };
}

function confidenceBundle(bias: "high" | "mixed" = "high"): {
  confidence: number;
  confidence_level: ConfidenceLevel;
  status: FeatureStatus;
} {
  const roll = rand();
  let confidence: number;
  if (bias === "high") {
    if (roll < 0.78) confidence = range(1, 0.88, 0.99);
    else if (roll < 0.93) confidence = range(1, 0.62, 0.84);
    else confidence = range(1, 0.38, 0.58);
  } else {
    if (roll < 0.45) confidence = range(1, 0.88, 0.98);
    else if (roll < 0.75) confidence = range(1, 0.6, 0.84);
    else confidence = range(1, 0.32, 0.58);
  }
  const confidence_level: ConfidenceLevel =
    confidence >= 0.85 ? "HIGH" : confidence >= 0.6 ? "MEDIUM" : "LOW";
  let status: FeatureStatus;
  if (confidence_level === "HIGH") status = rand() < 0.82 ? "AUTO_ACCEPTED" : "ACCEPTED";
  else if (confidence_level === "MEDIUM")
    status = rand() < 0.7 ? "REVIEW_RECOMMENDED" : "EDITED";
  else status = rand() < 0.75 ? "HUMAN_REVIEW_REQUIRED" : "REJECTED";
  return { confidence: Number(confidence.toFixed(3)), confidence_level, status };
}

function building(
  id: number,
  imageId: string,
  east: number,
  north: number,
  w: number,
  h: number,
  rot: number,
): Feature {
  const area = w * h;
  const peri = 2 * (w + h);
  const conf = confidenceBundle(id % 11 === 0 ? "mixed" : "high");
  const roofs: Array<RoofType | null> = ["RCC", "RCC", "TILED", "TIN", "RCC", "OTHER", null];
  const roof = pick(roofs);
  return {
    feature_id: `building_${String(id).padStart(6, "0")}`,
    image_id: imageId,
    feature_type: "BUILDING",
    geometry: rectPolygon(east, north, w, h, rot),
    properties: {
      area_m2: Number(area.toFixed(1)),
      perimeter_m: Number(peri.toFixed(1)),
      ...conf,
      roof_type: roof,
      roof_confidence: roof ? Number(range(1, 0.55, 0.97).toFixed(3)) : null,
    },
  };
}

function road(
  id: number,
  imageId: string,
  points: [number, number][],
  widthM: number,
): Feature {
  let length = 0;
  for (let i = 1; i < points.length; i++) {
    const dx = points[i]![0] - points[i - 1]![0];
    const dy = points[i]![1] - points[i - 1]![1];
    length += Math.hypot(dx, dy);
  }
  const conf = confidenceBundle();
  return {
    feature_id: `road_${String(id).padStart(6, "0")}`,
    image_id: imageId,
    feature_type: "ROAD",
    geometry: lineString(points),
    properties: {
      length_m: Number(length.toFixed(1)),
      area_m2: Number((length * widthM).toFixed(1)),
      ...conf,
    },
  };
}

function water(
  id: number,
  imageId: string,
  east: number,
  north: number,
  radius: number,
  verts: number,
): Feature {
  const area = Math.PI * radius * radius * 0.78;
  const peri = 2 * Math.PI * radius * 1.12;
  const conf = confidenceBundle("mixed");
  return {
    feature_id: `waterbody_${String(id).padStart(6, "0")}`,
    image_id: imageId,
    feature_type: "WATERBODY",
    geometry: irregularPolygon(east, north, radius, verts),
    properties: {
      area_m2: Number(area.toFixed(1)),
      perimeter_m: Number(peri.toFixed(1)),
      ...conf,
    },
  };
}

function generatePrimary(): Feature[] {
  const imageId = "img_ortho_2024_05";
  const features: Feature[] = [];

  const namedBuildings: Array<[number, number, number, number, number, number]> = [
    [123, 620, 720, 18, 14, 8],
    [124, 648, 726, 22, 16, 6],
    [125, 680, 710, 14, 12, 12],
    [126, 704, 738, 28, 18, 4],
    [127, 742, 718, 16, 11, -6],
    [128, 610, 760, 20, 15, 10],
    [129, 638, 768, 12, 10, 2],
    [130, 666, 755, 24, 16, -8],
    [131, 698, 778, 18, 14, 14],
    [132, 730, 762, 15, 12, 0],
  ];
  for (const row of namedBuildings) {
    features.push(building(row[0], imageId, row[1], row[2], row[3], row[4], row[5]));
  }

  let bid = 133;
  const clusters: Array<[number, number, number, number]> = [
    [580, 680, 9, 7],
    [780, 700, 8, 6],
    [640, 880, 10, 8],
    [900, 820, 7, 6],
    [480, 900, 6, 5],
    [1000, 640, 8, 5],
    [860, 980, 9, 6],
    [520, 1040, 7, 5],
    [1100, 900, 6, 5],
    [720, 1100, 8, 6],
    [400, 720, 5, 4],
    [980, 1100, 6, 5],
  ];
  for (const [cx, cy, cols, rows] of clusters) {
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const w = range(1, 8, 26);
        const h = range(1, 7, 18);
        const east = cx + c * 28 + range(1, -4, 6);
        const north = cy + r * 26 + range(1, -4, 5);
        const rot = range(1, -18, 18);
        features.push(building(bid++, imageId, east, north, w, h, rot));
      }
    }
  }

  features.push(
    road(56, imageId, [
      [80, 620],
      [260, 640],
      [480, 700],
      [720, 740],
      [980, 780],
      [1220, 810],
      [1480, 840],
    ], 7),
  );
  features.push(
    road(57, imageId, [
      [720, 80],
      [740, 320],
      [750, 560],
      [760, 820],
      [770, 1080],
      [790, 1380],
    ], 6.5),
  );
  features.push(
    road(58, imageId, [
      [140, 1080],
      [360, 1060],
      [620, 1040],
      [880, 1030],
      [1180, 1010],
    ], 5),
  );
  features.push(
    road(59, imageId, [
      [1280, 180],
      [1300, 420],
      [1320, 700],
      [1340, 980],
      [1360, 1280],
    ], 8),
  );
  features.push(
    road(60, imageId, [
      [420, 480],
      [560, 560],
      [640, 680],
      [700, 820],
    ], 4),
  );
  features.push(
    road(61, imageId, [
      [820, 860],
      [940, 900],
      [1080, 980],
      [1180, 1120],
    ], 4.5),
  );
  features.push(
    road(62, imageId, [
      [200, 820],
      [320, 860],
      [440, 900],
      [540, 980],
    ], 3.5),
  );
  features.push(
    road(63, imageId, [
      [880, 420],
      [960, 520],
      [1020, 640],
      [1080, 760],
    ], 4),
  );
  features.push(
    road(64, imageId, [
      [160, 1280],
      [400, 1260],
      [680, 1240],
      [940, 1220],
    ], 5.5),
  );
  features.push(
    road(65, imageId, [
      [1080, 200],
      [1120, 360],
      [1180, 520],
      [1240, 680],
    ], 3.8),
  );
  features.push(
    road(66, imageId, [
      [480, 1180],
      [560, 1120],
      [640, 1040],
    ], 3.2),
  );
  features.push(
    road(67, imageId, [
      [900, 1180],
      [980, 1140],
      [1080, 1080],
      [1180, 1040],
    ], 3.6),
  );
  features.push(
    road(68, imageId, [
      [240, 500],
      [360, 540],
      [500, 620],
    ], 3),
  );
  features.push(
    road(69, imageId, [
      [1400, 900],
      [1460, 1040],
      [1500, 1180],
    ], 4.2),
  );

  features.push(water(89, imageId, 280, 240, 95, 10));
  features.push(water(90, imageId, 360, 300, 48, 8));
  features.push(water(91, imageId, 1180, 240, 70, 9));
  features.push(water(92, imageId, 1420, 1280, 80, 11));
  features.push(water(93, imageId, 180, 1180, 42, 7));
  features.push(water(94, imageId, 1040, 1320, 55, 8));
  features.push(water(95, imageId, 460, 1320, 36, 7));
  features.push(water(96, imageId, 1500, 420, 50, 8));

  const canalPts: [number, number][] = [];
  for (let i = 0; i <= 8; i++) {
    canalPts.push([80 + i * 170, 360 + Math.sin(i * 0.7) * 40]);
  }
  const canal: Feature = {
    feature_id: "waterbody_000097",
    image_id: imageId,
    feature_type: "WATERBODY",
    geometry: {
      type: "Polygon",
      coordinates: [
        [
          ...canalPts.map(([e, n]) =>
            metersToLngLat(e, n + 14, ORIGIN_LNG, ORIGIN_LAT),
          ),
          ...[...canalPts]
            .reverse()
            .map(([e, n]) => metersToLngLat(e, n - 14, ORIGIN_LNG, ORIGIN_LAT)),
          metersToLngLat(canalPts[0]![0], canalPts[0]![1] + 14, ORIGIN_LNG, ORIGIN_LAT),
        ],
      ],
    },
    properties: {
      area_m2: 18420,
      perimeter_m: 2860,
      ...confidenceBundle("high"),
    },
  };
  features.push(canal);

  return features;
}

function generateWard(): Feature[] {
  const imageId = "img_ward_12";
  const features: Feature[] = [];
  let bid = 401;
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 5; c++) {
      features.push(
        building(
          bid++,
          imageId,
          700 + c * 30,
          900 + r * 28,
          range(1, 10, 20),
          range(1, 8, 16),
          range(1, -10, 10),
        ),
      );
    }
  }
  features.push(
    road(201, imageId, [
      [680, 880],
      [820, 920],
      [980, 940],
    ], 5),
  );
  features.push(water(201, imageId, 820, 1080, 40, 8));
  return features;
}

function forceNamedStatuses(features: Feature[]) {
  const byId = new Map(features.map((f) => [f.feature_id, f]));
  const force = (
    id: string,
    status: FeatureStatus,
    level: ConfidenceLevel,
    confidence: number,
  ) => {
    const f = byId.get(id);
    if (!f) return;
    f.properties.status = status;
    f.properties.confidence_level = level;
    f.properties.confidence = confidence;
  };
  force("building_000123", "HUMAN_REVIEW_REQUIRED", "LOW", 0.47);
  force("building_000124", "REVIEW_RECOMMENDED", "MEDIUM", 0.71);
  force("building_000126", "AUTO_ACCEPTED", "HIGH", 0.94);
  force("building_000128", "EDITED", "MEDIUM", 0.68);
  force("road_000056", "AUTO_ACCEPTED", "HIGH", 0.91);
  force("road_000060", "HUMAN_REVIEW_REQUIRED", "LOW", 0.41);
  force("waterbody_000089", "REVIEW_RECOMMENDED", "MEDIUM", 0.66);
  force("waterbody_000093", "HUMAN_REVIEW_REQUIRED", "LOW", 0.39);
}

export const seedFeatures: Feature[] = (() => {
  const all = [...generatePrimary(), ...generateWard()];
  forceNamedStatuses(all);
  return all;
})();

export function featureMatches(
  feature: Feature,
  params: {
    type?: FeatureType | "ALL";
    status?: FeatureStatus | "ALL";
    confidence?: ConfidenceLevel | "ALL";
    q?: string;
  },
): boolean {
  if (params.type && params.type !== "ALL" && feature.feature_type !== params.type)
    return false;
  if (
    params.status &&
    params.status !== "ALL" &&
    feature.properties.status !== params.status
  )
    return false;
  if (
    params.confidence &&
    params.confidence !== "ALL" &&
    feature.properties.confidence_level !== params.confidence
  )
    return false;
  if (params.q) {
    const q = params.q.toLowerCase();
    const blob = `${feature.feature_id} ${feature.feature_type} ${feature.properties.status}`.toLowerCase();
    if (!blob.includes(q)) return false;
  }
  return true;
}
