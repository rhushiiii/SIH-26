import type {
  Analytics,
  ExportRecord,
  Feature,
  ImageRecord,
  Job,
  Review,
} from "@/lib/types";
import { seedAnalytics } from "@/mock/analytics";
import { seedFeatures } from "@/mock/features";
import { seedImages } from "@/mock/images";
import { seedJobs, withLiveProgress } from "@/mock/jobs";

const STORAGE_KEY = "drishti.mock-store.v1";

interface MockState {
  images: ImageRecord[];
  jobs: Job[];
  features: Feature[];
  analytics: Analytics[];
  reviews: Review[];
  exports: ExportRecord[];
}

function cloneState(): MockState {
  return {
    images: structuredClone(seedImages),
    jobs: structuredClone(seedJobs),
    features: structuredClone(seedFeatures),
    analytics: structuredClone(seedAnalytics),
    reviews: [],
    exports: structuredClone(seedExportHistory()),
  };
}

function seedExportHistory(): ExportRecord[] {
  return [
    {
      export_id: "exp_001",
      image_id: "img_ortho_2024_05",
      filename: "Orthophoto_2024_05_features.geojson",
      format: "GeoJSON",
      layers: ["BUILDING", "ROAD", "WATERBODY"],
      status: "COMPLETED",
      created_at: "2026-05-18T11:40:00.000Z",
      completed_at: "2026-05-18T11:40:08.000Z",
      download_url: "#",
      feature_count: 24531,
    },
    {
      export_id: "exp_002",
      image_id: "img_ortho_2024_05",
      filename: "Orthophoto_2024_05_buildings.csv",
      format: "CSV",
      layers: ["BUILDING"],
      status: "COMPLETED",
      created_at: "2026-05-19T08:12:00.000Z",
      completed_at: "2026-05-19T08:12:04.000Z",
      download_url: "#",
      feature_count: 12452,
    },
    {
      export_id: "exp_003",
      image_id: "img_ward_12",
      filename: "Ward_12_Survey_roads.geojson",
      format: "GeoJSON",
      layers: ["ROAD"],
      status: "COMPLETED",
      created_at: "2026-06-02T16:04:00.000Z",
      completed_at: "2026-06-02T16:04:03.000Z",
      download_url: "#",
      feature_count: 186,
    },
  ];
}

let memory: MockState | null = null;

function persist(state: MockState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* quota */
  }
}

export function getMockState(): MockState {
  if (memory) {
    memory.jobs = memory.jobs.map(withLiveProgress);
    return memory;
  }
  if (typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        memory = JSON.parse(raw) as MockState;
        memory.jobs = memory.jobs.map(withLiveProgress);
        return memory;
      }
    } catch {
      /* ignore */
    }
  }
  memory = cloneState();
  return memory;
}

export function mutateMock(mutator: (state: MockState) => void): MockState {
  const state = getMockState();
  mutator(state);
  persist(state);
  return state;
}

export function resetMockState(): MockState {
  memory = cloneState();
  persist(memory);
  return memory;
}
