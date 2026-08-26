import { endpoints } from "@/lib/constants/endpoints";
import { PAGE_SIZE } from "@/lib/constants";
import { apiRequest, isMockEnabled, mockDelay } from "@/lib/api/client";
import { featureMatches } from "@/mock/features";
import { getMockState } from "@/mock/store";
import type { Feature, FeatureListParams, Paginated } from "@/lib/types";

function paginate(items: Feature[], page = 1, pageSize = PAGE_SIZE): Paginated<Feature> {
  const start = (page - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    total: items.length,
    page,
    page_size: pageSize,
  };
}

export const featuresApi = {
  async list(params: FeatureListParams = {}): Promise<Paginated<Feature>> {
    if (isMockEnabled()) {
      await mockDelay(200);
      const state = getMockState();
      let items = state.features;
      if (params.image_id) {
        items = items.filter((f) => f.image_id === params.image_id);
      }
      items = items.filter((f) => featureMatches(f, params));
      return paginate(items, params.page ?? 1, params.page_size ?? PAGE_SIZE);
    }
    const imageId = params.image_id;
    if (!imageId) {
      const { ApiRequestError } = await import("@/lib/api/client");
      throw new ApiRequestError({
        code: "INVALID_REQUEST",
        message: "image_id is required.",
      });
    }
    const search = new URLSearchParams();
    if (params.type && params.type !== "ALL") search.set("type", params.type);
    if (params.status && params.status !== "ALL") search.set("status", params.status);
    if (params.confidence && params.confidence !== "ALL")
      search.set("confidence", params.confidence);
    if (params.q) search.set("q", params.q);
    if (params.page) search.set("page", String(params.page));
    if (params.page_size) search.set("page_size", String(params.page_size));
    const qs = search.toString();
    return apiRequest(
      `${endpoints.images.features(imageId)}${qs ? `?${qs}` : ""}`,
    );
  },

  async listAll(imageId?: string): Promise<Feature[]> {
    if (isMockEnabled()) {
      await mockDelay(180);
      const items = getMockState().features;
      return imageId ? items.filter((f) => f.image_id === imageId) : items;
    }
    if (!imageId) return [];
    const page = await this.list({ image_id: imageId, page: 1, page_size: 5000 });
    return page.items;
  },

  async get(imageId: string, featureId: string): Promise<Feature> {
    if (isMockEnabled()) {
      await mockDelay(160);
      const feature = getMockState().features.find(
        (f) => f.feature_id === featureId && f.image_id === imageId,
      );
      if (!feature) {
        const { ApiRequestError } = await import("@/lib/api/client");
        throw new ApiRequestError({
          code: "NOT_FOUND",
          message: "Feature not found.",
        });
      }
      return feature;
    }
    return apiRequest(endpoints.images.feature(imageId, featureId));
  },
};
