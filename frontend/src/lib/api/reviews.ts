import { endpoints } from "@/lib/constants/endpoints";
import { ANALYST_PROFILE } from "@/lib/constants";
import { apiRequest, isMockEnabled, mockDelay } from "@/lib/api/client";
import { getMockState, mutateMock } from "@/mock/store";
import type { Feature, Review, ReviewRequest } from "@/lib/types";

export const reviewsApi = {
  async submit(featureId: string, body: ReviewRequest): Promise<Review> {
    if (isMockEnabled()) {
      await mockDelay(280);
      const review: Review = {
        review_id: `rev_${Date.now().toString(36)}`,
        feature_id: featureId,
        action: body.action,
        comment: body.comment,
        reviewer: ANALYST_PROFILE.name,
        created_at: new Date().toISOString(),
      };
      mutateMock((s) => {
        s.reviews = [review, ...s.reviews];
        const feature = s.features.find((f) => f.feature_id === featureId);
        if (feature) {
          if (body.action === "ACCEPT") feature.properties.status = "ACCEPTED";
          if (body.action === "REJECT") feature.properties.status = "REJECTED";
          if (body.action === "EDIT") feature.properties.status = "EDITED";
        }
      });
      return review;
    }
    return apiRequest(endpoints.features.review(featureId), {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  async queue(imageId?: string): Promise<Feature[]> {
    if (isMockEnabled()) {
      await mockDelay(200);
      return getMockState()
        .features.filter((f) => !imageId || f.image_id === imageId)
        .filter(
          (f) =>
            f.properties.status === "REVIEW_RECOMMENDED" ||
            f.properties.status === "HUMAN_REVIEW_REQUIRED",
        );
    }
    const { featuresApi } = await import("@/lib/api/features");
    const recommended = await featuresApi.list({
      image_id: imageId,
      status: "REVIEW_RECOMMENDED",
      page_size: 200,
    });
    const required = await featuresApi.list({
      image_id: imageId,
      status: "HUMAN_REVIEW_REQUIRED",
      page_size: 200,
    });
    return [...required.items, ...recommended.items];
  },
};
