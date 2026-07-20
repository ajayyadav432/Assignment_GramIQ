# 🧑‍🌾 Workflow & Role-Based Permissions

This document outlines the user workflow, authentication levels, translation system, and progress tracking mechanisms in **Krishi Clinic Lite**.

---

## 1. Role-Based Access Control (RBAC)

The application supports three roles to mimic real-world agricultural workflow operations:

| User Role | Permissions & Access Levels | Masking Behavior |
| :--- | :--- | :--- |
| **`FARMER`** | • Upload crop images for analysis.<br>• View own history and details.<br>• Submit follow-up images.<br>• Comment on own prediction query feed post. | **Raw AI prediction masked** (diagnosis, confidence, severity, recommendation hidden/masked under "Pending expert review" messages) if the query is in the `PENDING_REVIEW` state. |
| **`AGRONOMIST`** | • Access the expert verification panel/database console.<br>• View all crop queries (including unmasked AI results).<br>• Submit verified overrides (notes, severity, disease name). | **Full unmasked data visible** at all times. |
| **`ADMIN`** | • Full read/write access to all prediction history records.<br>• Access and export database snapshots (CSV, JSON, XML). | **Full unmasked data visible** at all times. |

### Authentication Mechanism
- Managed via JWT tokens (FastAPI OAuth2 flow).
- Password security: Hashed using `bcrypt` during registration and stored in the database.
- Authorization middleware: Route parameters utilize FastAPI Dependency Injection (`get_current_user`, `get_current_agronomist`, `get_current_farmer`).

---

## 2. Crop Advisory & Review Workflow

```mermaid
sequenceDiagram
    autonumber
    actor Farmer as 🧑‍🌾 Farmer
    actor Agro as 🧑‍🔬 Agronomist
    participant API as ⚡ FastAPI Backend
    participant DB as 💾 Database
    participant AI as 🧠 AI Provider

    Farmer->>API: POST /predictions (Image, Crop Type, Notes)
    API->>DB: Save placeholder (Status: PENDING_REVIEW)
    API-->>Farmer: Return placeholder response (Raw AI Masked)
    
    Note over API,AI: Background process task triggers
    API->>AI: analyze(Image, Crop, Notes)
    AI-->>API: Return Structured Prediction (Confidence, severity, advice)
    API->>DB: Save AI outputs to prediction record
    
    Agro->>API: GET /predictions (Console view)
    API->>DB: Fetch unmasked PENDING_REVIEW predictions
    API-->>Agro: Render raw AI predictions in Agronomist Portal
    
    Agro->>API: POST /predictions/{id}/review (Verification)
    API->>DB: Save agronomist verified advisory; set status to REVIEWED
    API-->>Agro: Review Saved
    
    Farmer->>API: GET /predictions/{id}
    API->>DB: Fetch reviewed prediction
    API-->>Farmer: Render verified diagnosis & advice (Unmasked)
```

---

## 3. Multilingual Localization

To support regional farmers, the application contains a Translation Context module:
- Supported languages: **English, Hindi, Telugu, Tamil, Marathi, Punjabi**.
- The frontend features a language switcher dropdown in the navigation header.
- Dynamic data fields (`predicted_disease`, `recommendation`, `farmer_notes`) are translated using the translation API endpoint (`POST /api/v1/translate`).
- This ensures farmers receive diagnostic advice in their preferred native language.
