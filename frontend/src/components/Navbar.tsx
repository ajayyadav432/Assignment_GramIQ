"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "@/context/AppContext";

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout, language, setLanguage, t } = useApp();

  const navItems = [
    { href: "/", label: "Upload", icon: "📤" },
    { href: "/history", label: "History", icon: "📋" },
    { href: "/analytics", label: "Analytics", icon: "📊" },
  ];

  // If user is Agronomist, add portal link
  if (user && user.role === "AGRONOMIST") {
    navItems.push({ href: "/agronomist", label: "Agronomist Portal", icon: "👨‍🌾" });
  }

  return (
    <nav className="nav">
      <div
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "0 1.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: "64px",
          flexWrap: "wrap",
        }}
      >
        {/* Logo */}
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.625rem",
            textDecoration: "none",
          }}
        >
          <span style={{ fontSize: "1.5rem" }}>🌾</span>
          <span
            style={{
              fontSize: "1.125rem",
              fontWeight: 700,
              color: "var(--color-primary-dark)",
              letterSpacing: "-0.025em",
            }}
          >
            Krishi Clinic
          </span>
          <span
            style={{
              fontSize: "0.6875rem",
              fontWeight: 600,
              color: "var(--color-text-muted)",
              background: "var(--color-bg-secondary)",
              padding: "0.125rem 0.5rem",
              borderRadius: "9999px",
              border: "1px solid var(--color-border-light)",
            }}
          >
            LITE
          </span>
        </Link>

        {/* Navigation & Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
          {user && (
            <div style={{ display: "flex", gap: "0.25rem" }}>
              {navItems.map((item) => {
                const isActive =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`nav-link ${isActive ? "nav-link-active" : ""}`}
                  >
                    <span style={{ marginRight: "0.375rem" }}>{item.icon}</span>
                    {t(item.label)}
                  </Link>
                );
              })}
            </div>
          )}

          {/* Language Selector */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
            <span style={{ fontSize: "0.875rem" }}>🌐</span>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              style={{
                fontSize: "0.8125rem",
                fontWeight: 600,
                padding: "0.25rem 0.5rem",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--color-border)",
                background: "var(--color-bg)",
                cursor: "pointer",
                outline: "none",
              }}
            >
              <option value="en">English</option>
              <option value="hi">हिंदी (Hindi)</option>
              <option value="te">తెలుగు (Telugu)</option>
              <option value="mr">मराठी (Marathi)</option>
              <option value="es">Español (Spanish)</option>
            </select>
          </div>

          {/* User Profile / Logout */}
          {user && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                <span style={{ fontSize: "0.8125rem", fontWeight: 700 }}>
                  {user.username}
                </span>
                <span
                  style={{
                    fontSize: "0.625rem",
                    fontWeight: 600,
                    color: "white",
                    background: user.role === "AGRONOMIST" ? "#0f766e" : "#0284c7",
                    padding: "0.0625rem 0.375rem",
                    borderRadius: "4px",
                    textTransform: "lowercase",
                  }}
                >
                  {user.role}
                </span>
              </div>
              <button
                onClick={logout}
                style={{
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  color: "#b91c1c",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "0.25rem 0.5rem",
                }}
              >
                {t("Logout")}
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
