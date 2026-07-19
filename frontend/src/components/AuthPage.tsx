"use client";

import { useState } from "react";
import { loginUser, registerUser } from "@/lib/api";
import { useApp } from "@/context/AppContext";

export default function AuthPage() {
  const { login, t } = useApp();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("FARMER");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (isLogin) {
        const data = await loginUser({ username, password });
        login(data.access_token);
      } else {
        await registerUser({ username, password, role });
        setSuccess(t("Successfully registered! Please log in."));
        setIsLogin(true);
        setPassword("");
      }
    } catch (err: any) {
      console.error(err);
      setError(
        err.detail?.detail?.message || 
        err.detail?.message || 
        "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = (userType: "farmer" | "agronomist") => {
    setUsername(userType);
    setPassword("password123");
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "calc(100vh - 120px)",
        padding: "1rem",
      }}
    >
      <div
        className="card animate-fade-in"
        style={{
          width: "100%",
          maxWidth: "420px",
          padding: "2.5rem",
          boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
          border: "1px solid var(--color-border-light)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <span style={{ fontSize: "3rem" }}>🌱</span>
          <h2 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--color-primary-dark)", marginTop: "1rem" }}>
            Krishi Clinic Lite
          </h2>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem", marginTop: "0.5rem" }}>
            {t("Please log in to use Krishi Clinic.")}
          </p>
        </div>

        {error && (
          <div
            style={{
              background: "#fee2e2",
              color: "#991b1b",
              padding: "0.75rem",
              borderRadius: "var(--radius-sm)",
              fontSize: "0.875rem",
              marginBottom: "1.25rem",
              border: "1px solid #fca5a5",
            }}
          >
            ⚠️ {error}
          </div>
        )}

        {success && (
          <div
            style={{
              background: "#dcfce7",
              color: "#166534",
              padding: "0.75rem",
              borderRadius: "var(--radius-sm)",
              fontSize: "0.875rem",
              marginBottom: "1.25rem",
              border: "1px solid #86efac",
            }}
          >
            ✅ {success}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div>
            <label
              style={{
                display: "block",
                fontSize: "0.8125rem",
                fontWeight: 600,
                color: "var(--color-text-secondary)",
                marginBottom: "0.375rem",
              }}
            >
              {t("Username")}
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. farmer_john"
              style={{
                width: "100%",
                padding: "0.75rem",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--color-border)",
                fontSize: "0.9375rem",
                outline: "none",
                background: "var(--color-bg)",
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontSize: "0.8125rem",
                fontWeight: 600,
                color: "var(--color-text-secondary)",
                marginBottom: "0.375rem",
              }}
            >
              {t("Password")}
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                width: "100%",
                padding: "0.75rem",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--color-border)",
                fontSize: "0.9375rem",
                outline: "none",
                background: "var(--color-bg)",
              }}
            />
          </div>

          {!isLogin && (
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  color: "var(--color-text-secondary)",
                  marginBottom: "0.375rem",
                }}
              >
                {t("Select Role")}
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--color-border)",
                  fontSize: "0.9375rem",
                  outline: "none",
                  background: "var(--color-bg)",
                }}
              >
                <option value="FARMER">{t("Farmer Profile")}</option>
                <option value="AGRONOMIST">{t("Agronomist Profile")}</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{
              padding: "0.875rem",
              fontWeight: 600,
              fontSize: "0.9375rem",
              marginTop: "0.5rem",
              width: "100%",
              justifyContent: "center",
            }}
          >
            {loading ? t("Analyzing...") : isLogin ? t("Login") : t("Register")}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
          <button
            onClick={() => setIsLogin(!isLogin)}
            style={{
              background: "none",
              border: "none",
              color: "var(--color-primary)",
              fontSize: "0.875rem",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            {isLogin ? t("Don't have an account? Register") : t("Already have an account? Login")}
          </button>
        </div>

        {/* Demo Credentials Alert Panel */}
        <div
          style={{
            marginTop: "2rem",
            padding: "1rem",
            background: "var(--color-bg-secondary)",
            borderRadius: "var(--radius-md)",
            border: "1px dashed var(--color-border)",
          }}
        >
          <div style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--color-text)", marginBottom: "0.5rem" }}>
            🔑 {t("Login Credentials")} (Demo)
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>
                🧑‍🌾 <strong>Farmer:</strong> farmer / password123
              </span>
              <button
                onClick={() => handleFillDemo("farmer")}
                style={{
                  fontSize: "0.6875rem",
                  padding: "0.125rem 0.375rem",
                  borderRadius: "var(--radius-sm)",
                  background: "var(--color-primary)",
                  color: "white",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Auto-fill
              </button>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>
                👨‍🌾 <strong>Agronomist:</strong> agronomist / password123
              </span>
              <button
                onClick={() => handleFillDemo("agronomist")}
                style={{
                  fontSize: "0.6875rem",
                  padding: "0.125rem 0.375rem",
                  borderRadius: "var(--radius-sm)",
                  background: "var(--color-primary)",
                  color: "white",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Auto-fill
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
