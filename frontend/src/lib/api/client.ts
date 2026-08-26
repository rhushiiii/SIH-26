import { getApiBaseUrl, getUseMockApi } from "@/lib/config";
import type { ApiError, ApiResponse } from "@/lib/types";

export class ApiRequestError extends Error {
  code: string;
  status?: number;

  constructor(error: ApiError, status?: number) {
    super(error.message);
    this.name = "ApiRequestError";
    this.code = error.code;
    this.status = status;
  }
}

function unwrap<T>(payload: ApiResponse<T>, status: number): T {
  if (!payload.success || payload.data == null || payload.error) {
    const err = payload.error ?? {
      code: "UNKNOWN",
      message: "The request could not be completed.",
    };
    throw new ApiRequestError(err, status);
  }
  return payload.data;
}

function humanizeNetworkError(): ApiError {
  return {
    code: "NETWORK_ERROR",
    message:
      "Could not reach the GeoAI API. Check the API base URL or switch back to mock mode.",
  };
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const url = `${getApiBaseUrl()}${path}`;
  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      headers: {
        Accept: "application/json",
        ...(init.body instanceof FormData
          ? {}
          : { "Content-Type": "application/json" }),
        ...(init.headers ?? {}),
      },
    });
  } catch {
    throw new ApiRequestError(humanizeNetworkError());
  }

  let payload: ApiResponse<T>;
  try {
    payload = (await response.json()) as ApiResponse<T>;
  } catch {
    throw new ApiRequestError(
      {
        code: "INVALID_RESPONSE",
        message: "The server returned an unreadable response.",
      },
      response.status,
    );
  }

  return unwrap(payload, response.status);
}

export function isMockEnabled(): boolean {
  return getUseMockApi();
}

export async function mockDelay(ms = 240): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export function ok<T>(data: T, meta: ApiResponse<T>["meta"] = {}): ApiResponse<T> {
  return { success: true, data, error: null, meta };
}
