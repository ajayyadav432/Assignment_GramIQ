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
        {/* Clean, recognizable SVG outline of the map of India */}
        <svg
          viewBox="0 0 400 500"
          style={{ width: "95%", height: "95%", opacity: 0.9 }}
        >
          {/* Detailed, recognizable path representing India's geography */}
          <path
            d="M 155 40 
               L 165 42 L 170 30 L 175 35 L 180 50 L 195 55 L 205 60 L 200 70 L 185 85 L 185 95 L 195 105 L 205 110 L 220 115 
               L 235 125 L 245 130 L 260 135 L 280 145 L 290 145 L 295 155 L 305 155 L 315 145 L 330 150 L 335 160 L 330 170 
               L 320 175 L 315 185 L 320 195 L 335 195 L 345 190 L 350 200 L 340 210 L 325 210 L 310 205 L 300 210 L 295 220 
               L 300 230 L 305 235 L 295 240 L 285 240 L 275 235 L 265 245 L 260 260 L 265 270 L 270 280 L 260 295 L 250 310 
               L 240 330 L 235 350 L 230 370 L 220 390 L 205 420 L 198 440 L 195 455 L 190 460 L 185 450 L 182 430 L 180 410 
               L 175 390 L 170 370 L 165 350 L 155 330 L 145 310 L 140 290 L 142 270 L 135 255 L 125 245 L 115 240 L 105 240 
               L 95 235 L 85 238 L 82 245 L 75 245 L 80 230 L 95 225 L 105 210 L 112 195 L 118 190 L 130 195 L 138 185 L 138 175 
               L 130 165 L 135 155 L 142 145 L 148 135 L 148 120 L 145 110 L 150 100 L 148 90 L 150 80 L 158 75 Z"
            fill="#dcedc8"
            stroke="#795548"
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
