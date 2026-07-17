"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Upload", icon: "📤" },
  { href: "/history", label: "History", icon: "📋" },
  { href: "/analytics", label: "Analytics", icon: "📊" },
];

export default function Navbar() {
  const pathname = usePathname();

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

        {/* Navigation Links */}
        <div style={{ display: "flex", gap: "0.25rem" }}>
          {NAV_ITEMS.map((item) => {
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
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
