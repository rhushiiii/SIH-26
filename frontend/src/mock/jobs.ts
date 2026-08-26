import { JOB_STAGE_ORDER } from "@/lib/constants";
import type { Job, JobStage, JobStageName, JobStatus } from "@/lib/types";

const STAGE_MS = 7_500;

function stagesFor(
  current: JobStatus,
  runningProgress = 0,
): JobStage[] {
  if (current === "QUEUED") {
    return JOB_STAGE_ORDER.map((name) => ({
      name,
      status: "PENDING",
      progress: 0,
    }));
  }
  if (current === "FAILED") {
    return JOB_STAGE_ORDER.map((name, i) => {
      if (i < 2)
        return { name, status: "COMPLETED" as const, progress: 100 };
      if (i === 2)
        return { name, status: "FAILED" as const, progress: 38 };
      return { name, status: "SKIPPED" as const, progress: 0 };
    });
  }
  if (current === "CANCELLED") {
    return JOB_STAGE_ORDER.map((name, i) => ({
      name,
      status: i === 0 ? "COMPLETED" : i === 1 ? "SKIPPED" : "PENDING",
      progress: i === 0 ? 100 : 0,
    })) as JobStage[];
  }
  if (current === "COMPLETED") {
    return JOB_STAGE_ORDER.map((name) => ({
      name,
      status: "COMPLETED",
      progress: 100,
    }));
  }

  const idx = JOB_STAGE_ORDER.indexOf(current as JobStageName);
  return JOB_STAGE_ORDER.map((name, i) => {
    if (i < idx) return { name, status: "COMPLETED" as const, progress: 100 };
    if (i === idx)
      return { name, status: "RUNNING" as const, progress: runningProgress };
    return { name, status: "PENDING" as const, progress: 0 };
  });
}

export const seedJobs: Job[] = [
  {
    job_id: "job_ortho_2024_05",
    image_id: "img_ortho_2024_05",
    filename: "Orthophoto_2024_05.tif",
    status: "COMPLETED",
    progress: 100,
    stage: "COMPLETED",
    stages: stagesFor("COMPLETED"),
    created_at: "2026-05-17T06:16:00.000Z",
    updated_at: "2026-05-17T06:41:12.000Z",
    started_at: "2026-05-17T06:16:04.000Z",
    completed_at: "2026-05-17T06:41:12.000Z",
    retry_supported: false,
    tiles_total: 1024,
    tiles_processed: 1024,
  },
  {
    job_id: "job_ward_12",
    image_id: "img_ward_12",
    filename: "Ward_12_Survey.tif",
    status: "COMPLETED",
    progress: 100,
    stage: "COMPLETED",
    stages: stagesFor("COMPLETED"),
    created_at: "2026-06-01T04:42:00.000Z",
    updated_at: "2026-06-01T05:01:44.000Z",
    started_at: "2026-06-01T04:42:06.000Z",
    completed_at: "2026-06-01T05:01:44.000Z",
    retry_supported: false,
    tiles_total: 480,
    tiles_processed: 480,
  },
  {
    job_id: "job_canal",
    image_id: "img_canal",
    filename: "Canal_Corridor_Jun.tif",
    status: "INFERENCE",
    progress: 48,
    stage: "INFERENCE",
    stages: stagesFor("INFERENCE", 42),
    created_at: "2026-08-25T22:11:00.000Z",
    updated_at: new Date().toISOString(),
    started_at: new Date(Date.now() - STAGE_MS * 2.35).toISOString(),
    retry_supported: false,
    tiles_total: 768,
    tiles_processed: 318,
  },
  {
    job_id: "job_village_north",
    image_id: "img_village_north",
    filename: "Village_North_RGB.tif",
    status: "FAILED",
    progress: 38,
    stage: "FAILED",
    stages: stagesFor("FAILED"),
    created_at: "2026-08-12T09:24:00.000Z",
    updated_at: "2026-08-12T09:31:18.000Z",
    started_at: "2026-08-12T09:24:08.000Z",
    completed_at: "2026-08-12T09:31:18.000Z",
    error: {
      code: "INVALID_IMAGE",
      message: "Unsupported raster format — missing affine transform.",
    },
    retry_supported: true,
    tiles_total: 256,
    tiles_processed: 0,
  },
  {
    job_id: "job_highway",
    image_id: "img_highway",
    filename: "Highway_Stretch_04.tif",
    status: "QUEUED",
    progress: 0,
    stage: "QUEUED",
    stages: stagesFor("QUEUED"),
    created_at: "2026-08-26T01:06:00.000Z",
    updated_at: "2026-08-26T01:06:00.000Z",
    retry_supported: false,
    tiles_total: 896,
    tiles_processed: 0,
  },
];

export function withLiveProgress(job: Job): Job {
  const active: JobStatus[] = [
    "VALIDATING",
    "PREPROCESSING",
    "INFERENCE",
    "POSTPROCESSING",
    "FINALIZING",
  ];
  if (!job.started_at || !active.includes(job.status)) return job;
  if (job.status === "COMPLETED" || job.status === "FAILED" || job.status === "CANCELLED")
    return job;

  const elapsed = Date.now() - new Date(job.started_at).getTime();
  const idx = Math.min(
    Math.floor(elapsed / STAGE_MS),
    JOB_STAGE_ORDER.length,
  );

  if (idx >= JOB_STAGE_ORDER.length) {
    return {
      ...job,
      status: "COMPLETED",
      stage: "COMPLETED",
      progress: 100,
      stages: stagesFor("COMPLETED"),
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      tiles_processed: job.tiles_total,
    };
  }

  const stage = JOB_STAGE_ORDER[idx];
  const stageProgress = Math.min(
    99,
    Math.round(((elapsed % STAGE_MS) / STAGE_MS) * 100),
  );
  const overall = Math.round(
    ((idx + stageProgress / 100) / JOB_STAGE_ORDER.length) * 100,
  );
  const tilesTotal = job.tiles_total ?? 0;
  const tilesProcessed =
    stage === "INFERENCE"
      ? Math.round((stageProgress / 100) * tilesTotal)
      : idx > 2
        ? tilesTotal
        : 0;

  return {
    ...job,
    status: stage,
    stage,
    progress: overall,
    stages: stagesFor(stage, stageProgress),
    updated_at: new Date().toISOString(),
    tiles_processed: tilesProcessed,
  };
}

export function createJobForImage(
  imageId: string,
  filename: string,
): Job {
  const now = new Date().toISOString();
  return {
    job_id: `job_${imageId.replace("img_", "")}_${Date.now().toString(36)}`,
    image_id: imageId,
    filename,
    status: "VALIDATING",
    progress: 2,
    stage: "VALIDATING",
    stages: stagesFor("VALIDATING", 8),
    created_at: now,
    updated_at: now,
    started_at: now,
    retry_supported: false,
    tiles_total: 512,
    tiles_processed: 0,
  };
}
