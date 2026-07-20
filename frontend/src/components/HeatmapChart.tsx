"use client";

import { useState } from "react";
import { useApp } from "@/context/AppContext";

interface RegionOutbreak {
  name: string;
  lat: number;
  lng: number;
  cases: number;
  primaryDisease: string;
  severity: "Low" | "Medium" | "High";
}

const OUTBREAK_DATA: RegionOutbreak[] = [
  { name: "Punjab / Haryana", lat: 31.1471, lng: 75.3412, cases: 48, primaryDisease: "Wheat Rust", severity: "High" },
  { name: "Andhra Pradesh / Telangana", lat: 15.9129, lng: 79.7400, cases: 35, primaryDisease: "Rice Blast", severity: "High" },
  { name: "Maharashtra", lat: 19.7515, lng: 75.7139, cases: 29, primaryDisease: "Cotton Leaf Curl", severity: "Medium" },
  { name: "Karnataka", lat: 15.3173, lng: 75.7139, cases: 18, primaryDisease: "Tomato Late Blight", severity: "Medium" },
  { name: "Uttar Pradesh", lat: 26.8467, lng: 80.9462, cases: 54, primaryDisease: "Potato Late Blight", severity: "High" },
  { name: "West Bengal", lat: 22.9868, lng: 87.8550, cases: 41, primaryDisease: "Rice Stem Rot", severity: "High" },
  { name: "Rajasthan", lat: 27.0238, lng: 74.2179, cases: 12, primaryDisease: "Mustard Powdery Mildew", severity: "Low" },
  { name: "Gujarat", lat: 22.2587, lng: 71.1924, cases: 22, primaryDisease: "Groundnut Stem Rot", severity: "Medium" }
];

export default function HeatmapChart() {
  const { t } = useApp();
  const [selectedRegion, setSelectedRegion] = useState<RegionOutbreak | null>(OUTBREAK_DATA[0]);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", minHeight: "340px" }} className="results-grid">
      {/* Visual Map Representation */}
      <div
        style={{
          position: "relative",
          background: "#eef2f3",
          borderRadius: "var(--radius-lg)",
          border: "1px solid var(--color-border-light)",
          overflow: "hidden",
          height: "340px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Simple SVG outline representative of India agricultural regions */}
        <svg
          viewBox="0 0 400 500"
          style={{ width: "90%", height: "90%", opacity: 0.85 }}
        >
          {/* Background Map Graphic representation */}
          <path
            d="M 170 80 Q 200 40 230 80 T 260 150 T 290 200 T 320 220 T 300 280 T 250 320 T 200 380 T 160 460 T 140 440 T 170 380 T 150 340 T 100 300 T 80 250 T 90 200 T 130 150 Z"
            fill="#dcedc8"
            stroke="#a1887f"
            strokeWidth="1.5"
          />
          {/* Region Bubbles mapped onto coordinates */}
          {/* Coordinates normalized to 400x500 svg space */}
          {/* Punjab */}
          <circle cx="160" cy="120" r="14" fill="#ef5350" opacity="0.8" style={{ cursor: "pointer" }} onClick={() => setSelectedRegion(OUTBREAK_DATA[0])} />
          {/* AP */}
          <circle cx="210" cy="320" r="12" fill="#ef5350" opacity="0.8" style={{ cursor: "pointer" }} onClick={() => setSelectedRegion(OUTBREAK_DATA[1])} />
          {/* Maharashtra */}
          <circle cx="170" cy="270" r="10" fill="#ffa726" opacity="0.8" style={{ cursor: "pointer" }} onClick={() => setSelectedRegion(OUTBREAK_DATA[2])} />
          {/* Karnataka */}
          <circle cx="160" cy="340" r="8" fill="#ffa726" opacity="0.8" style={{ cursor: "pointer" }} onClick={() => setSelectedRegion(OUTBREAK_DATA[3])} />
          {/* UP */}
          <circle cx="220" cy="160" r="16" fill="#ef5350" opacity="0.8" style={{ cursor: "pointer" }} onClick={() => setSelectedRegion(OUTBREAK_DATA[4])} />
          {/* West Bengal */}
          <circle cx="280" cy="220" r="13" fill="#ef5350" opacity="0.8" style={{ cursor: "pointer" }} onClick={() => setSelectedRegion(OUTBREAK_DATA[5])} />
          {/* Rajasthan */}
          <circle cx="130" cy="170" r="7" fill="#66bb6a" opacity="0.8" style={{ cursor: "pointer" }} onClick={() => setSelectedRegion(OUTBREAK_DATA[6])} />
          {/* Gujarat */}
          <circle cx="110" cy="240" r="9" fill="#ffa726" opacity="0.8" style={{ cursor: "pointer" }} onClick={() => setSelectedRegion(OUTBREAK_DATA[7])} />
        </svg>

        {/* Legend */}
        <div style={{ position: "absolute", bottom: "10px", left: "10px", background: "white", padding: "0.5rem", borderRadius: "6px", fontSize: "0.6875rem", boxShadow: "0 2px 6px rgba(0,0,0,0.05)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", marginBottom: "0.25rem" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#ef5350" }}></span> High Severity (&gt;30 cases)
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", marginBottom: "0.25rem" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#ffa726" }}></span> Medium Severity (15-30 cases)
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#66bb6a" }}></span> Low Severity (&lt;15 cases)
          </div>
        </div>
      </div>

      {/* Outbreak Details Panel */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
        {selectedRegion ? (
          <div className="card" style={{ padding: "1.25rem", flex: 1, display: "flex", flexDirection: "column", gap: "0.75rem", background: "var(--color-bg-secondary)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h4 style={{ fontSize: "1rem", fontWeight: 700 }}>📍 {selectedRegion.name}</h4>
              <span className={`badge ${selectedRegion.severity === "High" ? "badge-high" : selectedRegion.severity === "Medium" ? "badge-medium" : "badge-low"}`}>
                {t(selectedRegion.severity)} {t("Alert")}
              </span>
            </div>
            
            <div style={{ marginTop: "0.5rem" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", display: "block" }}>{t("Outbreak Volume:")}</span>
              <strong style={{ fontSize: "1.5rem", color: "var(--color-primary-dark)" }}>{selectedRegion.cases} {t("Reported Cases")}</strong>
            </div>

            <div>
              <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", display: "block" }}>{t("Primary Active Disease:")}</span>
              <strong style={{ fontSize: "0.9375rem", color: "var(--color-danger)" }}>⚠️ {t(selectedRegion.primaryDisease)}</strong>
            </div>

            <div style={{ marginTop: "auto", borderTop: "1px solid var(--color-border-light)", paddingTop: "0.75rem", fontSize: "0.8125rem", color: "var(--color-text-secondary)" }}>
              💡 <strong>{t("Recommended Action:")}</strong> {t("Farms in this region should check their crops daily. Avoid excessive nitrogen applications and report symptoms immediately.")}
            </div>
          </div>
        ) : (
          <div className="card" style={{ padding: "1.5rem", flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <p style={{ color: "var(--color-text-muted)", textAlign: "center" }}>{t("Click on any region marker to see outbreak details.")}</p>
          </div>
        )}
      </div>
    </div>
  );
}
