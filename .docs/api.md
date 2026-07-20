# ⚡ API Specifications

The Krishi Clinic Lite REST API endpoints are designed following RESTful conventions, resource-based paths, and appropriate HTTP status codes.

---

## Base URL
- **Local Development**: `http://localhost:8000`
- **Interactive Documentation**: `http://localhost:8000/docs` (Swagger UI) or `/redoc`

---

## 1. System Endpoints

### Health Check
Validates application status and database connectivity.
- **Method**: `GET`
- **Path**: `/health`
- **Response (200 OK)**:
  ```json
  {
    "status": "healthy",
    "version": "1.0.0",
    "database": "connected"
  }
  ```

---

## 2. Prediction Endpoints

### Create Prediction (Crop Disease Diagnosis)
Uploads crop image for analysis.
- **Method**: `POST`
- **Path**: `/api/v1/predictions`
- **Content-Type**: `multipart/form-data`
- **Request Body Parameters**:
  - `image`: Binary file (JPEG, PNG, WebP) (Required)
  - `crop_type`: String (e.g., `Tomato`, `Wheat`, `Rice`) (Required)
  - `farmer_notes`: String (Optional)
  - `location`: String (Optional)
  - `language`: String (Optional)
  - `ai_provider_name`: String (Optional override, e.g., `gemini`, `groq`, `openai`, `local`, `mock`)
- **Headers**: `Authorization: Bearer <JWT_TOKEN>`
- **Response (201 Created)**: Returns the prediction record (masked if the user is a `FARMER` and review is pending).

### List Predictions
Retrieves paginated, filtered prediction history.
- **Method**: `GET`
- **Path**: `/api/v1/predictions`
- **Query Parameters**:
  - `page`: Integer (Default: `1`)
  - `limit`: Integer (Default: `10`)
  - `crop_type`: String (Optional filter)
  - `disease`: String (Optional filter)
  - `status`: String (`PENDING_REVIEW` or `REVIEWED`) (Optional filter)
  - `search`: String (Fuzzy search matching disease, notes, location) (Optional filter)
- **Headers**: `Authorization: Bearer <JWT_TOKEN>`
- **Response (200 OK)**:
  ```json
  {
    "items": [...],
    "total": 25,
    "page": 1,
    "limit": 10
  }
  ```

### Get Prediction Detail
Fetches detailed diagnostic metadata for a specific UUID.
- **Method**: `GET`
- **Path**: `/api/v1/predictions/{id}`
- **Path Parameters**:
  - `id`: UUID
- **Headers**: `Authorization: Bearer <JWT_TOKEN>`
- **Response (200 OK)**: Detailed JSON representation of the prediction record.
- **Response (404 Not Found)**: If UUID doesn't exist.
- **Response (403 Forbidden)**: If a `FARMER` attempts to access a record belonging to another user.

### Review Prediction (Agronomist Only)
Submits expert verification for a pending prediction.
- **Method**: `POST`
- **Path**: `/api/v1/predictions/{id}/review`
- **Path Parameters**:
  - `id`: UUID
- **Headers**: `Authorization: Bearer <JWT_TOKEN>` (Must be role `AGRONOMIST` or `ADMIN`)
- **Request Body (JSON)**:
  ```json
  {
    "predicted_disease": "Verified Late Blight",
    "severity": "High",
    "review": "Confirmed late blight outbreak. Apply Metalaxyl fungicide immediately."
  }
  ```
- **Response (200 OK)**: Updated prediction record with status set to `REVIEWED`.

### Add Follow-up Recovery Image (Farmer Only)
Uploads crop recovery image to track progress.
- **Method**: `POST`
- **Path**: `/api/v1/predictions/{id}/followup`
- **Path Parameters**:
  - `id`: UUID
- **Content-Type**: `multipart/form-data`
- **Request Body Parameters**:
  - `image`: Binary file (JPEG, PNG, WebP) (Required)
  - `after_notes`: String (Optional notes describing treatment recovery) (Required)
- **Headers**: `Authorization: Bearer <JWT_TOKEN>` (Must own the record)
- **Response (200 OK)**: Updated prediction record.

---

## 3. Analytics & Export Endpoints

### Analytics Summary
Aggregates statistical overview data for dashboard charts.
- **Method**: `GET`
- **Path**: `/api/v1/analytics/summary`
- **Query Parameters**:
  - `crop_type`: String (Optional crop filter)
- **Headers**: `Authorization: Bearer <JWT_TOKEN>`
- **Response (200 OK)**:
  ```json
  {
    "total_predictions": 25,
    "average_confidence": 0.88,
    "disease_distribution": [
      { "disease": "Healthy", "count": 10 },
      { "disease": "Late Blight", "count": 6 }
    ],
    "daily_volume": [
      { "date": "2026-07-14", "count": 3 },
      { "date": "2026-07-15", "count": 5 }
    ],
    "severity_distribution": {
      "High": 8,
      "Medium": 12,
      "Low": 5
    },
    "top_crop": "Tomato"
  }
  ```

### Export Predictions
Downloads database snapshot in CSV, JSON, or XML.
- **Method**: `GET`
- **Path**: `/api/v1/predictions/export`
- **Query Parameters**:
  - `format`: String (`csv`, `json`, `xml`) (Default: `csv`)
  - `crop_type`: String (Optional filter)
  - `disease`: String (Optional filter)
- **Headers**: `Authorization: Bearer <JWT_TOKEN>` (Must be role `AGRONOMIST` or `ADMIN`)
- **Response (200 OK)**: Streaming download file.

### Export PDF Advisory
Generates a printable PDF report for a prediction case.
- **Method**: `GET`
- **Path**: `/api/v1/predictions/{id}/pdf`
- **Path Parameters**:
  - `id`: UUID
- **Headers**: `Authorization: Bearer <JWT_TOKEN>`
- **Response (200 OK)**: PDF file stream.
