"use client";

import { useState } from "react";
import { useApp } from "@/context/AppContext";
// @ts-ignore
import India from "@svg-maps/india";

interface RegionOutbreak {
  name: string;
  ids: string[]; // Map to @svg-maps/india state IDs
  cx: number;    // Coordinates in the 612x696 space
  cy: number;
  cases: number;
  primaryDisease: string;
  severity: "Low" | "Medium" | "High";
}

const OUTBREAK_DATA: RegionOutbreak[] = [
  { name: "Punjab / Haryana", ids: ["pb", "hr"], cx: 230, cy: 170, cases: 48, primaryDisease: "Wheat Rust", severity: "High" },
  { name: "Andhra Pradesh / Telangana", ids: ["ap", "tg"], cx: 300, cy: 460, cases: 35, primaryDisease: "Rice Blast", severity: "High" },
  { name: "Maharashtra", ids: ["mh"], cx: 240, cy: 390, cases: 29, primaryDisease: "Cotton Leaf Curl", severity: "Medium" },
  { name: "Karnataka", ids: ["ka"], cx: 220, cy: 500, cases: 18, primaryDisease: "Tomato Late Blight", severity: "Medium" },
  { name: "Uttar Pradesh", ids: ["up"], cx: 340, cy: 230, cases: 54, primaryDisease: "Potato Late Blight", severity: "High" },
  { name: "West Bengal", ids: ["wb"], cx: 440, cy: 310, cases: 41, primaryDisease: "Rice Stem Rot", severity: "High" },
  { name: "Rajasthan", ids: ["rj"], cx: 180, cy: 240, cases: 12, primaryDisease: "Mustard Powdery Mildew", severity: "Low" },
  { name: "Gujarat", ids: ["gj"], cx: 140, cy: 330, cases: 22, primaryDisease: "Groundnut Stem Rot", severity: "Medium" }
];

export default function HeatmapChart() {
  const { t } = useApp();
  const [selectedRegion, setSelectedRegion] = useState<RegionOutbreak | null>(OUTBREAK_DATA[0]);

  const isHighlighted = (locationId: string) => {
    if (!selectedRegion) return false;
    return selectedRegion.ids.includes(locationId);
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", minHeight: "360px" }} className="results-grid">
      {/* Visual Map Representation */}
      <div
        style={{
          position: "relative",
          background: "#eef2f3",
          borderRadius: "var(--radius-lg)",
          border: "1px solid var(--color-border-light)",
          overflow: "hidden",
          height: "380px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Render precise, official SVG of India state boundaries */}
        <svg
          viewBox={India.viewBox}
          style={{ width: "95%", height: "95%", opacity: 0.9 }}
        >
          <g id="india-states">
            {India.locations.map((loc: any) => {
              const active = isHighlighted(loc.id);
              return (
                <path
                  key={loc.id}
                  id={loc.id}
                  name={loc.name}
                  d={loc.path}
                  fill={active ? "#81c784" : "#f1f8e9"}
                  stroke={active ? "#2e7d32" : "#a5d6a7"}
                  strokeWidth={active ? "1.5" : "0.75"}
                  style={{
                    transition: "all 0.3s ease",
                    cursor: "pointer",
                  }}
                  onClick={() => {
                    const match = OUTBREAK_DATA.find(r => r.ids.includes(loc.id));
                    if (match) setSelectedRegion(match);
                  }}
                />
              );
            })}
          </g>

          {/* Region Bubbles mapped onto accurate 612x696 coordinates */}
          {OUTBREAK_DATA.map((region) => {
            const isSelected = selectedRegion?.name === region.name;
            const bubbleColor =
              region.severity === "High"
                ? "#ef5350"
                : region.severity === "Medium"
                ? "#ffa726"
                : "#66bb6a";
            
            const radius = region.severity === "High" ? 18 : region.severity === "Medium" ? 14 : 10;

            return (
              <circle
                key={region.name}
                cx={region.cx}
                cy={region.cy}
                r={isSelected ? radius + 4 : radius}
                fill={bubbleColor}
                opacity={isSelected ? "0.9" : "0.7"}
                stroke={isSelected ? "#ffffff" : "transparent"}
                strokeWidth={isSelected ? 2 : 0}
                style={{
                  cursor: "pointer",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                }}
                onClick={() => setSelectedRegion(region)}
              >
                <title>{region.name}</title>
              </circle>
            );
          })}
        </svg>

        {/* Legend */}
        <div style={{ position: "absolute", bottom: "10px", left: "10px", background: "white", padding: "0.5rem", borderRadius: "6px", fontSize: "0.6875rem", boxShadow: "0 2px 6px rgba(0,0,0,0.05)", zIndex: 5 }}>
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
              <strong style={{ fontSize: "0.9375rem", color: "var(--color-danger)" }}>⚠️ {t(regionNameMapping(regionNameMapping(selectedRegion.primaryDisease)))}</strong>
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

// Fallback helper to safely map disease keys for translating
function regionNameMapping(disease: string): string {
  return disease;
}
