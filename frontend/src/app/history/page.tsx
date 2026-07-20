"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { listPredictions } from "@/lib/api";
import type { PredictionListItem, PredictionListResponse } from "@/lib/types";
import { CROP_TYPES } from "@/lib/types";
import { useApp, Translate } from "@/context/AppContext";
import AuthPage from "@/components/AuthPage";

function SeverityBadge({ severity, t }: { severity: string | null; t: any }) {
  if (!severity) return <span style={{ color: "var(--color-text-muted)" }}>—</span>;
  const translated = t(severity);
  const cls =
    severity === "High"
      ? "badge-high"
      : severity === "Medium"
      ? "badge-medium"
      : "badge-low";
  return <span className={`badge ${cls}`}>{translated}</span>;
}

function ConfidenceDisplay({ value }: { value: number }) {
  const percentage = Math.round(value * 100);
  return (
    <span className="badge badge-confidence" style={{ fontFamily: "var(--font-mono)" }}>
      {percentage}%
    </span>
  );
}

export default function HistoryPage() {
  const { user, isInitialized, t } = useApp();
  const router = useRouter();
  const [data, setData] = useState<PredictionListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [page, setPage] = useState(1);
  const [cropFilter, setCropFilter] = useState("");
  const [diseaseFilter, setDiseaseFilter] = useState("");
  const limit = 10;

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const result = await listPredictions({
        page,
        limit,
        crop_type: cropFilter || undefined,
        disease: diseaseFilter || undefined,
      });
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Failed to load predictions."));
    } finally {
      setLoading(false);
    }
  }, [page, cropFilter, diseaseFilter, user]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [fetchData, user]);

  if (!isInitialized) {
    return (
      <div className="page-container" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh" }}>
        <div className="skeleton" style={{ height: "300px", width: "400px", borderRadius: "var(--radius-md)" }} />
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  const handleExportCSV = async () => {
    try {
      const params = new URLSearchParams();
      if (cropFilter) params.set("crop_type", cropFilter);
      if (diseaseFilter) params.set("disease", diseaseFilter);
      const qs = params.toString();

      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const token = localStorage.getItem("token");
      
      const res = await fetch(`${apiBase}/api/v1/predictions/export${qs ? `?${qs}` : ""}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      
      if (!res.ok) throw new Error("Export failed");
      const csvText = await res.text();

      const now = new Date();
      const ts = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}_${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}`;
      const filename = `krishi_predictions_${ts}.csv`;

      const dataUri = "data:text/csv;charset=utf-8," + encodeURIComponent(csvText);
      const link = document.createElement("a");
      link.setAttribute("href", dataUri);
      link.setAttribute("download", filename);
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert(err instanceof Error ? err.message : t("Export failed."));
    }
  };

  const totalPages = data ? Math.ceil(data.total / limit) : 0;

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 className="page-title">📋 {t("History")}</h1>
          <p className="page-subtitle">
            {t("Browse and filter past crop disease analyses.")}
          </p>
        </div>
        {data && data.total > 0 && (
          <button
            onClick={handleExportCSV}
            className="btn btn-secondary"
            style={{ fontSize: "0.8125rem" }}
          >
            📥 {t("Export CSV")}
          </button>
        )}
      </div>

      {/* Filters */}
      <div
        className="card"
        style={{
          padding: "1rem 1.25rem",
          marginBottom: "1.5rem",
          display: "flex",
          gap: "1rem",
          flexWrap: "wrap",
          alignItems: "end",
        }}
      >
        <div style={{ flex: "1 1 180px" }}>
          <label className="label" style={{ fontSize: "0.75rem" }}>{t("Crop Type")}</label>
          <select
            className="select"
            value={cropFilter}
            onChange={(e) => { setCropFilter(e.target.value); setPage(1); }}
            style={{ padding: "0.5rem 0.75rem", fontSize: "0.8125rem" }}
          >
            <option value="">{t("All crops")}</option>
            {CROP_TYPES.map((c) => (
              <option key={c} value={c}>{t(c)}</option>
            ))}
          </select>
        </div>
        <div style={{ flex: "1 1 180px" }}>
          <label className="label" style={{ fontSize: "0.75rem" }}>{t("Disease")}</label>
          <input
            className="input"
            type="text"
            placeholder={t("Filter by disease...")}
            value={diseaseFilter}
            onChange={(e) => { setDiseaseFilter(e.target.value); setPage(1); }}
            style={{ padding: "0.5rem 0.75rem", fontSize: "0.8125rem" }}
          />
        </div>
        {(cropFilter || diseaseFilter) && (
          <button
            className="btn btn-secondary"
            onClick={() => { setCropFilter(""); setDiseaseFilter(""); setPage(1); }}
            style={{ padding: "0.5rem 1rem", fontSize: "0.8125rem" }}
          >
            {t("Clear Filters")}
          </button>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="card">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              style={{
                padding: "1rem 1.25rem",
                borderBottom: "1px solid var(--color-border-light)",
                display: "flex",
                gap: "1rem",
              }}
            >
              <div className="skeleton" style={{ width: "80px", height: "20px" }} />
              <div className="skeleton" style={{ width: "120px", height: "20px" }} />
              <div className="skeleton" style={{ width: "100px", height: "20px" }} />
              <div className="skeleton" style={{ flex: 1, height: "20px" }} />
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="empty-state">
          <div className="empty-state-icon">⚠️</div>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={fetchData} style={{ marginTop: "1rem" }}>
            {t("Retry")}
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && data && data.items.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">🌿</div>
          <h2 style={{ fontWeight: 600, marginBottom: "0.5rem" }}>{t("No predictions found.")}</h2>
          <p>{t("Upload a crop image to get your first disease analysis.")}</p>
          <Link href="/" className="btn btn-primary" style={{ marginTop: "1rem" }}>
            📥 {t("Upload Image")}
          </Link>
        </div>
      )}

      {/* Results Table */}
      {!loading && !error && data && data.items.length > 0 && (
        <>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>{t("Date")}</th>
                  <th>{t("Crop")}</th>
                  <th>{t("Disease")}</th>
                  <th>{t("Confidence")}</th>
                  <th>{t("Severity")}</th>
                  <th>{t("Status")}</th>
                  <th>{t("Provider")}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((item: PredictionListItem) => (
                  <tr key={item.id}>
                    <td style={{ whiteSpace: "nowrap", fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
                      {new Date(item.created_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}{" "}
                      {new Date(item.created_at).toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </td>
                    <td style={{ fontWeight: 600 }}><Translate text={item.crop_type} /></td>
                    <td><Translate text={item.predicted_disease} /></td>
                    <td><ConfidenceDisplay value={item.confidence} /></td>
                    <td><SeverityBadge severity={item.severity} t={t} /></td>
                    <td>
                      <span
                        className={`badge`}
                        style={{
                          background: item.status === "REVIEWED" ? "#dcfce7" : "#fef3c7",
                          color: item.status === "REVIEWED" ? "#15803d" : "#b45309",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                        }}
                      >
                        {item.status === "REVIEWED" ? t("Verified") : t("Pending Review")}
                      </span>
                    </td>
                    <td style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", textTransform: "capitalize" }}>
                      <Translate text={item.ai_provider} />
                    </td>
                    <td>
                      <Link
                        href={`/predictions/${item.id}`}
                        className="btn btn-secondary"
                        style={{ padding: "0.25rem 0.75rem", fontSize: "0.75rem" }}
                      >
                        {t("View")} →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: "0.5rem",
                marginTop: "1.5rem",
              }}
            >
              <button
                className="btn btn-secondary"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                style={{ padding: "0.375rem 0.75rem", fontSize: "0.8125rem" }}
              >
                ← {t("Previous")}
              </button>
              <span style={{ fontSize: "0.875rem", color: "var(--color-text-muted)", padding: "0 0.5rem" }}>
                {t("Page")} {page} of {totalPages}
              </span>
              <button
                className="btn btn-secondary"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                style={{ padding: "0.375rem 0.75rem", fontSize: "0.8125rem" }}
              >
                {t("Next")} →
              </button>
            </div>
          )}

          {/* Result Count */}
          <div style={{ textAlign: "center", marginTop: "0.75rem", fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
            {t("Showing")} {data.items.length} {t("of")} {data.total} {t("predictions")}
          </div>
        </>
      )}
    </div>
  );
}
