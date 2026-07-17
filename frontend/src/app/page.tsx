import UploadForm from "@/components/UploadForm";

export default function HomePage() {
  return (
    <div className="page-container">
      <div style={{ maxWidth: "640px", margin: "0 auto" }}>
        {/* Page Header */}
        <div className="page-header" style={{ textAlign: "center" }}>
          <h1 className="page-title">
            🌱 Crop Disease Diagnosis
          </h1>
          <p className="page-subtitle">
            Upload a photo of your crop and our AI will analyze it for potential
            diseases, providing severity assessment and treatment recommendations.
          </p>
        </div>

        {/* Upload Card */}
        <div className="card" style={{ padding: "2rem" }}>
          <UploadForm />
        </div>

        {/* Info Footer */}
        <div
          style={{
            marginTop: "1.5rem",
            display: "flex",
            gap: "1.5rem",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          {[
            { icon: "🔒", text: "Secure file handling" },
            { icon: "⚡", text: "Instant AI analysis" },
            { icon: "🌾", text: "8+ crop types" },
          ].map((item) => (
            <div
              key={item.text}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.375rem",
                fontSize: "0.8125rem",
                color: "var(--color-text-muted)",
              }}
            >
              <span>{item.icon}</span>
              {item.text}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
