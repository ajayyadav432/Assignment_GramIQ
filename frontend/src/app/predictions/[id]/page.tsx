"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getPrediction, getImageUrl, downloadPdf } from "@/lib/api";
import type { Prediction } from "@/lib/types";
import { useApp } from "@/context/AppContext";
import AuthPage from "@/components/AuthPage";

function SeverityBadge({ severity, t }: { severity: string | null; t: any }) {
  if (!severity) return null;
  const translated = t(severity);
  const cls =
    severity === "High"
      ? "badge-high"
      : severity === "Medium"
      ? "badge-medium"
      : "badge-low";
  return <span className={`badge ${cls}`}>{translated}</span>;
}

function ConfidenceBar({ confidence, t }: { confidence: number; t: any }) {
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
          {t("Confidence")}
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
  const router = useRouter();
  const id = params.id as string;
  const { user, isInitialized, t, translateDynamic, language } = useApp();

  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dynamically translated content states
  const [transDisease, setTransDisease] = useState("");
  const [transRecommendation, setTransRecommendation] = useState("");
  const [transNotes, setTransNotes] = useState("");
  const [transReasons, setTransReasons] = useState("");
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    async function fetchPrediction() {
      if (!user) return;
      try {
        const data = await getPrediction(id);
        setPrediction(data);
        
        // Translate dynamic values
        const [d, r, n, pr] = await Promise.all([
          translateDynamic(data.predicted_disease),
          translateDynamic(data.recommendation || ""),
          translateDynamic(data.farmer_notes || ""),
          translateDynamic(data.possible_reasons || ""),
        ]);
        setTransDisease(d);
        setTransRecommendation(r);
        setTransNotes(n);
        setTransReasons(pr);
      } catch (err) {
        setError(err instanceof Error ? err.message : t("Failed to load prediction."));
      } finally {
        setLoading(false);
      }
    }
    
    if (user) {
      fetchPrediction();
    }
  }, [id, user, language]); // Re-run translation when language changes!

  if (!isInitialized) {
    return (
      <div className="page-container">
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <div className="skeleton" style={{ height: "32px", width: "200px", marginBottom: "1.5rem" }} />
          <div className="card" style={{ padding: "2rem" }}>
            <div className="skeleton" style={{ height: "300px", marginBottom: "1.5rem", borderRadius: "var(--radius-md)" }} />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

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
          <h2 style={{ fontWeight: 600, marginBottom: "0.5rem" }}>{t("Prediction Not Found")}</h2>
          <p>{error || t("The prediction you're looking for doesn't exist.")}</p>
          <Link href="/history" className="btn btn-primary" style={{ marginTop: "1rem" }}>
            ← {t("Back to History")}
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

  const isPending = prediction.status === "PENDING_REVIEW";

  return (
    <div className="page-container">
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        {/* Breadcrumb */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <Link href="/history" style={{ color: "var(--color-primary)", textDecoration: "none", fontSize: "0.875rem", fontWeight: 500 }}>
            ← {t("Back to History")}
          </Link>
          <button
            onClick={async () => {
              setPdfLoading(true);
              try {
                await downloadPdf(id);
              } catch (e) {
                alert("Failed to download PDF advisory card");
              } finally {
                setPdfLoading(false);
              }
            }}
            disabled={pdfLoading}
            className="btn btn-primary"
            style={{ padding: "0.5rem 1rem", fontSize: "0.8125rem" }}
          >
            📄 {pdfLoading ? t("Exporting...") : t("Export PDF Advisory")}
          </button>
        </div>

        {/* Pending Review Warning Banner */}
        {isPending && user.role !== "AGRONOMIST" && (
          <div
            style={{
              background: "#fffbeb",
              border: "1px solid #fef3c7",
              color: "#b45309",
              padding: "1rem 1.25rem",
              borderRadius: "var(--radius-md)",
              marginBottom: "1.5rem",
              fontSize: "0.875rem",
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
            }}
          >
            <span style={{ fontSize: "1.25rem" }}>⏳</span>
            <div>
              <strong>{t("Pending Review")}:</strong> {t("Our agronomist is currently reviewing this prediction. The diagnosis below is locked until verified.")}
            </div>
          </div>
        )}

        {/* Header */}
        <div className="page-header">
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
            <h1 className="page-title">{transDisease}</h1>
            <SeverityBadge severity={prediction.severity} t={t} />
            <span
              className={`badge`}
              style={{
                background: isPending ? "#fef3c7" : "#dcfce7",
                color: isPending ? "#b45309" : "#15803d",
                fontSize: "0.75rem",
                fontWeight: 600,
              }}
            >
              {isPending ? t("Pending Review") : t("Verified")}
            </span>
          </div>
          <p className="page-subtitle">
            {t(prediction.crop_type)} · {t("Analyzed on")} {formattedDate}
            {prediction.location && ` · 📍 ${prediction.location}`}
            {prediction.language && ` · 🌐 ${prediction.language}`}
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
              <ConfidenceBar confidence={prediction.confidence} t={t} />
            </div>

            {/* Crop Type */}
            <div className="stat-card">
              <div className="stat-label">{t("Crop Type")}</div>
              <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--color-text)", marginTop: "0.25rem" }}>
                {t(prediction.crop_type)}
              </div>
            </div>

            {/* AI Provider */}
            <div className="stat-card">
              <div className="stat-label">{t("AI Provider")}</div>
              <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--color-text)", marginTop: "0.25rem", textTransform: "capitalize" }}>
                {prediction.ai_provider === "Hidden" ? t("Pending Review") : t(prediction.ai_provider)}
              </div>
            </div>
          </div>

          {/* Possible Reasons */}
          {(prediction.possible_reasons || transReasons) && prediction.possible_reasons !== "Pending Review" && (
            <div className="card" style={{ padding: "1.5rem", borderLeft: "4px solid #ffba08" }}>
              <h3 style={{ fontWeight: 600, marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem", color: "#92400e" }}>
                🔍 {t("Possible Reasons")}
              </h3>
              <p style={{ color: "var(--color-text-secondary)", lineHeight: 1.7 }}>
                {transReasons || prediction.possible_reasons}
              </p>
            </div>
          )}

          {/* Recommendation */}
          {(prediction.recommendation || transRecommendation) && (
            <div className="card" style={{ padding: "1.5rem" }}>
              <h3 style={{ fontWeight: 600, marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                💊 {prediction.status === "REVIEWED" ? t("Verified Advisory") : t("Treatment Recommendation")}
              </h3>
              <p style={{ color: "var(--color-text-secondary)", lineHeight: 1.7 }}>
                {transRecommendation}
              </p>
            </div>
          )}

          {/* Farmer Notes */}
          {(prediction.farmer_notes || transNotes) && (
            <div className="card" style={{ padding: "1.5rem" }}>
              <h3 style={{ fontWeight: 600, marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                📝 {t("Farmer Notes")}
              </h3>
              <p style={{ color: "var(--color-text-secondary)", lineHeight: 1.7, fontStyle: "italic" }}>
                &ldquo;{transNotes}&rdquo;
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
