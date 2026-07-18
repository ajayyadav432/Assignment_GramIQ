/**
 * TypeScript interfaces for the Krishi Clinic Lite application.
 * These mirror the Pydantic schemas on the backend.
 */

export interface Prediction {
  id: string;
  crop_type: string;
  image_filename: string | null;
  farmer_notes: string | null;
  predicted_disease: string;
  confidence: number;
  severity: string | null;
  recommendation: string | null;
  ai_provider: string;
  created_at: string;
}

export interface PredictionListItem {
  id: string;
  crop_type: string;
  image_filename: string | null;
  predicted_disease: string;
  confidence: number;
  severity: string | null;
  ai_provider: string;
  created_at: string;
}

export interface PredictionListResponse {
  items: PredictionListItem[];
  total: number;
  page: number;
  limit: number;
}

export interface DiseaseCount {
  disease: string;
  count: number;
}

export interface DailyCount {
  date: string;
  count: number;
}

export interface AnalyticsSummary {
  total_predictions: number;
  average_confidence: number;
  disease_distribution: DiseaseCount[];
  daily_volume: DailyCount[];
  severity_distribution: Record<string, number>;
  top_crop: string | null;
}

export interface HealthStatus {
  status: string;
  version: string;
  database: string;
}

// Crop types available in the application
export const CROP_TYPES = [
  "Wheat",
  "Rice",
  "Tomato",
  "Corn",
  "Potato",
  "Cotton",
  "Sugarcane",
  "Soybean",
  "Mustard",
  "Groundnut",
  "Chilli",
] as const;

export type CropType = (typeof CROP_TYPES)[number];

// AI Providers available for model selection
export const AI_PROVIDERS = [
  { value: "", label: "Default (server config)" },
  { value: "gemini", label: "🤖 Google Gemini" },
  { value: "groq", label: "⚡ Groq (Llama 4)" },
  { value: "mock", label: "🧪 Mock (deterministic)" },
] as const;
