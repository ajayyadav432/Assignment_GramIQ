"use client";

import { useState, useRef, DragEvent, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { createPrediction } from "@/lib/api";
import { CROP_TYPES, AI_PROVIDERS } from "@/lib/types";

export default function UploadForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [cropType, setCropType] = useState("");
  const [aiProvider, setAiProvider] = useState("");
  const [farmerNotes, setFarmerNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = (selectedFile: File) => {
    // Client-side validation
    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(selectedFile.type)) {
      setError("Please upload a JPEG, PNG, or WebP image.");
      return;
    }
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError("File size must be under 10MB.");
      return;
    }

    setFile(selectedFile);
    setError(null);

    // Generate preview
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(selectedFile);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) handleFile(droppedFile);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) handleFile(selectedFile);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !cropType) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("crop_type", cropType);
      if (farmerNotes.trim()) {
        formData.append("farmer_notes", farmerNotes.trim());
      }
      if (aiProvider) {
        formData.append("ai_provider_name", aiProvider);
      }

      const prediction = await createPrediction(formData);
      router.push(`/predictions/${prediction.id}`);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeFile = () => {
    setFile(null);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* File Upload Dropzone */}
      <div style={{ marginBottom: "1.5rem" }}>
        <label className="label">
          Crop Image <span className="label-hint">(JPEG, PNG, or WebP — max 10MB)</span>
        </label>

        {!file ? (
          <div
            className={`dropzone ${isDragging ? "dropzone-active" : ""}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
          >
            <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>📷</div>
            <p style={{ fontWeight: 600, color: "var(--color-text)", marginBottom: "0.25rem" }}>
              Drag and drop your crop image here
            </p>
            <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
              or click to browse files
            </p>
          </div>
        ) : (
          <div className="card" style={{ padding: "1rem" }}>
            <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
              {preview && (
                <img
                  src={preview}
                  alt="Preview"
                  style={{
                    width: "80px",
                    height: "80px",
                    objectFit: "cover",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--color-border-light)",
                  }}
                />
              )}
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 600, fontSize: "0.875rem" }}>{file.name}</p>
                <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
                  {(file.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
              <button
                type="button"
                onClick={removeFile}
                className="btn btn-secondary"
                style={{ padding: "0.375rem 0.75rem", fontSize: "0.8125rem" }}
              >
                Remove
              </button>
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileInput}
          style={{ display: "none" }}
        />
      </div>

      {/* Crop Type Selection */}
      <div style={{ marginBottom: "1.5rem" }}>
        <label className="label" htmlFor="crop-type">
          Crop Type
        </label>
        <select
          id="crop-type"
          className="select"
          value={cropType}
          onChange={(e) => setCropType(e.target.value)}
          required
        >
          <option value="">Select a crop type...</option>
          {CROP_TYPES.map((crop) => (
            <option key={crop} value={crop}>
              {crop}
            </option>
          ))}
        </select>
      </div>

      {/* AI Model Selector */}
      <div style={{ marginBottom: "1.5rem" }}>
        <label className="label" htmlFor="ai-provider">
          AI Model <span className="label-hint">(choose analysis engine)</span>
        </label>
        <select
          id="ai-provider"
          className="select"
          value={aiProvider}
          onChange={(e) => setAiProvider(e.target.value)}
        >
          {AI_PROVIDERS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </div>

      {/* Farmer Notes */}
      <div style={{ marginBottom: "1.5rem" }}>
        <label className="label" htmlFor="farmer-notes">
          Farmer Notes <span className="label-hint">(optional)</span>
        </label>
        <textarea
          id="farmer-notes"
          className="textarea"
          rows={3}
          placeholder="Describe what you observe — e.g., 'Yellow spots appearing on lower leaves after recent rain...'"
          value={farmerNotes}
          onChange={(e) => setFarmerNotes(e.target.value)}
          maxLength={1000}
          style={{ resize: "vertical" }}
        />
        <div
          style={{
            textAlign: "right",
            fontSize: "0.75rem",
            color: "var(--color-text-muted)",
            marginTop: "0.25rem",
          }}
        >
          {farmerNotes.length}/1000
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div
          className="toast-error"
          style={{
            position: "relative",
            marginBottom: "1rem",
            padding: "0.75rem 1rem",
            borderRadius: "var(--radius-md)",
            fontSize: "0.875rem",
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        className="btn btn-primary"
        disabled={!file || !cropType || isSubmitting}
        style={{
          width: "100%",
          padding: "0.875rem",
          fontSize: "1rem",
        }}
      >
        {isSubmitting ? (
          <>
            <span
              style={{
                display: "inline-block",
                width: "16px",
                height: "16px",
                border: "2px solid rgba(255,255,255,0.3)",
                borderTopColor: "white",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
              }}
            />
            Analyzing Crop...
          </>
        ) : (
          <>🔬 Analyze Crop Disease</>
        )}
      </button>

      {/* Upload Progress Indicator */}
      {isSubmitting && (
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: "80%" }} />
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </form>
  );
}
