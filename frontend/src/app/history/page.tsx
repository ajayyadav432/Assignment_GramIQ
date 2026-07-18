"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { listPredictions } from "@/lib/api";
import type { PredictionListItem, PredictionListResponse } from "@/lib/types";
import { CROP_TYPES } from "@/lib/types";

function SeverityBadge({ severity }: { severity: string | null }) {
  if (!severity) return <span style={{ color: "var(--color-text-muted)" }}>—</span>;
  const cls =
    severity === "High"
      ? "badge-high"
      : severity === "Medium"
      ? "badge-medium"
      : "badge-low";
  return <span className={`badge ${cls}`}>{severity}</span>;
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
  const [data, setData] = useState<PredictionListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [page, setPage] = useState(1);
  const [cropFilter, setCropFilter] = useState("");
  const [diseaseFilter, setDiseaseFilter] = useState("");
  const limit = 10;

  const fetchData = useCallback(async () => {
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
      setError(err instanceof Error ? err.message : "Failed to load predictions.");
    } finally {
      setLoading(false);
    }
  }, [page, cropFilter, diseaseFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleExportCSV = async () => {
    try {
      // Fetch CSV content from the proxy API
      const params = new URLSearchParams();
      if (cropFilter) params.set("crop_type", cropFilter);
      if (diseaseFilter) params.set("disease", diseaseFilter);
      const qs = params.toString();

      const res = await fetch(`/api/export/export.csv${qs ? `?${qs}` : ""}`);
      if (!res.ok) throw new Error("Export failed");
      const csvText = await res.text();

      // Build filename
      const now = new Date();
      const ts = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}_${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}`;
      const filename = `krishi_predictions_${ts}.csv`;

      // Use data: URI — this embeds the entire file content in the URL itself.
      // Unlike blob: URLs, data: URIs respect the download attribute in ALL environments
      // including sandboxed Cloud Workstations that rename blob downloads to UUIDs.
      const dataUri = "data:text/csv;charset=utf-8," + encodeURIComponent(csvText);
      const link = document.createElement("a");
      link.setAttribute("href", dataUri);
      link.setAttribute("download", filename);
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Export failed.");
    }
  };

  const totalPages = data ? Math.ceil(data.total / limit) : 0;

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 className="page-title">📋 Prediction History</h1>
          <p className="page-subtitle">
            Browse and filter past crop disease analyses.
          </p>
        </div>
        {data && data.total > 0 && (
          <button
            onClick={handleExportCSV}
            className="btn btn-secondary"
            style={{ fontSize: "0.8125rem" }}
          >
            📥 Export CSV
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
          <label className="label" style={{ fontSize: "0.75rem" }}>Crop Type</label>
          <select
            className="select"
            value={cropFilter}
            onChange={(e) => { setCropFilter(e.target.value); setPage(1); }}
            style={{ padding: "0.5rem 0.75rem", fontSize: "0.8125rem" }}
          >
            <option value="">All crops</option>
            {CROP_TYPES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div style={{ flex: "1 1 180px" }}>
          <label className="label" style={{ fontSize: "0.75rem" }}>Disease</label>
          <input
            className="input"
            type="text"
            placeholder="Filter by disease..."
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
            Clear Filters
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
            Retry
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && data && data.items.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">🌿</div>
          <h2 style={{ fontWeight: 600, marginBottom: "0.5rem" }}>No Predictions Yet</h2>
          <p>Upload a crop image to get your first disease analysis.</p>
          <Link href="/" className="btn btn-primary" style={{ marginTop: "1rem" }}>
            📤 Upload Image
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
                  <th>Date</th>
                  <th>Crop</th>
                  <th>Disease</th>
                  <th>Confidence</th>
                  <th>Severity</th>
                  <th>Provider</th>
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
                      })}
                    </td>
                    <td style={{ fontWeight: 600 }}>{item.crop_type}</td>
                    <td>{item.predicted_disease}</td>
                    <td><ConfidenceDisplay value={item.confidence} /></td>
                    <td><SeverityBadge severity={item.severity} /></td>
                    <td style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", textTransform: "capitalize" }}>
                      {item.ai_provider}
                    </td>
                    <td>
                      <Link
                        href={`/predictions/${item.id}`}
                        className="btn btn-secondary"
                        style={{ padding: "0.25rem 0.75rem", fontSize: "0.75rem" }}
                      >
                        View →
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
                ← Previous
              </button>
              <span style={{ fontSize: "0.875rem", color: "var(--color-text-muted)", padding: "0 0.5rem" }}>
                Page {page} of {totalPages}
              </span>
              <button
                className="btn btn-secondary"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                style={{ padding: "0.375rem 0.75rem", fontSize: "0.8125rem" }}
              >
                Next →
              </button>
            </div>
          )}

          {/* Result Count */}
          <div style={{ textAlign: "center", marginTop: "0.75rem", fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
            Showing {data.items.length} of {data.total} predictions
          </div>
        </>
      )}
    </div>
  );
}
