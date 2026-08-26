import { endpoints } from "@/lib/constants/endpoints";
import { PRIMARY_IMAGE_ID } from "@/lib/constants";
import { apiRequest, isMockEnabled, mockDelay } from "@/lib/api/client";
import { emptyAnalytics } from "@/mock/analytics";
import { getMockState } from "@/mock/store";
import type { Analytics, DashboardSummary } from "@/lib/types";

export const analyticsApi = {
  async get(imageId: string): Promise<Analytics> {
    if (isMockEnabled()) {
      await mockDelay(220);
      return (
        getMockState().analytics.find((a) => a.image_id === imageId) ??
        emptyAnalytics(imageId)
      );
    }
    return apiRequest(endpoints.images.analytics(imageId));
  },

  async dashboard(): Promise<DashboardSummary> {
    if (isMockEnabled()) {
      await mockDelay(200);
      const state = getMockState();
      const primary =
        state.analytics.find((a) => a.image_id === PRIMARY_IMAGE_ID) ??
        state.analytics[0];
      return {
        total_images: state.images.length,
        total_jobs: state.jobs.length,
        total_features: primary?.total_features ?? 0,
        high_confidence_pct: primary?.high_confidence_pct ?? 0,
        building_count: primary?.building_count ?? 0,
        road_length_km: (primary?.road_length_m ?? 0) / 1000,
        waterbody_count: primary?.waterbody_count ?? 0,
      };
    }
    return apiRequest("/dashboard");
  },
};
