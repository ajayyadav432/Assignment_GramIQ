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

  if (user && user.role === "AGRONOMIST") {
    navItems.push({ href: "/agronomist", label: "Agronomist Portal", icon: "👨‍🌾" });
  }

  return (
    <nav className="nav">
      <div
        className="nav-mobile-wrap"
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "0 1.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: "64px",
        }}
      >
        {/* Logo */}
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            textDecoration: "none",
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: "1.375rem" }}>🌾</span>
          <span
            style={{
              fontSize: "1rem",
              fontWeight: 700,
              color: "var(--color-primary-dark)",
              letterSpacing: "-0.025em",
              whiteSpace: "nowrap",
            }}
          >
            Krishi Clinic
          </span>
          <span
            style={{
              fontSize: "0.625rem",
              fontWeight: 600,
              color: "var(--color-text-muted)",
              background: "var(--color-bg-secondary)",
              padding: "0.125rem 0.4rem",
              borderRadius: "9999px",
              border: "1px solid var(--color-border-light)",
              flexShrink: 0,
            }}
          >
            LITE
          </span>
        </Link>

        {/* Right-side controls: language + user */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
          {/* Language Selector */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
            <span style={{ fontSize: "0.875rem" }}>🌐</span>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              style={{
                fontSize: "0.75rem",
                fontWeight: 600,
                padding: "0.25rem 0.375rem",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--color-border)",
                background: "var(--color-bg)",
                cursor: "pointer",
                outline: "none",
                maxWidth: "90px",
              }}
            >
              <option value="en">EN</option>
              <option value="hi">हिंदी</option>
              <option value="te">తెలుగు</option>
              <option value="mr">मराठी</option>
              <option value="es">ES</option>
            </select>
          </div>

          {/* User info + Logout */}
          {user && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 700, lineHeight: 1.2 }}>
                  {user.username}
                </span>
                <span
                  style={{
                    fontSize: "0.5625rem",
                    fontWeight: 600,
                    color: "white",
                    background:
                      user.role === "AGRONOMIST"
                        ? "#0f766e"
                        : user.role === "ADMIN"
                        ? "#7c3aed"
                        : "#0284c7",
                    padding: "0.0625rem 0.3rem",
                    borderRadius: "3px",
                    textTransform: "lowercase",
                  }}
                >
                  {user.role}
                </span>
              </div>
              <button
                onClick={logout}
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  color: "#b91c1c",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "0.25rem",
                  whiteSpace: "nowrap",
                }}
              >
                {t("Logout")}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Nav links row — scrollable on mobile */}
      {user && (
        <div
          className="nav-links-mobile"
          style={{
            maxWidth: "1280px",
            margin: "0 auto",
            padding: "0 1rem 0.5rem",
            display: "flex",
            gap: "0.25rem",
            borderTop: "1px solid var(--color-border-light)",
          }}
        >
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
                style={{ whiteSpace: "nowrap", fontSize: "0.8125rem" }}
              >
                <span style={{ marginRight: "0.25rem" }}>{item.icon}</span>
                {t(item.label)}
              </Link>
            );
          })}
        </div>
      )}
    </nav>
  );
}
