"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getPrediction, getImageUrl } from "@/lib/api";
import type { Prediction } from "@/lib/types";

function SeverityBadge({ severity }: { severity: string | null }) {
  if (!severity) return null;
  const cls =
    severity === "High"
      ? "badge-high"
      : severity === "Medium"
      ? "badge-medium"
      : "badge-low";
  return <span className={`badge ${cls}`}>{severity}</span>;
}

function ConfidenceBar({ confidence }: { confidence: number }) {
  const percentage = Math.round(confidence * 100);
  const cls =
    confidence >= 0.85
      ? "confidence-high"
      : confidence >= 0.65
      ? "confidence-medium"
      : "confidence-low";

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.375rem" }}>
        <span style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
          Confidence
        </span>
        <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--color-primary)" }}>
          {percentage}%
        </span>
      </div>
      <div className="confidence-bar">
        <div className={`confidence-fill ${cls}`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}

export default function PredictionDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPrediction() {
      try {
        const data = await getPrediction(id);
        setPrediction(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load prediction.");
      } finally {
        setLoading(false);
      }
    }
    fetchPrediction();
  }, [id]);

  if (loading) {
    return (
      <div className="page-container">
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <div className="skeleton" style={{ height: "32px", width: "200px", marginBottom: "1.5rem" }} />
          <div className="card" style={{ padding: "2rem" }}>
            <div className="skeleton" style={{ height: "300px", marginBottom: "1.5rem", borderRadius: "var(--radius-md)" }} />
            <div className="skeleton" style={{ height: "20px", width: "60%", marginBottom: "0.75rem" }} />
            <div className="skeleton" style={{ height: "20px", width: "40%", marginBottom: "0.75rem" }} />
            <div className="skeleton" style={{ height: "20px", width: "80%" }} />
          </div>
        </div>
      </div>
    );
  }

  if (error || !prediction) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <div className="empty-state-icon">❌</div>
          <h2 style={{ fontWeight: 600, marginBottom: "0.5rem" }}>Prediction Not Found</h2>
          <p>{error || "The prediction you're looking for doesn't exist."}</p>
          <Link href="/history" className="btn btn-primary" style={{ marginTop: "1rem" }}>
            ← Back to History
          </Link>
        </div>
      </div>
    );
  }

  const formattedDate = new Date(prediction.created_at).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="page-container">
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        {/* Breadcrumb */}
        <div style={{ marginBottom: "1.5rem" }}>
          <Link href="/history" style={{ color: "var(--color-primary)", textDecoration: "none", fontSize: "0.875rem", fontWeight: 500 }}>
            ← Back to History
          </Link>
        </div>

        {/* Header */}
        <div className="page-header">
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
            <h1 className="page-title">{prediction.predicted_disease}</h1>
            <SeverityBadge severity={prediction.severity} />
          </div>
          <p className="page-subtitle">
            {prediction.crop_type} · Analyzed on {formattedDate}
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1.5rem" }}>
          {/* Image Card */}
          {prediction.image_filename && (
            <div className="card" style={{ overflow: "hidden" }}>
              <img
                src={getImageUrl(prediction.image_filename)}
                alt={`${prediction.crop_type} sample`}
                style={{
                  width: "100%",
                  maxHeight: "400px",
                  objectFit: "contain",
                  background: "#f8f9fa",
                }}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
          )}

          {/* Results Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
            {/* Confidence */}
            <div className="card" style={{ padding: "1.25rem" }}>
              <ConfidenceBar confidence={prediction.confidence} />
            </div>

            {/* Crop Type */}
            <div className="stat-card">
              <div className="stat-label">Crop Type</div>
              <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--color-text)", marginTop: "0.25rem" }}>
                {prediction.crop_type}
              </div>
            </div>

            {/* AI Provider */}
            <div className="stat-card">
              <div className="stat-label">AI Provider</div>
              <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--color-text)", marginTop: "0.25rem", textTransform: "capitalize" }}>
                {prediction.ai_provider}
              </div>
            </div>
          </div>

          {/* Recommendation */}
          {prediction.recommendation && (
            <div className="card" style={{ padding: "1.5rem" }}>
              <h3 style={{ fontWeight: 600, marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                💊 Treatment Recommendation
              </h3>
              <p style={{ color: "var(--color-text-secondary)", lineHeight: 1.7 }}>
                {prediction.recommendation}
              </p>
            </div>
          )}

          {/* Farmer Notes */}
          {prediction.farmer_notes && (
            <div className="card" style={{ padding: "1.5rem" }}>
              <h3 style={{ fontWeight: 600, marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                📝 Farmer Notes
              </h3>
              <p style={{ color: "var(--color-text-secondary)", lineHeight: 1.7, fontStyle: "italic" }}>
                &ldquo;{prediction.farmer_notes}&rdquo;
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
