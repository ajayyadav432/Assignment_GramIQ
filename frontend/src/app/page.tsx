"use client";

import UploadForm from "@/components/UploadForm";
import AuthPage from "@/components/AuthPage";
import { useApp } from "@/context/AppContext";

export default function HomePage() {
  const { user, isInitialized, t } = useApp();

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

  return (
    <div className="page-container">
      <div style={{ maxWidth: "640px", margin: "0 auto" }}>
        {/* Page Header */}
        <div className="page-header" style={{ textAlign: "center" }}>
          <h1 className="page-title">
            {t("Crop Disease Diagnosis")}
          </h1>
          <p className="page-subtitle">
            {t("Upload a photo of your crop and our AI will analyze it for potential diseases, providing severity assessment and treatment recommendations.")}
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
            { icon: "🔒", text: t("Secure file handling") },
            { icon: "⚡", text: t("Instant AI analysis") },
            { icon: "🌾", text: t("8+ crop types") },
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
