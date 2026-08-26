export const endpoints = {
  images: {
    list: "/images",
    create: "/images",
    get: (imageId: string) => `/images/${imageId}`,
    features: (imageId: string) => `/images/${imageId}/features`,
    feature: (imageId: string, featureId: string) =>
      `/images/${imageId}/features/${featureId}`,
    analytics: (imageId: string) => `/images/${imageId}/analytics`,
    exports: (imageId: string) => `/images/${imageId}/exports`,
  },
  jobs: {
    list: "/jobs",
    create: "/jobs",
    get: (jobId: string) => `/jobs/${jobId}`,
    cancel: (jobId: string) => `/jobs/${jobId}/cancel`,
    retry: (jobId: string) => `/jobs/${jobId}/retry`,
  },
  features: {
    review: (featureId: string) => `/features/${featureId}/review`,
  },
  exports: {
    get: (exportId: string) => `/exports/${exportId}`,
    list: "/exports",
  },
} as const;
