"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { listPredictions, reviewPrediction, getImageUrl } from "@/lib/api";
import { useApp, Translate } from "@/context/AppContext";
import type { Prediction } from "@/lib/types";

export default function AgronomistPortal() {
  const { user, isInitialized, t } = useApp();
  const router = useRouter();
  const [predictions, setPredictions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  // Review form states
  const [verifiedDisease, setVerifiedDisease] = useState("");
  const [verifiedSeverity, setVerifiedSeverity] = useState("Medium");
  const [reviewNotes, setReviewNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (isInitialized && (!user || user.role !== "AGRONOMIST")) {
      router.push("/");
    }
  }, [user, isInitialized]);

  const fetchPending = async () => {
    setLoading(true);
    try {
      // Fetch only PENDING_REVIEW predictions
      const data = await listPredictions({ status: "PENDING_REVIEW", limit: 50 });
      setPredictions(data.items);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === "AGRONOMIST") {
      fetchPending();
    }
  }, [user]);

  const startReview = (pred: any) => {
    setReviewingId(pred.id);
    setVerifiedDisease(pred.predicted_disease || "");
    setVerifiedSeverity(pred.severity || "Medium");
    setReviewNotes(pred.recommendation || "");
    setStatusMessage(null);
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewingId) return;

    setSubmitting(true);
    setStatusMessage(null);

    try {
      await reviewPrediction(reviewingId, {
        predicted_disease: verifiedDisease,
        severity: verifiedSeverity,
        review: reviewNotes,
      });

      setStatusMessage({
        type: "success",
        text: t("Advisory published successfully!"),
      });

      // Remove from list and close form
      setPredictions(predictions.filter((p) => p.id !== reviewingId));
      setTimeout(() => {
        setReviewingId(null);
        setStatusMessage(null);
      }, 1500);

    } catch (err: any) {
      console.error(err);
      setStatusMessage({
        type: "error",
        text: err.detail?.message || "Failed to publish review.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!isInitialized || !user || user.role !== "AGRONOMIST") {
    return (
      <div className="page-container" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh" }}>
        <div className="skeleton" style={{ height: "300px", width: "400px", borderRadius: "var(--radius-md)" }} />
      </div>
    );
  }

  return (
    <div className="page-container">
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <div className="page-header" style={{ borderBottom: "1px solid var(--color-border-light)", paddingBottom: "1.5rem", marginBottom: "2rem" }}>
          <h1 className="page-title">{t("Agronomist Portal")}</h1>
          <p className="page-subtitle">
            {t("Review pending disease diagnosis requests and publish verified recommendations.")}
          </p>
        </div>

        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div className="skeleton" style={{ height: "100px", borderRadius: "var(--radius-md)" }} />
            <div className="skeleton" style={{ height: "100px", borderRadius: "var(--radius-md)" }} />
          </div>
        ) : predictions.length === 0 ? (
          <div className="empty-state">
            <span style={{ fontSize: "3rem" }}>🎉</span>
            <h3 style={{ fontWeight: 600, marginTop: "1rem" }}>{t("All Caught Up!")}</h3>
            <p style={{ color: "var(--color-text-muted)", marginTop: "0.5rem" }}>
              {t("No crop disease diagnoses are currently pending review.")}
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: reviewingId ? "1fr 1fr" : "1fr", gap: "2rem" }}>
            
            {/* Left side: List of pending items */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <h3 style={{ fontSize: "1.125rem", fontWeight: 700, marginBottom: "0.5rem" }}>
                📋 {t("Pending Requests")} ({predictions.length})
              </h3>
              {predictions.map((pred) => (
                <div
                  key={pred.id}
                  className={`card ${reviewingId === pred.id ? "card-active" : ""}`}
                  style={{
                    padding: "1.25rem",
                    cursor: "pointer",
                    border: reviewingId === pred.id ? "2px solid var(--color-primary)" : "1px solid var(--color-border-light)",
                    transition: "all 0.2s ease",
                  }}
                  onClick={() => startReview(pred)}
                >
                  <div style={{ display: "flex", gap: "1rem" }}>
                    {pred.image_filename && (
                      <img
                        src={getImageUrl(pred.image_filename)}
                        alt={pred.crop_type}
                        style={{
                          width: "80px",
                          height: "80px",
                          borderRadius: "var(--radius-sm)",
                          objectFit: "cover",
                          background: "#f3f4f6",
                        }}
                      />
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <span style={{ fontWeight: 700, fontSize: "1rem" }}><Translate text={pred.crop_type} /></span>
                        <span className="badge badge-medium" style={{ background: "#e0f2fe", color: "#0369a1" }}>
                          AI: <Translate text={pred.predicted_disease} />
                        </span>
                      </div>
                      <p
                        style={{
                          fontSize: "0.8125rem",
                          color: "var(--color-text-secondary)",
                          marginTop: "0.375rem",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          maxWidth: "300px",
                        }}
                      >
                        {pred.farmer_notes ? <Translate text={pred.farmer_notes} /> : <em>{t("No notes provided")}</em>}
                      </p>
                      <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "0.5rem" }}>
                        ⏱️ {new Date(pred.created_at).toLocaleDateString("en-IN")} {new Date(pred.created_at).toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit', hour12: true })}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Right side: Active review form */}
            {reviewingId && (
              <div className="card" style={{ padding: "2rem", border: "1px solid var(--color-border-light)", position: "sticky", top: "2rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                  <h3 style={{ fontSize: "1.25rem", fontWeight: 700 }}>🧑‍⚕️ {t("Confirm Diagnosis")}</h3>
                  <button
                    onClick={() => setReviewingId(null)}
                    style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.25rem" }}
                  >
                    ✕
                  </button>
                </div>

                {statusMessage && (
                  <div
                    style={{
                      background: statusMessage.type === "success" ? "#dcfce7" : "#fee2e2",
                      color: statusMessage.type === "success" ? "#166534" : "#991b1b",
                      padding: "0.75rem",
                      borderRadius: "var(--radius-sm)",
                      fontSize: "0.875rem",
                      marginBottom: "1.25rem",
                      border: `1px solid ${statusMessage.type === "success" ? "#86efac" : "#fca5a5"}`,
                    }}
                  >
                    {statusMessage.text}
                  </div>
                )}

                <form onSubmit={handleReviewSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, marginBottom: "0.375rem" }}>
                      {t("Verified Disease Name")}
                    </label>
                    <input
                      type="text"
                      required
                      value={verifiedDisease}
                      onChange={(e) => setVerifiedDisease(e.target.value)}
                      placeholder="e.g. Yellow Rust"
                      style={{
                        width: "100%",
                        padding: "0.75rem",
                        borderRadius: "var(--radius-sm)",
                        border: "1px solid var(--color-border)",
                        fontSize: "0.9375rem",
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, marginBottom: "0.375rem" }}>
                      {t("Verified Severity")}
                    </label>
                    <select
                      value={verifiedSeverity}
                      onChange={(e) => setVerifiedSeverity(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "0.75rem",
                        borderRadius: "var(--radius-sm)",
                        border: "1px solid var(--color-border)",
                        fontSize: "0.9375rem",
                        background: "var(--color-bg)",
                      }}
                    >
                      <option value="Low">{t("Low")}</option>
                      <option value="Medium">{t("Medium")}</option>
                      <option value="High">{t("High")}</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, marginBottom: "0.375rem" }}>
                      {t("Advisory Notes / Treatment")}
                    </label>
                    <textarea
                      required
                      rows={5}
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      placeholder="Enter actionable treatment and preventive steps for the farmer..."
                      style={{
                        width: "100%",
                        padding: "0.75rem",
                        borderRadius: "var(--radius-sm)",
                        border: "1px solid var(--color-border)",
                        fontSize: "0.9375rem",
                        fontFamily: "inherit",
                        resize: "vertical",
                      }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn btn-primary"
                    style={{
                      padding: "0.875rem",
                      fontWeight: 600,
                      width: "100%",
                      justifyContent: "center",
                      marginTop: "0.5rem",
                    }}
                  >
                    {submitting ? t("Analyzing...") : t("Submit Review")}
                  </button>
                </form>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
