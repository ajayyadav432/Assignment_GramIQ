"use client";

import { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";

interface CalendarEvent {
  crop: string;
  season: "Kharif (Monsoon)" | "Rabi (Winter)" | "Zaid (Summer)";
  stage: string;
  advisory: string;
  diseaseRisk: string;
  prevention: string;
  severity: "Low" | "Medium" | "High";
}

const CALENDAR_DATA: Record<string, CalendarEvent[]> = {
  January: [
    { crop: "Wheat", season: "Rabi (Winter)", stage: "Tillering / Jointing", advisory: "Apply first top-dressing of Nitrogen. Maintain adequate soil moisture.", diseaseRisk: "Rust (Yellow Rust)", prevention: "Spray Propiconazole if yellow stripes appear on leaves.", severity: "High" },
    { crop: "Mustard", season: "Rabi (Winter)", stage: "Flowering", advisory: "Keep soil moist. Monitor for aphid infestations.", diseaseRisk: "White Rust / Alternaria Blight", prevention: "Apply Mancozeb if spots appear on lower leaves.", severity: "Medium" },
    { crop: "Potato", season: "Rabi (Winter)", stage: "Tuber Bulking", advisory: "Earthing up should be complete. Control irrigation to prevent rot.", diseaseRisk: "Late Blight", prevention: "Spray Copper Oxychloride or Ridomil Gold immediately.", severity: "High" }
  ],
  February: [
    { crop: "Wheat", season: "Rabi (Winter)", stage: "Heading / Milking", advisory: "Ensure light irrigation to protect crop from rising temperature winds.", diseaseRisk: "Brown Rust / Powdery Mildew", prevention: "Monitor weather; spray hexaconazole if powdery white patches occur.", severity: "Medium" },
    { crop: "Potato", season: "Rabi (Winter)", stage: "Harvesting", advisory: "Dehaulm (cut foliage) 10-12 days before harvesting to harden skins.", diseaseRisk: "Tuber Rot", prevention: "Ensure dry harvesting conditions; sort out damaged tubers before storing.", severity: "Low" }
  ],
  March: [
    { crop: "Wheat", season: "Rabi (Winter)", stage: "Harvesting", advisory: "Harvest when grains are hard and straw is dry. Avoid harvesting in damp weather.", diseaseRisk: "Black Rust (during warm spell)", prevention: "Ensure immediate threshing and dry grains to 12% moisture level.", severity: "Low" },
    { crop: "Chilli", season: "Zaid (Summer)", stage: "Sowing / Transplanting", advisory: "Sow in well-drained nursery beds. Treat seeds with Trichoderma.", diseaseRisk: "Damping Off", prevention: "Avoid waterlogging in nursery beds; treat nursery soil with copper fungicides.", severity: "High" }
  ],
  April: [
    { crop: "Sugarcane", season: "Zaid (Summer)", stage: "Sowing / Tillering", advisory: "Provide light and frequent irrigation. Inter-cultivation to manage weeds.", diseaseRisk: "Red Rot", prevention: "Use disease-free setts. Treat setts with hot water before planting.", severity: "High" },
    { crop: "Tomato", season: "Zaid (Summer)", stage: "Flowering / Fruit Setting", advisory: "Stake plants to keep fruit off the ground. Provide mulch to conserve moisture.", diseaseRisk: "Early Blight / Fruit Borers", prevention: "Spray neem seed kernel extract (NSKE) 5% or chlorothalonil.", severity: "Medium" }
  ],
  May: [
    { crop: "Cotton", season: "Kharif (Monsoon)", stage: "Sowing", advisory: "Choose Bt-cotton varieties. Keep spacing optimal to allow sunlight.", diseaseRisk: "Seedling Wilt", prevention: "Treat seeds with Thiram or Captan. Maintain dry seedbeds.", severity: "Medium" },
    { crop: "Groundnut", season: "Kharif (Monsoon)", stage: "Sowing / Land Prep", advisory: "Deep ploughing to expose hibernating pests. Apply gypsum to soil.", diseaseRisk: "Root Rot / Stem Rot", prevention: "Apply Trichoderma mixed with well-rotted farmyard manure.", severity: "Low" }
  ],
  June: [
    { crop: "Rice", season: "Kharif (Monsoon)", stage: "Nursery / Sowing", advisory: "Prepare nursery beds. Ensure proper drainage. Treat seeds with warm water.", diseaseRisk: "Blast Disease / Seedling Blight", prevention: "Spray Tricyclazole in nursery beds if leaf spots are spotted.", severity: "High" },
    { crop: "Corn", season: "Kharif (Monsoon)", stage: "Sowing / Emergence", advisory: "Ensure good drainage. Apply basal dose of NPK fertilizers.", diseaseRisk: "Downy Mildew", prevention: "Seed treatment with Metalaxyl is highly recommended.", severity: "Medium" }
  ],
  July: [
    { crop: "Rice", season: "Kharif (Monsoon)", stage: "Transplanting", advisory: "Keep standing water level at 2-5cm. Control weed growth in early days.", diseaseRisk: "Rice Blast / Bacterial Leaf Blight", prevention: "Avoid excessive Nitrogen application. Keep water flowing/drained during storms.", severity: "High" },
    { crop: "Tomato", season: "Kharif (Monsoon)", stage: "Vegetative growth", advisory: "Avoid water logging. Stake vines. Watch for leaf spot diseases due to high humidity.", diseaseRisk: "Late Blight / Leaf Spots", prevention: "Spray copper oxychloride or copper hydroxide every 10-14 days.", severity: "High" },
    { crop: "Cotton", season: "Kharif (Monsoon)", stage: "Square Formation", advisory: "Monitor for whiteflies and bollworms. Clean weeds from borders.", diseaseRisk: "Leaf Curl Virus / Boll Rot", prevention: "Spray systemic insecticides to control whitefly vector early.", severity: "High" }
  ],
  August: [
    { crop: "Rice", season: "Kharif (Monsoon)", stage: "Tillering / Panicle Initiation", advisory: "Maintain water level. Apply second dose of Nitrogen.", diseaseRisk: "Stem Borer / False Smut", prevention: "Install pheromone traps for stem borer. Spray copper hydroxide for False Smut.", severity: "High" },
    { crop: "Soybean", season: "Kharif (Monsoon)", stage: "Flowering / Podding", advisory: "Provide adequate drainage. Check for leaf folder caterpillars.", diseaseRisk: "Rust / Yellow Mosaic Virus", prevention: "Spray propiconazole for rust. Remove virus-infected plants immediately.", severity: "Medium" }
  ],
  September: [
    { crop: "Rice", season: "Kharif (Monsoon)", stage: "Flowering / Grain Filling", advisory: "Keep soil saturated but avoid deep flooding. Check for Brown Plant Hopper.", diseaseRisk: "Bacterial Leaf Blight / Sheath Blight", prevention: "Spray streptocycline mixed with copper oxychloride if leaf tips yellow.", severity: "High" },
    { crop: "Corn", season: "Kharif (Monsoon)", stage: "Maturity / Harvest", advisory: "Harvest when husks turn papery thin and dry. Dry the ears before storage.", diseaseRisk: "Cob Rot", prevention: "Store in well-ventilated dry granaries. Keep moisture under 14%.", severity: "Low" }
  ],
  October: [
    { crop: "Wheat", season: "Rabi (Winter)", stage: "Land Preparation / Sowing", advisory: "Prepare a fine seedbed. Treat seeds with Carboxin before sowing.", diseaseRisk: "Loose Smut", prevention: "Solar treatment of seeds or seed dressing with Vitavax.", severity: "Medium" },
    { crop: "Potato", season: "Rabi (Winter)", stage: "Planting", advisory: "Choose certified seed tubers. Maintain proper row and plant spacing.", diseaseRisk: "Late Blight / Black Scurf", prevention: "Treat tubers with boric acid before planting.", severity: "High" }
  ],
  November: [
    { crop: "Wheat", season: "Rabi (Winter)", stage: "Emergence / Crown Root Initiation", advisory: "First irrigation at 21 days is critical. Apply first top-dressing of Urea.", diseaseRisk: "Foot Rot / Seedling Wilt", prevention: "Ensure light irrigation. Avoid flooding fields at CRI stage.", severity: "Low" },
    { crop: "Mustard", season: "Rabi (Winter)", stage: "Vegetative / Flowering", advisory: "Thin out excess seedlings. Irrigate at flowering stage.", diseaseRisk: "Downy Mildew", prevention: "Dust sulfur or spray metalaxyl if white spots appear on leaf undersides.", severity: "Medium" }
  ],
  December: [
    { crop: "Wheat", season: "Rabi (Winter)", stage: "Tillering", advisory: "Perform hand weeding or apply selective herbicide. Keep soil moist.", diseaseRisk: "Yellow Rust", prevention: "Monitor border rows for yellow patches. Spray tebuconazole if found.", severity: "High" },
    { crop: "Chilli", season: "Rabi (Winter)", stage: "Fruiting / Harvesting", advisory: "Harvest ripe red chillies periodically. Irrigate during cold spells to prevent frost.", diseaseRisk: "Powdery Mildew / Fruit Rot", prevention: "Spray wettable sulfur or dinocap to protect fruits.", severity: "Medium" }
  ]
};

const RECOMMENDED_CROPS: Record<string, string[]> = {
  January: ["Wheat", "Mustard", "Potato", "Barley", "Spinach"],
  February: ["Sunflower", "Cucumber", "Melon", "Okra", "Bitter Gourd"],
  March: ["Chilli", "Tomato", "Okra", "Cowpea", "Bitter Gourd"],
  April: ["Sugarcane", "Corn", "Cotton", "Watermelon", "Cucumber"],
  May: ["Cotton", "Groundnut", "Pigeon Pea", "Soybean", "Turmeric"],
  June: ["Rice", "Corn", "Soybean", "Groundnut", "Pigeon Pea"],
  July: ["Rice", "Tomato", "Chilli", "Soybean", "Okra", "Corn"],
  August: ["Cauliflower", "Rice", "Soybean", "Carrot", "Radish"],
  September: ["Onion", "Garlic", "Mustard", "Cabbage", "Potato"],
  October: ["Wheat", "Potato", "Mustard", "Chickpea", "Barley"],
  November: ["Wheat", "Onion", "Spinach", "Fenugreek", "Mustard"],
  December: ["Tomato", "Chilli", "Coriander", "Cumin", "Wheat"]
};

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function CropCalendarPage() {
  const { t } = useApp();
  const [selectedMonth, setSelectedMonth] = useState<string>("July");
  const [filterCrop, setFilterCrop] = useState<string>("");

  useEffect(() => {
    // Set current month on mount
    const currentMonthName = new Date().toLocaleString("en-US", { month: "long" });
    if (MONTHS.includes(currentMonthName)) {
      setSelectedMonth(currentMonthName);
    }
  }, []);

  const monthAdvisories = CALENDAR_DATA[selectedMonth] || [];
  
  const filteredAdvisories = filterCrop
    ? monthAdvisories.filter(a => a.crop.toLowerCase().includes(filterCrop.toLowerCase()))
    : monthAdvisories;

  const currentSeason = selectedMonth === "June" || selectedMonth === "July" || selectedMonth === "August" || selectedMonth === "September"
    ? "Kharif (Monsoon)"
    : selectedMonth === "October" || selectedMonth === "November" || selectedMonth === "December" || selectedMonth === "January" || selectedMonth === "February"
    ? "Rabi (Winter)"
    : "Zaid (Summer)";

  return (
    <div className="page-container" style={{ maxWidth: "1200px", margin: "0 auto" }}>
      {/* Page Header */}
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 className="page-title">📅 {t("Crop Advisory Calendar")}</h1>
          <p className="page-subtitle">{t("Seasonal advisories, crop stage guidelines, and proactive disease warnings.")}</p>
        </div>

        {/* Season Indicator Badge */}
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <span className="badge badge-info" style={{ padding: "0.5rem 1rem", fontSize: "0.75rem" }}>
            🌾 {t(currentSeason)} Season
          </span>
        </div>
      </div>

      {/* Month Navigation Tabs */}
      <div className="card" style={{ padding: "0.75rem", marginBottom: "1.5rem", overflowX: "auto" }}>
        <div style={{ display: "flex", gap: "0.375rem" }}>
          {MONTHS.map((month) => (
            <button
              key={month}
              onClick={() => setSelectedMonth(month)}
              className={`btn ${selectedMonth === month ? "btn-primary" : "btn-ghost"}`}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "var(--radius-md)",
                fontSize: "0.8125rem",
                whiteSpace: "nowrap",
                backgroundColor: selectedMonth === month ? "var(--color-primary)" : "transparent",
                color: selectedMonth === month ? "white" : "var(--color-text-secondary)",
              }}
            >
              {t(month)}
            </button>
          ))}
        </div>
      </div>

      {/* Recommended Crops to Sow/Plant Card */}
      <div className="card" style={{ padding: "1.25rem", marginBottom: "1.5rem", background: "var(--color-bg-secondary)", borderLeft: "4px solid var(--color-primary)" }}>
        <h3 style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--color-primary-dark)", marginBottom: "0.5rem" }}>
          🌱 {t("Recommended Crops to Sow / Plant in")} {t(selectedMonth)}:
        </h3>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
          {(RECOMMENDED_CROPS[selectedMonth] || []).map((crop) => (
            <span
              key={crop}
              style={{
                padding: "0.375rem 0.75rem",
                borderRadius: "var(--radius-md)",
                background: "white",
                color: "var(--color-text-secondary)",
                fontSize: "0.8125rem",
                fontWeight: 600,
                border: "1px solid var(--color-border)",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.375rem",
                boxShadow: "var(--shadow-xs)"
              }}
            >
              <span>{crop === "Rice" ? "🌾" : crop === "Wheat" ? "🌾" : crop === "Tomato" ? "🍅" : crop === "Potato" ? "🥔" : crop === "Chilli" ? "🌶️" : "🌱"}</span>
              {t(crop)}
            </span>
          ))}
        </div>
      </div>

      {/* Alert Warning Box for Season-Specific Emergencies */}
      {currentSeason === "Kharif (Monsoon)" && (
        <div
          style={{
            background: "#fee2e2",
            border: "1px solid #fecaca",
            color: "#991b1b",
            borderRadius: "var(--radius-lg)",
            padding: "1rem 1.25rem",
            marginBottom: "1.5rem",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
          }}
        >
          <span style={{ fontSize: "1.5rem" }}>⚠️</span>
          <div>
            <strong style={{ display: "block", fontSize: "0.875rem" }}>{t("Monsoon Disease Advisory Alert!")}</strong>
            <span style={{ fontSize: "0.8125rem", opacity: 0.9 }}>
              {t("High humidity and rainfall increase risk of Rice Blast, Late Blight in Tomato, and Root Rot. Ensure clearing of drainage systems immediately.")}
            </span>
          </div>
        </div>
      )}

      {/* Filters & Actions */}
      <div
        className="filter-bar"
        style={{
          background: "var(--color-bg-card)",
          padding: "1rem",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--color-border-light)",
          marginBottom: "1.5rem",
          display: "flex",
          gap: "1rem",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flex: 1 }}>
          <span style={{ fontSize: "0.8125rem", fontWeight: 600 }}>{t("Filter Crop:")}</span>
          <select
            value={filterCrop}
            onChange={(e) => setFilterCrop(e.target.value)}
            className="select"
            style={{ maxWidth: "200px", padding: "0.375rem 0.75rem" }}
          >
            <option value="">{t("All crops")}</option>
            {["Wheat", "Rice", "Tomato", "Corn", "Potato", "Cotton", "Sugarcane", "Soybean", "Mustard", "Chilli"].map(c => (
              <option key={c} value={c}>{t(c)}</option>
            ))}
          </select>
        </div>
        <div style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
          {t("Showing")} {filteredAdvisories.length} {t("advisories")}
        </div>
      </div>

      {/* Advisory Grid */}
      {filteredAdvisories.length === 0 ? (
        <div className="card" style={{ padding: "3rem 1.5rem", textAlign: "center" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>🌾</div>
          <p style={{ color: "var(--color-text-muted)" }}>{t("No seasonal advisories found for the selected filter.")}</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: "1.25rem" }}>
          {filteredAdvisories.map((adv, idx) => (
            <div key={idx} className="card" style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.875rem" }}>
              {/* Card Title Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ fontSize: "1.25rem" }}>
                    {adv.crop === "Rice" ? "🌾" : adv.crop === "Wheat" ? "🌾" : adv.crop === "Tomato" ? "🍅" : adv.crop === "Potato" ? "🥔" : "🌱"}
                  </span>
                  <strong style={{ fontSize: "1.125rem", color: "var(--color-primary-dark)" }}>{t(adv.crop)}</strong>
                </div>
                <span className={`badge ${adv.severity === "High" ? "badge-high" : adv.severity === "Medium" ? "badge-medium" : "badge-low"}`}>
                  {t(adv.severity)} {t("Risk")}
                </span>
              </div>

              {/* Stage & Season Info */}
              <div style={{ display: "flex", gap: "1rem", fontSize: "0.75rem", borderBottom: "1px solid var(--color-border-light)", paddingBottom: "0.5rem" }}>
                <div>
                  <span style={{ color: "var(--color-text-muted)" }}>{t("Growth Stage:")} </span>
                  <strong style={{ color: "var(--color-text-secondary)" }}>{t(adv.stage)}</strong>
                </div>
              </div>

              {/* Advisory Details */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.8125rem" }}>
                <div>
                  <span style={{ fontWeight: 600, color: "var(--color-text)", display: "block" }}>📢 {t("Agricultural Advisory:")}</span>
                  <p style={{ color: "var(--color-text-secondary)", marginTop: "0.125rem" }}>{t(adv.advisory)}</p>
                </div>

                <div style={{ marginTop: "0.25rem", background: "var(--color-bg-secondary)", padding: "0.625rem", borderRadius: "var(--radius-sm)" }}>
                  <span style={{ fontWeight: 600, color: "var(--color-danger)", display: "block" }}>🦠 {t("High Risk Disease:")} {t(adv.diseaseRisk)}</span>
                  <span style={{ fontWeight: 600, color: "var(--color-primary-dark)", display: "block", marginTop: "0.375rem" }}>🛡️ {t("Prevention / Control:")}</span>
                  <p style={{ color: "var(--color-text-secondary)", marginTop: "0.125rem" }}>{t(adv.prevention)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
