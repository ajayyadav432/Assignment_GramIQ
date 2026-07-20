"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "@/context/AppContext";

const NAV_ITEMS = [
  { href: "/",          icon: "🏠", label: "Dashboard" },
  { href: "/history",   icon: "📋", label: "My Reports" },
  { href: "/analytics", icon: "📊", label: "Analytics" },
];

const AGRO_ITEMS = [
  { href: "/agronomist", icon: "👨‍🌾", label: "Agro Portal" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout, language, setLanguage, t } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close sidebar when route changes on mobile
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const navLinks = [
    ...NAV_ITEMS,
    ...(user?.role === "AGRONOMIST" || user?.role === "ADMIN" ? AGRO_ITEMS : []),
  ];

  const SidebarContent = () => (
    <>
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="sidebar-brand-name">
          <div className="sidebar-brand-icon">🌾</div>
          Krishi Clinic
        </div>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        <span className="sidebar-nav-label">Navigation</span>
        {navLinks.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`sidebar-link ${isActive(item.href) ? "active" : ""}`}
          >
            <span className="sidebar-icon">{item.icon}</span>
            {t(item.label)}
          </Link>
        ))}
      </nav>

      {/* Footer: language + user */}
      {user && (
        <div className="sidebar-footer">
          {/* Language */}
          <div style={{ padding: "0.25rem 0.5rem 0.5rem" }}>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="lang-select"
              style={{ width: "100%" }}
            >
              <option value="en">🌐 English</option>
              <option value="hi">🇮🇳 हिंदी</option>
              <option value="te">🇮🇳 తెలుగు</option>
              <option value="mr">🇮🇳 मराठी</option>
              <option value="es">🇪🇸 Español</option>
            </select>
          </div>

          {/* User */}
          <div className="sidebar-user">
            <div className="sidebar-avatar">
              {user.username?.[0]?.toUpperCase() ?? "U"}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="sidebar-user-name" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user.username}
              </div>
              <div className="sidebar-user-role">{user.role.toLowerCase()}</div>
            </div>
            <button
              onClick={logout}
              title="Logout"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: "1rem",
                color: "var(--color-text-muted)",
                padding: "0.25rem",
                borderRadius: "6px",
                flexShrink: 0,
              }}
            >
              🚪
            </button>
          </div>
        </div>
      )}
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className={`app-sidebar`}>
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      <div
        className={`sidebar-overlay ${mobileOpen ? "mobile-open" : ""}`}
        onClick={() => setMobileOpen(false)}
      />

      {/* Mobile drawer */}
      <aside className={`app-sidebar ${mobileOpen ? "mobile-open" : ""}`} style={{ display: "flex" }}>
        <SidebarContent />
      </aside>

      {/* Mobile top bar */}
      <div
        className="topbar"
        style={{ display: "flex", position: "fixed", top: 0, left: 0, right: 0, zIndex: 35 }}
      >
        <button
          className="mobile-menu-btn"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Open menu"
        >
          ☰
        </button>
        <span className="topbar-title" style={{ marginLeft: "0.5rem" }}>
          🌾 Krishi Clinic
        </span>
        <div className="topbar-controls">
          {user && (
            <div className="sidebar-avatar" style={{ width: 28, height: 28, fontSize: "0.75rem" }}>
              {user.username?.[0]?.toUpperCase() ?? "U"}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
