# ⚙️ Local Setup & Configuration

This guide helps developers and evaluators set up and launch **Krishi Clinic Lite** from scratch.

---

## Prerequisites
Ensure you have the following installed on your machine:
- **Docker** and **Docker Compose**
- **Git**
- **Node.js** (v18+ or v20+) — *Optional: Only needed for local, non-docker development*
- **Python** (3.11+ or 3.12+) — *Optional: Only needed for local, non-docker development*

---

## 🚀 1. The Quickest Path: Docker Compose (Single Command)

This brings up all services (Next.js, FastAPI, PostgreSQL) and automatically runs migrations and database seeding.

1.  **Clone the Repository**:
    ```bash
    git clone https://github.com/ajayyadav432/Assignment_GramIQ.git
    cd Assignment_GramIQ
    ```

2.  **Configure Environment Variables**:
    Copy the sample environment template:
    ```bash
    cp .env.example .env
    ```
    *(Optional: Open `.env` and fill in `GEMINI_API_KEY`, `OPENAI_API_KEY`, or `GROQ_API_KEY` to test real AI models. If left blank, the system degrades gracefully using the Mock provider).*

3.  **Launch the Containers**:
    ```bash
    docker compose up --build
    ```

4.  **Access the Applications**:
    - **Next.js Frontend Dashboard**: `http://localhost:3000`
    - **FastAPI API Server**: `http://localhost:8000`
    - **Swagger API Docs**: `http://localhost:8000/docs`

---

## 🛠️ 2. Local Development (Alternative)

If you prefer running services outside of Docker for hot-reloading:

### A. Database (PostgreSQL)
Run PostgreSQL locally (port `5432`). Update the `DATABASE_URL` in your `.env` file to match your PostgreSQL credentials:
`DATABASE_URL=postgresql+asyncpg://<username>:<password>@localhost:5432/<dbname>`

### B. FastAPI Backend Setup
1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```
2.  Create and activate a virtual environment:
    ```bash
    python3 -m venv .venv
    source .venv/bin/browser_subagent   # On Linux/macOS
    # or: .venv\Scripts\activate      # On Windows
    ```
3.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```
4.  Configure `.env` inside `backend/`:
    ```bash
    cp .env.example .env
    # Edit the values appropriately
    ```
5.  Run Alembic Migrations:
    ```bash
    alembic upgrade head
    ```
6.  Seed the Database:
    ```bash
    python seed.py
    ```
7.  Start the FastAPI Server:
    ```bash
    uvicorn app.main:app --reload --port 8000
    ```

### C. Next.js Frontend Setup
1.  Navigate to the frontend directory:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Configure `.env` inside `frontend/`:
    ```bash
    cp .env.example .env
    # Ensure NEXT_PUBLIC_API_URL points to the backend (http://localhost:8000)
    ```
4.  Launch the Development Server:
    ```bash
    npm run dev
    ```

---

## 🧪 3. Running Unit Tests

To run the full suite of backend integration and unit tests locally:

1.  Activate the virtual environment inside `backend/`.
2.  Run Pytest:
    ```bash
    pytest tests/ -v
    ```
    This will execute tests against an isolated, fast in-memory SQLite backend using mock AI providers.
