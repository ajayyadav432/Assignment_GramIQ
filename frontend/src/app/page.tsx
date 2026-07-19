"use client";

import { useState, useEffect, useCallback } from "react";
import { useApp } from "@/context/AppContext";
import AuthPage from "@/components/AuthPage";
import UploadForm from "@/components/UploadForm";
import {
  listPredictions,
  getComments,
  createComment,
  voteComment,
  downloadExport,
  downloadPdf,
  getImageUrl,
  CommentItem
} from "@/lib/api";
import { PredictionListItem, Prediction } from "@/lib/types";

export default function HomePage() {
  const { user, isInitialized, t } = useApp();
  const [activeTab, setActiveTab] = useState<"feed" | "admin">("feed");
  
  // Feed states
  const [predictions, setPredictions] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCrop, setSelectedCrop] = useState("");
  const [selectedSeverity, setSelectedSeverity] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  
  // Admin Panel states
  const [adminPredictions, setAdminPredictions] = useState<any[]>([]);
  const [adminTotal, setAdminTotal] = useState(0);
  const [adminPage, setAdminPage] = useState(1);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminSearch, setAdminSearch] = useState("");
  const [adminCrop, setAdminCrop] = useState("");
  const [exportLoading, setExportLoading] = useState(false);

  // Fetch Community Feed (Masked based on user role)
  const fetchFeed = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listPredictions({
        page,
        limit: 10,
        crop_type: selectedCrop || undefined,
        disease: searchQuery || undefined,
        status: selectedStatus || undefined,
      });
      
      // Client-side search filter for location/region
      let filtered = res.items;
      if (selectedLocation.trim()) {
        filtered = filtered.filter((p: any) => 
          p.location && p.location.toLowerCase().includes(selectedLocation.toLowerCase())
        );
      }

      setPredictions(filtered);
      setTotalCount(res.total);
    } catch (e) {
      console.error("Failed to fetch feed predictions", e);
    } finally {
      setLoading(false);
    }
  }, [page, selectedCrop, searchQuery, selectedStatus, selectedLocation]);

  // Fetch Admin BioBank (Unmasked predictions list)
  const fetchAdminData = useCallback(async () => {
    if (user?.role !== "ADMIN" && user?.role !== "AGRONOMIST") return;
    setAdminLoading(true);
    try {
      const res = await listPredictions({
        page: adminPage,
        limit: 20,
        crop_type: adminCrop || undefined,
        disease: adminSearch || undefined,
      });
      setAdminPredictions(res.items);
      setAdminTotal(res.total);
    } catch (e) {
      console.error("Failed to fetch admin predictions", e);
    } finally {
      setAdminLoading(false);
    }
  }, [adminPage, adminCrop, adminSearch, user]);

  useEffect(() => {
    if (user) {
      fetchFeed();
    }
  }, [fetchFeed, user]);

  useEffect(() => {
    if (user && activeTab === "admin") {
      fetchAdminData();
    }
  }, [fetchAdminData, activeTab, user]);

  const handleExport = async (format: string) => {
    setExportLoading(true);
    try {
      await downloadExport(format, {
        crop_type: adminCrop || undefined,
        disease: adminSearch || undefined,
      });
    } catch (e) {
      alert("Failed to export database: " + e);
    } finally {
      setExportLoading(false);
    }
  };

  const handleCreatePostSuccess = () => {
    setShowUploadModal(false);
    setPage(1);
    fetchFeed();
  };

  if (!isInitialized) {
    return (
      <div className="page-container" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh" }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <div className="page-container" style={{ maxWidth: "1200px", margin: "0 auto", padding: "1rem" }}>
      {/* Top Banner & Tab Navigation */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2rem",
          background: "var(--color-bg-card)",
          padding: "1rem 1.5rem",
          borderRadius: "var(--radius-lg)",
          boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
          border: "1px solid var(--color-border-light)",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--color-primary-dark)", margin: 0 }}>
            🌾 Krishi Clinic Lite
          </h1>
          <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", margin: "0.25rem 0 0 0" }}>
            {t("Empowering farmers with AI diagnostics and agronomist verification.")}
          </p>
        </div>

        {/* Tab Toggle */}
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            onClick={() => setActiveTab("feed")}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "var(--radius-md)",
              border: "none",
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: "pointer",
              backgroundColor: activeTab === "feed" ? "var(--color-primary)" : "transparent",
              color: activeTab === "feed" ? "white" : "var(--color-text-secondary)",
              transition: "all 0.2s ease",
            }}
          >
            💬 {t("Community Feed")}
          </button>

          {(user.role === "ADMIN" || user.role === "AGRONOMIST") && (
            <button
              onClick={() => setActiveTab("admin")}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "var(--radius-md)",
                border: "none",
                fontSize: "0.875rem",
                fontWeight: 600,
                cursor: "pointer",
                backgroundColor: activeTab === "admin" ? "var(--color-primary)" : "transparent",
                color: activeTab === "admin" ? "white" : "var(--color-text-secondary)",
                transition: "all 0.2s ease",
              }}
            >
              🛠️ {user.role === "ADMIN" ? t("Admin Bio Bank") : t("Agronomist DB")}
            </button>
          )}
        </div>
      </div>

      {activeTab === "feed" ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "2rem" }}>
          
          {/* Main Feed Column */}
          <div>
            
            {/* Reddit-style Create Post Bar */}
            <div
              onClick={() => setShowUploadModal(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "1rem",
                background: "var(--color-bg-card)",
                padding: "1rem",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--color-border-light)",
                boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
                cursor: "pointer",
                marginBottom: "1.5rem",
                transition: "transform 0.2s ease, border-color 0.2s ease",
              }}
              className="create-post-bar"
            >
              <span style={{ fontSize: "1.5rem" }}>🧑‍🌾</span>
              <input
                type="text"
                readOnly
                placeholder={t("Got a crop disease query? Post a query and get AI & expert advice...")}
                style={{
                  flex: 1,
                  padding: "0.75rem",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--color-border)",
                  background: "var(--color-bg)",
                  cursor: "pointer",
                  fontSize: "0.875rem",
                  outline: "none",
                }}
              />
              <button
                className="btn btn-primary"
                style={{ whiteSpace: "nowrap", padding: "0.625rem 1.25rem" }}
              >
                ➕ {t("New Query")}
              </button>
            </div>

            {/* Filter controls */}
            <div
              style={{
                background: "var(--color-bg-card)",
                padding: "1rem",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--color-border-light)",
                marginBottom: "1.5rem",
                display: "flex",
                flexWrap: "wrap",
                gap: "0.75rem",
                alignItems: "center",
              }}
            >
              {/* Search */}
              <input
                type="text"
                placeholder={t("Search by disease...")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  padding: "0.5rem 0.75rem",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--color-border)",
                  fontSize: "0.875rem",
                  minWidth: "160px",
                  background: "var(--color-bg)",
                }}
              />

              {/* Crop Filter */}
              <select
                value={selectedCrop}
                onChange={(e) => setSelectedCrop(e.target.value)}
                style={{
                  padding: "0.5rem 0.75rem",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--color-border)",
                  fontSize: "0.875rem",
                  background: "var(--color-bg)",
                }}
              >
                <option value="">{t("All crops")}</option>
                {["Wheat", "Rice", "Tomato", "Corn", "Potato", "Cotton", "Sugarcane", "Soybean", "Mustard", "Groundnut", "Chilli"].map((crop) => (
                  <option key={crop} value={crop}>{t(crop)}</option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                style={{
                  padding: "0.5rem 0.75rem",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--color-border)",
                  fontSize: "0.875rem",
                  background: "var(--color-bg)",
                }}
              >
                <option value="">{t("All status")}</option>
                <option value="PENDING_REVIEW">{t("Pending Review")}</option>
                <option value="REVIEWED">{t("Verified Only")}</option>
              </select>

              {/* Region/Location filter */}
              <input
                type="text"
                placeholder={t("Filter by Location")}
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                style={{
                  padding: "0.5rem 0.75rem",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--color-border)",
                  fontSize: "0.875rem",
                  background: "var(--color-bg)",
                }}
              />

              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCrop("");
                  setSelectedStatus("");
                  setSelectedLocation("");
                }}
                style={{
                  padding: "0.5rem 1rem",
                  borderRadius: "var(--radius-sm)",
                  border: "none",
                  background: "var(--color-bg-secondary)",
                  color: "var(--color-text)",
                  fontSize: "0.8125rem",
                  cursor: "pointer",
                }}
              >
                Reset
              </button>
            </div>

            {/* Posts Stream */}
            {loading ? (
              <div style={{ textAlign: "center", padding: "3rem" }}>
                <div className="spinner" style={{ margin: "0 auto" }} />
              </div>
            ) : predictions.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "4rem 2rem",
                  background: "var(--color-bg-card)",
                  borderRadius: "var(--radius-md)",
                  border: "1px dashed var(--color-border)",
                }}
              >
                <span style={{ fontSize: "3rem" }}>🔍</span>
                <h3 style={{ fontSize: "1.125rem", fontWeight: 700, marginTop: "1rem" }}>{t("No queries found")}</h3>
                <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem", marginTop: "0.5rem" }}>
                  {t("Try clearing your filters or upload a new disease observation query.")}
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                {predictions.map((p) => (
                  <PostCard key={p.id} post={p} userRole={user.role} />
                ))}

                {/* Pagination */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem" }}>
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                    className="btn btn-secondary"
                  >
                    ◀ {t("Previous")}
                  </button>
                  <span style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>
                    {t("Page")} {page}
                  </span>
                  <button
                    disabled={predictions.length < 10}
                    onClick={() => setPage(page + 1)}
                    className="btn btn-secondary"
                  >
                    {t("Next")} ▶
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar Column */}
          <div>
            <div
              style={{
                position: "sticky",
                top: "20px",
                display: "flex",
                flexDirection: "column",
                gap: "1.5rem",
              }}
            >
              {/* Community Rules card */}
              <div
                style={{
                  background: "var(--color-bg-card)",
                  padding: "1.5rem",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--color-border-light)",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.01)",
                }}
              >
                <h3 style={{ fontSize: "1rem", fontWeight: 700, margin: "0 0 0.75rem 0", color: "var(--color-primary-dark)" }}>
                  💡 {t("Krishi Community Guides")}
                </h3>
                <ul style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)", paddingLeft: "1.25rem", margin: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <li>{t("Upload clear, close-up photos of disease symptoms under good lighting.")}</li>
                  <li>{t("Include your farm region/location to help experts with weather/pest vectors correlation.")}</li>
                  <li>{t("Only certified agronomists get the verified expert badge ✅ for comments.")}</li>
                  <li>{t("Export PDF advisory cards for offline consultation on the farm.")}</li>
                </ul>
              </div>

              {/* Quick statistics card */}
              <div
                style={{
                  background: "var(--color-bg-card)",
                  padding: "1.5rem",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--color-border-light)",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.01)",
                }}
              >
                <h3 style={{ fontSize: "1rem", fontWeight: 700, margin: "0 0 0.75rem 0" }}>
                  📊 {t("Community Impact")}
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "0.5rem" }}>
                  <div style={{ background: "var(--color-bg)", padding: "0.75rem", borderRadius: "var(--radius-sm)", textAlign: "center" }}>
                    <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--color-primary)" }}>2,450+</div>
                    <div style={{ fontSize: "0.6875rem", color: "var(--color-text-muted)" }}>{t("Queries Resolved")}</div>
                  </div>
                  <div style={{ background: "var(--color-bg)", padding: "0.75rem", borderRadius: "var(--radius-sm)", textAlign: "center" }}>
                    <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--color-secondary)" }}>18</div>
                    <div style={{ fontSize: "0.6875rem", color: "var(--color-text-muted)" }}>{t("Active Agronomists")}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Admin Database Bio Bank view */
        <div
          style={{
            background: "var(--color-bg-card)",
            padding: "2rem",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--color-border-light)",
            boxShadow: "0 10px 30px rgba(0,0,0,0.03)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 800, margin: 0 }}>
                🗄️ {t("Bio Bank Database Audit Console")}
              </h2>
              <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", margin: "0.25rem 0 0 0" }}>
                {t("Review, audit, and bulk-export raw database snapshots.")}
              </p>
            </div>

            {/* Export Buttons */}
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                disabled={exportLoading}
                onClick={() => handleExport("csv")}
                className="btn btn-primary"
                style={{ fontSize: "0.8125rem", padding: "0.5rem 1rem" }}
              >
                📥 {t("Export CSV")}
              </button>
              <button
                disabled={exportLoading}
                onClick={() => handleExport("json")}
                className="btn btn-primary"
                style={{ fontSize: "0.8125rem", padding: "0.5rem 1rem", backgroundColor: "#3a86c8" }}
              >
                📥 {t("Export JSON")}
              </button>
              <button
                disabled={exportLoading}
                onClick={() => handleExport("xml")}
                className="btn btn-primary"
                style={{ fontSize: "0.8125rem", padding: "0.5rem 1rem", backgroundColor: "#df782f" }}
              >
                📥 {t("Export XML")}
              </button>
            </div>
          </div>

          {/* Admin filters */}
          <div
            style={{
              display: "flex",
              gap: "0.75rem",
              marginBottom: "1.5rem",
              background: "var(--color-bg)",
              padding: "0.75rem",
              borderRadius: "var(--radius-md)",
            }}
          >
            <input
              type="text"
              placeholder={t("Filter by disease")}
              value={adminSearch}
              onChange={(e) => setAdminSearch(e.target.value)}
              style={{
                padding: "0.5rem",
                fontSize: "0.8125rem",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--color-border)",
                background: "var(--color-bg-card)",
              }}
            />
            <select
              value={adminCrop}
              onChange={(e) => setAdminCrop(e.target.value)}
              style={{
                padding: "0.5rem",
                fontSize: "0.8125rem",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--color-border)",
                background: "var(--color-bg-card)",
              }}
            >
              <option value="">{t("All crops")}</option>
              {["Wheat", "Rice", "Tomato", "Corn", "Potato", "Cotton", "Sugarcane", "Soybean", "Mustard", "Groundnut", "Chilli"].map((crop) => (
                <option key={crop} value={crop}>{t(crop)}</option>
              ))}
            </select>
            <button
              onClick={() => {
                setAdminSearch("");
                setAdminCrop("");
              }}
              style={{
                padding: "0.5rem 1rem",
                fontSize: "0.8125rem",
                border: "none",
                borderRadius: "var(--radius-sm)",
                background: "var(--color-border-light)",
                cursor: "pointer",
              }}
            >
              Reset
            </button>
          </div>

          {/* Admin Table */}
          {adminLoading ? (
            <div style={{ textAlign: "center", padding: "3rem" }}>
              <div className="spinner" style={{ margin: "0 auto" }} />
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8125rem", textAlign: "left" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid var(--color-border)" }}>
                    <th style={{ padding: "0.75rem" }}>ID</th>
                    <th style={{ padding: "0.75rem" }}>Date</th>
                    <th style={{ padding: "0.75rem" }}>Crop</th>
                    <th style={{ padding: "0.75rem" }}>Disease</th>
                    <th style={{ padding: "0.75rem" }}>Severity</th>
                    <th style={{ padding: "0.75rem" }}>AI Provider</th>
                    <th style={{ padding: "0.75rem" }}>Status</th>
                    <th style={{ padding: "0.75rem" }}>Location</th>
                  </tr>
                </thead>
                <tbody>
                  {adminPredictions.map((item) => (
                    <tr key={item.id} style={{ borderBottom: "1px solid var(--color-border-light)" }}>
                      <td style={{ padding: "0.75rem", fontFamily: "monospace" }}>{item.id.slice(0, 8)}...</td>
                      <td style={{ padding: "0.75rem" }}>{new Date(item.created_at).toLocaleDateString()}</td>
                      <td style={{ padding: "0.75rem" }}>{t(item.crop_type)}</td>
                      <td style={{ padding: "0.75rem", fontWeight: 600 }}>{item.predicted_disease}</td>
                      <td style={{ padding: "0.75rem" }}>
                        <span
                          style={{
                            padding: "0.25rem 0.5rem",
                            borderRadius: "12px",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            backgroundColor: item.severity === "High" ? "#fee2e2" : item.severity === "Medium" ? "#fef3c7" : "#dcfce7",
                            color: item.severity === "High" ? "#991b1b" : item.severity === "Medium" ? "#92400e" : "#166534",
                          }}
                        >
                          {t(item.severity || "Low")}
                        </span>
                      </td>
                      <td style={{ padding: "0.75rem" }}>{item.ai_provider}</td>
                      <td style={{ padding: "0.75rem" }}>
                        <span
                          style={{
                            padding: "0.25rem 0.5rem",
                            borderRadius: "4px",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            backgroundColor: item.status === "REVIEWED" ? "#d1fae5" : "#ffedd5",
                            color: item.status === "REVIEWED" ? "#065f46" : "#9a3412",
                          }}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td style={{ padding: "0.75rem" }}>{item.location || "N/A"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Admin Pagination */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1.5rem" }}>
                <button
                  disabled={adminPage === 1}
                  onClick={() => setAdminPage(adminPage - 1)}
                  className="btn btn-secondary"
                  style={{ fontSize: "0.8125rem", padding: "0.375rem 0.75rem" }}
                >
                  ◀ Prev
                </button>
                <span style={{ fontSize: "0.8125rem" }}>
                  Page {adminPage}
                </span>
                <button
                  disabled={adminPredictions.length < 20}
                  onClick={() => setAdminPage(adminPage + 1)}
                  className="btn btn-secondary"
                  style={{ fontSize: "0.8125rem", padding: "0.375rem 0.75rem" }}
                >
                  Next ▶
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Upload Query Modal */}
      {showUploadModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setShowUploadModal(false)}
        >
          <div
            style={{
              background: "var(--color-bg-card)",
              padding: "2rem",
              borderRadius: "var(--radius-lg)",
              width: "100%",
              maxWidth: "520px",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 20px 50px rgba(0,0,0,0.15)",
              border: "1px solid var(--color-border-light)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 800, margin: 0 }}>
                🌱 {t("Create Observation Query")}
              </h2>
              <button
                onClick={() => setShowUploadModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "1.5rem",
                  cursor: "pointer",
                  color: "var(--color-text-muted)",
                }}
              >
                &times;
              </button>
            </div>
            
            {/* Embedded upload form */}
            <div onClick={(e) => e.stopPropagation()}>
              <UploadForm onSubmitSuccess={() => setShowUploadModal(false)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── PostCard Component (Reddit post look-alike) ──────────────────
function PostCard({ post, userRole }: { post: any; userRole: string }) {
  const { t } = useApp();
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [commentText, setCommentText] = useState("");
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  const fetchComments = async () => {
    setCommentsLoading(true);
    try {
      const data = await getComments(post.id);
      setComments(data);
    } catch (e) {
      console.error(e);
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleToggleComments = () => {
    const nextState = !showComments;
    setShowComments(nextState);
    if (nextState) {
      fetchComments();
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      const newComment = await createComment(post.id, commentText.trim());
      setComments((prev) => [...prev, newComment]);
      setCommentText("");
    } catch (e) {
      alert("Failed to submit comment");
    }
  };

  const handleVote = async (commentId: string, type: "upvote" | "downvote") => {
    try {
      const updated = await voteComment(commentId, type);
      setComments((prev) => prev.map((c) => (c.id === commentId ? updated : c)));
    } catch (e) {
      console.error(e);
    }
  };

  const handleDownloadPdf = async () => {
    setPdfLoading(true);
    try {
      await downloadPdf(post.id);
    } catch (e) {
      alert("Failed to download PDF advisory card: " + e);
    } finally {
      setPdfLoading(false);
    }
  };

  // Determine severity color coding
  const sevColor = post.severity === "High" ? "#fee2e2" : post.severity === "Medium" ? "#fef3c7" : "#dcfce7";
  const sevTextColor = post.severity === "High" ? "#991b1b" : post.severity === "Medium" ? "#92400e" : "#166534";

  return (
    <div
      style={{
        background: "var(--color-bg-card)",
        border: "1px solid var(--color-border-light)",
        borderRadius: "var(--radius-md)",
        padding: "1.5rem",
        boxShadow: "0 2px 12px rgba(0,0,0,0.01)",
        transition: "border-color 0.2s ease, box-shadow 0.2s ease",
      }}
      className="post-card"
    >
      {/* Header Info */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem", fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
          <span>🌾 <strong>{t(post.crop_type)}</strong></span>
          <span>•</span>
          <span>Posted on {new Date(post.created_at).toLocaleDateString()}</span>
          {post.location && (
            <>
              <span>•</span>
              <span style={{ color: "var(--color-primary-dark)" }}>📍 {post.location}</span>
            </>
          )}
        </div>

        {/* Severity badge */}
        <span
          style={{
            padding: "0.25rem 0.5rem",
            borderRadius: "12px",
            fontSize: "0.6875rem",
            fontWeight: 700,
            backgroundColor: sevColor,
            color: sevTextColor,
          }}
        >
          {t(post.severity || "Low")}
        </span>
      </div>

      {/* Main Grid: Info + Image */}
      <div style={{ display: "grid", gridTemplateColumns: post.image_filename ? "1fr 180px" : "1fr", gap: "1.5rem", marginBottom: "1rem" }}>
        
        {/* Info Column */}
        <div>
          <h2 style={{ fontSize: "1.125rem", fontWeight: 800, color: "var(--color-text)", margin: "0 0 0.5rem 0" }}>
            {t("Predicted Disease")}: <span style={{ color: "var(--color-primary)" }}>{t(post.predicted_disease)}</span>
            {post.confidence > 0 && ` (${(post.confidence * 100).toFixed(0)}%)`}
          </h2>

          <p style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)", margin: "0 0 1rem 0", lineHeight: 1.5 }}>
            <strong>{t("Farmer Observations")}:</strong> {post.farmer_notes || t("No notes provided.")}
          </p>

          {/* AI Possible Reasons (New customized detail field) */}
          {post.possible_reasons && post.possible_reasons !== "Pending Review" && (
            <div style={{ marginBottom: "1rem", background: "var(--color-bg)", padding: "0.75rem", borderRadius: "var(--radius-sm)", borderLeft: "3px solid #ffba08" }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#92400e", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.25rem" }}>
                🔍 {t("Possible Reasons")}
              </div>
              <p style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)", margin: 0 }}>
                {t(post.possible_reasons)}
              </p>
            </div>
          )}

          {/* Standard Treatment advisory */}
          {post.recommendation && (
            <div style={{ marginBottom: "1rem" }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.25rem" }}>
                💊 {t("AI Recommended Treatment")}
              </div>
              <p style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)", margin: 0, lineHeight: 1.4 }}>
                {t(post.recommendation)}
              </p>
            </div>
          )}

          {/* Verified Advisory Panel (if status === REVIEWED) */}
          {post.status === "REVIEWED" && (
            <div
              style={{
                marginTop: "1.25rem",
                padding: "1rem",
                background: "#e8f5e9",
                border: "1px solid #a5d6a7",
                borderRadius: "var(--radius-md)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                <span style={{ fontSize: "1.125rem" }}>👨‍⚕️</span>
                <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#1b5e20", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {t("Verified Agronomist Advisory")}
                </span>
                <span style={{ backgroundColor: "#2e7d32", color: "white", padding: "0.125rem 0.375rem", borderRadius: "4px", fontSize: "0.625rem", fontWeight: 700 }}>
                  VERIFIED
                </span>
              </div>
              <p style={{ fontSize: "0.875rem", color: "#1b5e20", margin: 0, fontWeight: 500, lineHeight: 1.4 }}>
                {t(post.recommendation)}
              </p>
            </div>
          )}
        </div>

        {/* Image Column */}
        {post.image_filename && (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "flex-start" }}>
            <img
              src={getImageUrl(post.image_filename)}
              alt="Crop disease"
              style={{
                width: "100%",
                maxHeight: "150px",
                objectFit: "cover",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--color-border-light)",
              }}
              onError={(e) => {
                // Remove image on error
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
        )}
      </div>

      {/* Action Footer Bar */}
      <div
        style={{
          display: "flex",
          gap: "1rem",
          alignItems: "center",
          borderTop: "1px solid var(--color-border-light)",
          paddingTop: "0.75rem",
          marginTop: "0.5rem",
        }}
      >
        {/* Comment toggler */}
        <button
          onClick={handleToggleComments}
          style={{
            background: "none",
            border: "none",
            fontSize: "0.8125rem",
            color: "var(--color-text-secondary)",
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.375rem",
            padding: "0.375rem 0.75rem",
            borderRadius: "4px",
            backgroundColor: showComments ? "var(--color-border-light)" : "transparent",
            transition: "background-color 0.2s ease",
          }}
          className="action-btn"
        >
          💬 {t("Comments")}
        </button>

        {/* PDF Download Button */}
        <button
          onClick={handleDownloadPdf}
          disabled={pdfLoading}
          style={{
            background: "none",
            border: "none",
            fontSize: "0.8125rem",
            color: "var(--color-primary-dark)",
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.375rem",
            padding: "0.375rem 0.75rem",
          }}
          className="action-btn"
        >
          📄 {pdfLoading ? t("Exporting...") : t("Export PDF Advisory")}
        </button>
      </div>

      {/* Collapsible Reddit-style Comments section */}
      {showComments && (
        <div
          style={{
            marginTop: "1rem",
            background: "var(--color-bg)",
            padding: "1rem",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--color-border-light)",
          }}
        >
          <h4 style={{ margin: "0 0 1rem 0", fontSize: "0.875rem", fontWeight: 700 }}>
            💬 {t("Discussion Thread")}
          </h4>

          {commentsLoading ? (
            <div style={{ textAlign: "center", padding: "1rem" }}>
              <div className="spinner" style={{ width: "24px", height: "24px", margin: "0 auto" }} />
            </div>
          ) : comments.length === 0 ? (
            <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", margin: "0 0 1rem 0" }}>
              {t("Be the first to help this farmer! Post a reply below.")}
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "1rem" }}>
              {comments.map((comment) => (
                <div
                  key={comment.id}
                  style={{
                    background: "var(--color-bg-card)",
                    padding: "0.75rem 1rem",
                    borderRadius: "var(--radius-sm)",
                    borderLeft: comment.user_role === "AGRONOMIST" ? "4px solid #2e7d32" : "1px solid var(--color-border)",
                    display: "flex",
                    gap: "1rem",
                  }}
                >
                  {/* Reddit Vote Widget for comments */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.25rem" }}>
                    <button
                      onClick={() => handleVote(comment.id, "upvote")}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontSize: "1rem",
                        color: comment.user_vote === "upvote" ? "#2e7d32" : "var(--color-text-muted)",
                        padding: 0,
                      }}
                      title="Upvote"
                    >
                      ▲
                    </button>
                    <span style={{ fontSize: "0.75rem", fontWeight: 700 }}>
                      {comment.upvotes - comment.downvotes}
                    </span>
                    <button
                      onClick={() => handleVote(comment.id, "downvote")}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontSize: "1rem",
                        color: comment.user_vote === "downvote" ? "#d00000" : "var(--color-text-muted)",
                        padding: 0,
                      }}
                      title="Downvote"
                    >
                      ▼
                    </button>
                  </div>

                  {/* Comment content */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.25rem" }}>
                      <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--color-text)" }}>
                        {comment.username}
                      </span>
                      {comment.user_role === "AGRONOMIST" && (
                        <span
                          style={{
                            backgroundColor: "#e8f5e9",
                            color: "#2e7d32",
                            fontSize: "0.625rem",
                            fontWeight: 700,
                            padding: "0.125rem 0.375rem",
                            borderRadius: "4px",
                            border: "1px solid #a5d6a7",
                          }}
                        >
                          Verified Agronomist ✅
                        </span>
                      )}
                      {comment.user_role === "ADMIN" && (
                        <span
                          style={{
                            backgroundColor: "#e0f2fe",
                            color: "#0369a1",
                            fontSize: "0.625rem",
                            fontWeight: 700,
                            padding: "0.125rem 0.375rem",
                            borderRadius: "4px",
                            border: "1px solid #bae6fd",
                          }}
                        >
                          Admin 🛡️
                        </span>
                      )}
                      <span style={{ fontSize: "0.6875rem", color: "var(--color-text-muted)" }}>
                        {new Date(comment.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <p style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)", margin: 0, lineHeight: 1.4 }}>
                      {comment.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Post reply comment form */}
          <form onSubmit={handlePostComment} style={{ display: "flex", gap: "0.5rem" }}>
            <input
              type="text"
              required
              placeholder={t("Share your agricultural advice or query response...")}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              style={{
                flex: 1,
                padding: "0.625rem",
                fontSize: "0.8125rem",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--color-border)",
                background: "var(--color-bg-card)",
                outline: "none",
              }}
            />
            <button
              type="submit"
              className="btn btn-primary"
              style={{ padding: "0.5rem 1rem", fontSize: "0.8125rem" }}
            >
              Reply
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
