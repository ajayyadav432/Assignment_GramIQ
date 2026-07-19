const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * Typed API client for the Krishi Clinic Lite backend.
 * Handles all HTTP communication with proper error handling.
 */

import type {
  Prediction,
  PredictionListResponse,
  AnalyticsSummary,
  HealthStatus,
} from "./types";

class ApiError extends Error {
  status: number;
  detail: unknown;

  constructor(message: string, status: number, detail?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let detail: unknown;
    try {
      detail = await response.json();
    } catch {
      detail = await response.text();
    }
    throw new ApiError(
      `API Error: ${response.status} ${response.statusText}`,
      response.status,
      detail
    );
  }
  return response.json();
}

function getHeaders(): HeadersInit {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ─── Health ────────────────────────────────────────

export async function checkHealth(): Promise<HealthStatus> {
  const res = await fetch(`${API_URL}/health`);
  return handleResponse<HealthStatus>(res);
}

// ─── Authentication ─────────────────────────────────

export async function loginUser(credentials: any): Promise<{ access_token: string; token_type: string }> {
  const res = await fetch(`${API_URL}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });
  return handleResponse(res);
}

export async function registerUser(userData: any): Promise<any> {
  const res = await fetch(`${API_URL}/api/v1/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData),
  });
  return handleResponse(res);
}

// ─── Predictions ───────────────────────────────────

export async function createPrediction(
  formData: FormData
): Promise<Prediction> {
  const res = await fetch(`${API_URL}/api/v1/predictions`, {
    method: "POST",
    body: formData,
    headers: getHeaders(),
  });
  return handleResponse<Prediction>(res);
}

export async function listPredictions(params?: {
  page?: number;
  limit?: number;
  crop_type?: string;
  disease?: string;
  status?: string;
}): Promise<PredictionListResponse> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set("page", String(params.page));
  if (params?.limit) searchParams.set("limit", String(params.limit));
  if (params?.crop_type) searchParams.set("crop_type", params.crop_type);
  if (params?.disease) searchParams.set("disease", params.disease);
  if (params?.status) searchParams.set("status", params.status);

  const query = searchParams.toString();
  const url = `${API_URL}/api/v1/predictions${query ? `?${query}` : ""}`;

  const res = await fetch(url, {
    headers: getHeaders(),
  });
  return handleResponse<PredictionListResponse>(res);
}

export async function getPrediction(id: string): Promise<Prediction> {
  const res = await fetch(`${API_URL}/api/v1/predictions/${id}`, {
    headers: getHeaders(),
  });
  return handleResponse<Prediction>(res);
}

export async function reviewPrediction(
  id: string,
  review: { predicted_disease: string; severity: string; review: string }
): Promise<Prediction> {
  const res = await fetch(`${API_URL}/api/v1/predictions/${id}/review`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getHeaders(),
    },
    body: JSON.stringify(review),
  });
  return handleResponse<Prediction>(res);
}

// ─── Analytics ─────────────────────────────────────

export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
  const res = await fetch(`${API_URL}/api/v1/analytics/summary`, {
    headers: getHeaders(),
  });
  return handleResponse<AnalyticsSummary>(res);
}

// ─── Image URLs ────────────────────────────────────

export function getImageUrl(filename: string): string {
  return `${API_URL}/uploads/${filename}`;
}

// ─── CSV Export (Bonus) ────────────────────────────

export function getExportUrl(params?: {
  crop_type?: string;
  disease?: string;
}): string {
  const searchParams = new URLSearchParams();
  if (params?.crop_type) searchParams.set("crop_type", params.crop_type);
  if (params?.disease) searchParams.set("disease", params.disease);

  const query = searchParams.toString();
  return `${API_URL}/api/v1/predictions/export${query ? `?${query}` : ""}`;
}

export { ApiError };
