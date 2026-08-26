import { endpoints } from "@/lib/constants/endpoints";
import { apiRequest, isMockEnabled, mockDelay } from "@/lib/api/client";
import { createJobForImage, withLiveProgress } from "@/mock/jobs";
import { getMockState, mutateMock } from "@/mock/store";
import type { Job, Paginated } from "@/lib/types";

export const jobsApi = {
  async list(): Promise<Paginated<Job>> {
    if (isMockEnabled()) {
      await mockDelay(180);
      const items = getMockState().jobs.map(withLiveProgress);
      mutateMock((s) => {
        s.jobs = items;
        for (const job of items) {
          const img = s.images.find((i) => i.image_id === job.image_id);
          if (!img) continue;
          if (job.status === "COMPLETED") img.status = "COMPLETED";
          if (job.status === "FAILED") img.status = "FAILED";
          if (
            job.status !== "COMPLETED" &&
            job.status !== "FAILED" &&
            job.status !== "CANCELLED" &&
            job.status !== "QUEUED"
          ) {
            img.status = "PROCESSING";
          }
        }
      });
      return { items, total: items.length, page: 1, page_size: items.length };
    }
    return apiRequest(endpoints.jobs.list);
  },

  async get(jobId: string): Promise<Job> {
    if (isMockEnabled()) {
      await mockDelay(160);
      const raw = getMockState().jobs.find((j) => j.job_id === jobId);
      if (!raw) {
        const { ApiRequestError } = await import("@/lib/api/client");
        throw new ApiRequestError({ code: "NOT_FOUND", message: "Job not found." });
      }
      const job = withLiveProgress(raw);
      mutateMock((s) => {
        s.jobs = s.jobs.map((j) => (j.job_id === jobId ? job : j));
        const img = s.images.find((i) => i.image_id === job.image_id);
        if (img && job.status === "COMPLETED") img.status = "COMPLETED";
      });
      return job;
    }
    return apiRequest(endpoints.jobs.get(jobId));
  },

  async create(imageId: string): Promise<Job> {
    if (isMockEnabled()) {
      await mockDelay(280);
      const image = getMockState().images.find((i) => i.image_id === imageId);
      if (!image) {
        const { ApiRequestError } = await import("@/lib/api/client");
        throw new ApiRequestError({ code: "NOT_FOUND", message: "Image not found." });
      }
      const job = createJobForImage(imageId, image.filename);
      mutateMock((s) => {
        s.jobs = [job, ...s.jobs];
        const img = s.images.find((i) => i.image_id === imageId);
        if (img) {
          img.status = "PROCESSING";
          img.job_id = job.job_id;
        }
      });
      return job;
    }
    return apiRequest(endpoints.jobs.create, {
      method: "POST",
      body: JSON.stringify({ image_id: imageId }),
    });
  },

  async cancel(jobId: string): Promise<Job> {
    if (isMockEnabled()) {
      await mockDelay(200);
      let updated: Job | undefined;
      mutateMock((s) => {
        const job = s.jobs.find((j) => j.job_id === jobId);
        if (!job) return;
        job.status = "CANCELLED";
        job.stage = "CANCELLED";
        job.progress = job.progress;
        job.updated_at = new Date().toISOString();
        job.stages = job.stages.map((st) =>
          st.status === "RUNNING" ? { ...st, status: "SKIPPED" } : st,
        );
        updated = job;
        const img = s.images.find((i) => i.image_id === job.image_id);
        if (img) img.status = "UPLOADED";
      });
      if (!updated) {
        const { ApiRequestError } = await import("@/lib/api/client");
        throw new ApiRequestError({ code: "NOT_FOUND", message: "Job not found." });
      }
      return updated;
    }
    return apiRequest(endpoints.jobs.cancel(jobId), { method: "POST" });
  },

  async retry(jobId: string): Promise<Job> {
    if (isMockEnabled()) {
      await mockDelay(260);
      const existing = getMockState().jobs.find((j) => j.job_id === jobId);
      if (!existing) {
        const { ApiRequestError } = await import("@/lib/api/client");
        throw new ApiRequestError({ code: "NOT_FOUND", message: "Job not found." });
      }
      const job = createJobForImage(existing.image_id, existing.filename);
      job.job_id = existing.job_id;
      mutateMock((s) => {
        s.jobs = s.jobs.map((j) => (j.job_id === jobId ? job : j));
        const img = s.images.find((i) => i.image_id === job.image_id);
        if (img) img.status = "PROCESSING";
      });
      return job;
    }
    return apiRequest(endpoints.jobs.retry(jobId), { method: "POST" });
  },
};
