import { endpoints } from "@/lib/constants/endpoints";
import { apiRequest, isMockEnabled, mockDelay } from "@/lib/api/client";
import { createJobForImage } from "@/mock/jobs";
import { getMockState, mutateMock } from "@/mock/store";
import type { ImageRecord, Paginated } from "@/lib/types";

function inferRasterMeta(file: File) {
  const name = file.name.toLowerCase();
  const isTiff = name.endsWith(".tif") || name.endsWith(".tiff") || name.endsWith(".geotiff");
  return {
    width: isTiff ? 12288 : 8192,
    height: isTiff ? 10240 : 6144,
    bands: isTiff ? 4 : 3,
    crs: isTiff ? "EPSG:32643" : "EPSG:4326",
    resolution_m: isTiff ? 0.05 : 0.12,
  };
}

export const imagesApi = {
  async list(): Promise<Paginated<ImageRecord>> {
    if (isMockEnabled()) {
      await mockDelay();
      const items = getMockState().images;
      return { items, total: items.length, page: 1, page_size: items.length };
    }
    const raw = await apiRequest<Paginated<ImageRecord> | ImageRecord[]>(endpoints.images.list);
    if (Array.isArray(raw)) {
      return { items: raw, total: raw.length, page: 1, page_size: raw.length || 20 };
    }
    return raw;
  },

  async get(imageId: string): Promise<ImageRecord> {
    if (isMockEnabled()) {
      await mockDelay();
      const image = getMockState().images.find((i) => i.image_id === imageId);
      if (!image) {
        const { ApiRequestError } = await import("@/lib/api/client");
        throw new ApiRequestError({
          code: "NOT_FOUND",
          message: "Image not found.",
        });
      }
      return image;
    }
    return apiRequest(endpoints.images.get(imageId));
  },

  async create(file: File): Promise<ImageRecord> {
    if (isMockEnabled()) {
      await mockDelay(420);
      const meta = inferRasterMeta(file);
      const image: ImageRecord = {
        image_id: `img_${Date.now().toString(36)}`,
        filename: file.name,
        size_bytes: file.size,
        ...meta,
        uploaded_at: new Date().toISOString(),
        status: "UPLOADED",
        bounds: {
          west: 77.505,
          south: 13.039,
          east: 77.519,
          north: 13.051,
        },
        feature_count: 0,
      };
      mutateMock((s) => {
        s.images = [image, ...s.images];
      });
      return image;
    }
    const body = new FormData();
    body.append("file", file);
    const res = await apiRequest<any>(endpoints.images.create, { method: "POST", body });
    if (res && res.image_id && !res.filename) {
      return this.get(res.image_id);
    }
    return res;
  },


  async startProcessing(imageId: string): Promise<{ job_id: string }> {
    if (isMockEnabled()) {
      await mockDelay(300);
      const state = getMockState();
      const image = state.images.find((i) => i.image_id === imageId);
      if (!image) {
        const { ApiRequestError } = await import("@/lib/api/client");
        throw new ApiRequestError({
          code: "NOT_FOUND",
          message: "Image not found.",
        });
      }
      const job = createJobForImage(image.image_id, image.filename);
      mutateMock((s) => {
        s.jobs = [job, ...s.jobs.filter((j) => j.image_id !== imageId)];
        const img = s.images.find((i) => i.image_id === imageId);
        if (img) {
          img.status = "PROCESSING";
          img.job_id = job.job_id;
        }
      });
      return { job_id: job.job_id };
    }
    return apiRequest(endpoints.jobs.create, {
      method: "POST",
      body: JSON.stringify({ image_id: imageId }),
    });
  },
};
