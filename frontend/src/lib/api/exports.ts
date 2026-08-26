import { endpoints } from "@/lib/constants/endpoints";
import { apiRequest, isMockEnabled, mockDelay } from "@/lib/api/client";
import { getMockState, mutateMock } from "@/mock/store";
import type { ExportFormat, ExportRecord, FeatureType, Paginated } from "@/lib/types";

export interface CreateExportInput {
  image_id: string;
  format: ExportFormat;
  layers: FeatureType[];
}

export const exportsApi = {
  async list(): Promise<Paginated<ExportRecord>> {
    if (isMockEnabled()) {
      await mockDelay(180);
      const items = getMockState().exports;
      return { items, total: items.length, page: 1, page_size: items.length };
    }
    return apiRequest(endpoints.exports.list);
  },

  async get(exportId: string): Promise<ExportRecord> {
    if (isMockEnabled()) {
      await mockDelay(140);
      const rec = getMockState().exports.find((e) => e.export_id === exportId);
      if (!rec) {
        const { ApiRequestError } = await import("@/lib/api/client");
        throw new ApiRequestError({
          code: "NOT_FOUND",
          message: "Export not found.",
        });
      }
      return rec;
    }
    return apiRequest(endpoints.exports.get(exportId));
  },

  async create(input: CreateExportInput): Promise<ExportRecord> {
    if (isMockEnabled()) {
      await mockDelay(360);
      const image = getMockState().images.find((i) => i.image_id === input.image_id);
      const count = getMockState().features.filter(
        (f) =>
          f.image_id === input.image_id &&
          input.layers.includes(f.feature_type),
      ).length;
      const ext = input.format === "CSV" ? "csv" : "geojson";
      const rec: ExportRecord = {
        export_id: `exp_${Date.now().toString(36)}`,
        image_id: input.image_id,
        filename: `${image?.filename.replace(/\.[^.]+$/, "") ?? "export"}_${input.layers.join("_").toLowerCase()}.${ext}`,
        format: input.format,
        layers: input.layers,
        status: "COMPLETED",
        created_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        download_url: "#",
        feature_count: image?.feature_count
          ? Math.round(
              image.feature_count *
                (input.layers.length / 3) *
                (input.layers.length === 3 ? 1 : 0.7),
            )
          : count,
      };
      mutateMock((s) => {
        s.exports = [rec, ...s.exports];
      });
      return rec;
    }
    return apiRequest(endpoints.images.exports(input.image_id), {
      method: "POST",
      body: JSON.stringify({ format: input.format, layers: input.layers }),
    });
  },
};
