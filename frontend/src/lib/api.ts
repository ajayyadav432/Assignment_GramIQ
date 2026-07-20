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
  search?: string;
}): Promise<PredictionListResponse> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set("page", String(params.page));
  if (params?.limit) searchParams.set("limit", String(params.limit));
  if (params?.crop_type) searchParams.set("crop_type", params.crop_type);
  if (params?.disease) searchParams.set("disease", params.disease);
  if (params?.status) searchParams.set("status", params.status);
  if (params?.search) searchParams.set("search", params.search);

  const query = searchParams.toString();
  const url = `${API_URL}/api/v1/predictions${query ? `?${query}` : ""}`;

  const res = await fetch(url, {
    headers: getHeaders(),
    cache: "no-store",
  });
  return handleResponse<PredictionListResponse>(res);
}

export async function getPrediction(id: string): Promise<Prediction> {
  const res = await fetch(`${API_URL}/api/v1/predictions/${id}`, {
    headers: getHeaders(),
    cache: "no-store",
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

export async function getAnalyticsSummary(cropType?: string): Promise<AnalyticsSummary> {
  const url = new URL(`${API_URL}/api/v1/analytics/summary`);
  if (cropType) {
    url.searchParams.set("crop_type", cropType);
  }
  const res = await fetch(url.toString(), {
    headers: getHeaders(),
    cache: "no-store",
  });
  return handleResponse<AnalyticsSummary>(res);
}

// ─── Image URLs ────────────────────────────────────

export function getImageUrl(filename: string): string {
  return `${API_URL}/uploads/${filename}`;
}

// ─── CSV/JSON/XML/PDF Export ───────────────────────

export async function downloadExport(
  format: string,
  params?: { crop_type?: string; disease?: string }
): Promise<void> {
  const searchParams = new URLSearchParams();
  searchParams.set("format", format);
  if (params?.crop_type) searchParams.set("crop_type", params.crop_type);
  if (params?.disease) searchParams.set("disease", params.disease);

  const url = `${API_URL}/api/v1/predictions/export?${searchParams.toString()}`;
  const token = localStorage.getItem("token");
  const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

  const res = await fetch(url, { headers });
  if (!res.ok) {
    throw new ApiError(`Failed to export: ${res.statusText}`, res.status);
  }

  const blob = await res.blob();
  const blobUrl = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = blobUrl;
  const timestamp = new Date().toISOString().slice(0, 10);
  a.download = `krishi_predictions_${timestamp}.${format}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(blobUrl);
}

export async function downloadPdf(predictionId: string): Promise<void> {
  const url = `${API_URL}/api/v1/predictions/${predictionId}/pdf`;
  const token = localStorage.getItem("token");
  const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

  const res = await fetch(url, { headers });
  if (!res.ok) {
    let errDetail = "";
    try {
      const body = await res.json();
      errDetail = body?.detail || JSON.stringify(body);
    } catch {
      errDetail = await res.text().catch(() => res.statusText);
    }
    throw new ApiError(`Failed to download PDF: ${res.status} — ${errDetail}`, res.status);
  }

  const blob = await res.blob();
  const blobUrl = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = `krishi_advisory_${predictionId}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(blobUrl);
}

// ─── Comments & Community ──────────────────────────

export interface CommentItem {
  id: string;
  prediction_id: string;
  user_id: string;
  content: string;
  upvotes: number;
  downvotes: number;
  created_at: string;
  username: string;
  user_role: string;
  user_vote: "upvote" | "downvote" | null;
}

export async function getComments(predictionId: string): Promise<CommentItem[]> {
  const res = await fetch(`${API_URL}/api/v1/predictions/${predictionId}/comments`, {
    headers: getHeaders(),
    cache: "no-store",
  });
  return handleResponse<CommentItem[]>(res);
}

export async function createComment(
  predictionId: string,
  content: string
): Promise<CommentItem> {
  const res = await fetch(`${API_URL}/api/v1/predictions/${predictionId}/comments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getHeaders(),
    },
    body: JSON.stringify({ content }),
  });
  return handleResponse<CommentItem>(res);
}

export async function voteComment(
  commentId: string,
  voteType: "upvote" | "downvote"
): Promise<CommentItem> {
  const res = await fetch(`${API_URL}/api/v1/comments/${commentId}/vote`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getHeaders(),
    },
    body: JSON.stringify({ vote_type: voteType }),
  });
  return handleResponse<CommentItem>(res);
}

export async function uploadFollowup(
  predictionId: string,
  imageFile: File,
  afterNotes?: string
): Promise<Prediction> {
  const formData = new FormData();
  formData.append("image", imageFile);
  if (afterNotes) {
    formData.append("after_notes", afterNotes);
  }

  const res = await fetch(`${API_URL}/api/v1/predictions/${predictionId}/followup`, {
    method: "POST",
    headers: getHeaders(),
    body: formData,
  });
  return handleResponse<Prediction>(res);
}

export { ApiError };
