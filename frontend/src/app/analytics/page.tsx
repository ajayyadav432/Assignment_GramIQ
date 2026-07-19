"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { getAnalyticsSummary } from "@/lib/api";
import type { AnalyticsSummary } from "@/lib/types";
import { useApp } from "@/context/AppContext";
import AuthPage from "@/components/AuthPage";

// Dynamic imports for Recharts — prevents SSR hydration issues
const DiseaseChart = dynamic(() => import("@/components/DiseaseChart"), {
  ssr: false,
  loading: () => <div className="skeleton" style={{ height: "300px" }} />,
});

const VolumeChart = dynamic(() => import("@/components/VolumeChart"), {
  ssr: false,
  loading: () => <div className="skeleton" style={{ height: "300px" }} />,
});

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon: string;
}) {
  return (
    <div className="stat-card">
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <span style={{ fontSize: "1.5rem" }}>{icon}</span>
        <div>
          <div className="stat-value">{value}</div>
          <div className="stat-label">{label}</div>
        </div>
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const { user, isInitialized, t } = useApp();
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAnalytics() {
      if (!user) return;
      try {
        const summary = await getAnalyticsSummary();
        setData(summary);
      } catch (err) {
        setError(err instanceof Error ? err.message : t("Failed to load analytics."));
      } finally {
        setLoading(false);
      }
    }
    if (user) {
      fetchAnalytics();
    }
  }, [user]);

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

  if (loading) {
    return (
      <div className="page-container">
        <div className="page-header">
          <div className="skeleton" style={{ height: "32px", width: "250px" }} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton" style={{ height: "80px", borderRadius: "var(--radius-lg)" }} />
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
          <div className="skeleton" style={{ height: "350px", borderRadius: "var(--radius-lg)" }} />
          <div className="skeleton" style={{ height: "350px", borderRadius: "var(--radius-lg)" }} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <div className="empty-state-icon">⚠️</div>
          <h2 style={{ fontWeight: 600, marginBottom: "0.5rem" }}>{t("Error Loading Analytics")}</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">📊 {t("Analytics Dashboard")}</h1>
        <p className="page-subtitle">
          {t("Aggregated insights from crop disease predictions.")}
        </p>
      </div>

      {/* Summary Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "1rem",
          marginBottom: "2rem",
        }}
      >
        <StatCard
          icon="📈"
          label={t("Total Predictions")}
          value={data.total_predictions}
        />
        <StatCard
          icon="🎯"
          label={t("Avg Confidence")}
          value={`${Math.round(data.average_confidence * 100)}%`}
        />
        <StatCard
          icon="🦠"
          label={t("Diseases Detected")}
          value={data.disease_distribution.length}
        />
        <StatCard
          icon="🌾"
          label={t("Top Crop")}
          value={t(data.top_crop || "N/A")}
        />
      </div>

      {/* Charts Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
          gap: "1.5rem",
          marginBottom: "2rem",
        }}
      >
        {/* Disease Distribution */}
        <div className="card" style={{ padding: "1.5rem" }}>
          <h3 style={{ fontWeight: 600, marginBottom: "1rem", fontSize: "1rem" }}>
            🦠 {t("Disease Distribution")}
          </h3>
          {data.disease_distribution.length > 0 ? (
            <DiseaseChart data={data.disease_distribution} />
          ) : (
            <div className="empty-state" style={{ padding: "2rem" }}>
              <p>{t("No disease data available yet.")}</p>
            </div>
          )}
        </div>

        {/* 7-Day Volume */}
        <div className="card" style={{ padding: "1.5rem" }}>
          <h3 style={{ fontWeight: 600, marginBottom: "1rem", fontSize: "1rem" }}>
            📅 {t("7-Day Prediction Volume")}
          </h3>
          {data.daily_volume.length > 0 ? (
            <VolumeChart data={data.daily_volume} />
          ) : (
            <div className="empty-state" style={{ padding: "2rem" }}>
              <p>{t("No recent prediction data available.")}</p>
            </div>
          )}
        </div>
      </div>

      {/* Severity Breakdown */}
      {Object.keys(data.severity_distribution).length > 0 && (
        <div className="card" style={{ padding: "1.5rem" }}>
          <h3 style={{ fontWeight: 600, marginBottom: "1rem", fontSize: "1rem" }}>
            ⚡ {t("Severity Breakdown")}
          </h3>
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            {Object.entries(data.severity_distribution).map(([severity, count]) => {
              const cls =
                severity === "High"
                  ? "badge-high"
                  : severity === "Medium"
                  ? "badge-medium"
                  : "badge-low";
              return (
                <div
                  key={severity}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "0.75rem 1.25rem",
                    background: "var(--color-bg-secondary)",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--color-border-light)",
                  }}
                >
                  <span className={`badge ${cls}`}>{t(severity)}</span>
                  <span style={{ fontWeight: 700, fontSize: "1.25rem" }}>{count}</span>
                  <span style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
                    {t("predictions")}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
