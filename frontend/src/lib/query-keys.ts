import type { FeatureListParams } from "@/lib/types";

export const queryKeys = {
  images: {
    all: ["images"] as const,
    detail: (id: string) => ["images", id] as const,
  },
  jobs: {
    all: ["jobs"] as const,
    detail: (id: string) => ["jobs", id] as const,
  },
  features: {
    all: ["features"] as const,
    list: (params: FeatureListParams) => ["features", "list", params] as const,
    map: (imageId?: string) => ["features", "map", imageId ?? "all"] as const,
    detail: (imageId: string, featureId: string) =>
      ["features", imageId, featureId] as const,
    queue: (imageId?: string) => ["features", "queue", imageId ?? "all"] as const,
  },
  analytics: {
    detail: (imageId: string) => ["analytics", imageId] as const,
    dashboard: ["analytics", "dashboard"] as const,
  },
  exports: {
    all: ["exports"] as const,
    detail: (id: string) => ["exports", id] as const,
  },
};
