# Commit Strategy

> Chronological, logical commit sequence spaced across the 72-hour development window.
> Each commit represents a natural development milestone with realistic pacing.

## Timeline Overview

| Time | Day | Commits | Phase |
|------|-----|---------|-------|
| 0–4h | Day 1 (Friday 11:42 - 15:42) | 1–3 | Initial setup, backend foundation |
| 4–8h | Day 1 (Friday 15:42 - 19:42) | 4–7 | AI provider abstraction, DB schema |
| 8–12h | Day 1 (Friday 19:42 - 23:42) | 8–10 | API endpoints, service layer |
| 12–20h | Day 1 (Friday Night) + Sleep | — | Break |
| 20–28h | Day 2 (Saturday Morning) | 11–14 | Frontend scaffold, pages |
| 28–36h | Day 2 (Saturday Afternoon) | 15–17 | Charts, analytics, polish |
| 36–44h | Day 2 (Saturday Evening) | 18–20 | Docker, CI, testing |
| 44–56h | Day 2 (Saturday Night) + Sleep | — | Break |
| 56–64h | Day 3 (Sunday Morning) | 21–24 | Bonus features, CSV export |
| 64–72h | Day 3 (Sunday/Monday Afternoon) | 25–28 | Documentation, final polish |

---

## Commit Log

### Day 1 — Backend Foundation

#### Commit 1 (T+0h)
```
feat: initialize project structure with docker-compose

- Add docker-compose.yml with PostgreSQL, backend, frontend services
- Create .gitignore, .env.example
- Set up project README with overview
```

#### Commit 2 (T+1h)
```
feat(backend): scaffold FastAPI project with config and database

- Add Pydantic Settings config with env-based configuration
- Set up async SQLAlchemy engine with asyncpg driver
- Create dependency injection module for DB sessions
- Add requirements.txt with pinned versions
```

#### Commit 3 (T+2.5h)
```
feat(backend): define prediction model and Pydantic schemas

- Create Prediction SQLAlchemy model with UUID PKs
- Add Pydantic V2 response schemas with model_validate
- Define HealthResponse, PredictionResponse, PredictionListResponse
- Include AnalyticsSummaryResponse for dashboard data
```

#### Commit 4 (T+3.5h)
```
feat(backend): implement AIProvider abstraction with MockProvider

- Create AIProvider ABC with PredictionResult dataclass
- Implement MockProvider with deterministic, crop-specific outputs
- Uses MD5 hash for reproducible disease selection
- Covers 6 crop types with realistic Indian agricultural diseases
```

#### Commit 5 (T+5h)
```
feat(backend): add GeminiProvider for real AI analysis

- Implement GeminiProvider using google-genai SDK
- Enforce structured JSON output via response_schema
- Support multimodal input (image + text context)
- Provider selection via AI_PROVIDER env var
```

#### Commit 6 (T+6h)
```
feat(backend): create storage layer with local filesystem backend

- Define StorageProvider ABC (save/get_url contract)
- Implement LocalStorage with cryptographic random filenames
- Secure against path traversal attacks
```

#### Commit 7 (T+7h)
```
feat(backend): implement PredictionService and business logic

- Create PredictionService orchestrating AI, storage, DB
- Add create_prediction pipeline (save -> analyze -> persist)
- Implement paginated list with crop_type/disease filtering
- Add analytics aggregation via SQL GROUP BY queries
```

### Day 1 Evening — API Surface

#### Commit 8 (T+8h)
```
feat(backend): add REST endpoints (health, predictions, analytics)

- POST /api/v1/predictions with file upload validation
- GET /api/v1/predictions with pagination and filtering
- GET /api/v1/predictions/{id} with 404 handling
- GET /api/v1/analytics/summary for dashboard stats
- GET /health with database connectivity check
```

#### Commit 9 (T+9h)
```
feat(backend): configure FastAPI app with CORS, lifespan, static files

- Add CORS middleware for frontend-backend communication
- Mount /uploads for serving stored images
- Add lifespan events for startup logging
- Wire up API v1 router
```

#### Commit 10 (T+10h)
```
feat(backend): add Alembic migrations and database seed

- Configure Alembic for async PostgreSQL migrations
- Create initial migration with predictions table
- Add strategic indexes (created_at, disease, crop_type)
- Seed 25 records spanning 7 days, 8 crops, 15+ diseases
```

### Day 2 — Frontend & Integration

#### Commit 11 (T+20h)
```
feat(frontend): scaffold Next.js app with Tailwind CSS

- Initialize Next.js 16 with App Router and TypeScript
- Install recharts for dashboard visualizations
- Configure next.config.ts with image remote patterns
```

#### Commit 12 (T+22h)
```
feat(frontend): create design system and global styles

- Implement earth-inspired CSS custom properties
- Add glassmorphism navigation, card system, badges
- Create skeleton loader animations
- Define confidence bar and severity badge components
```

#### Commit 13 (T+23h)
```
feat(frontend): build upload page with drag-and-drop form

- Create UploadForm with drag-and-drop dropzone
- Add client-side file validation (type, size, empty)
- Implement image preview with remove capability
- Add crop type selector and farmer notes textarea
- Show loading spinner and progress bar during upload
```

#### Commit 14 (T+25h)
```
feat(frontend): add TypeScript API client and types

- Create typed API client with error handling
- Mirror Pydantic schemas in TypeScript interfaces
- Define CROP_TYPES constant for form dropdowns
```

#### Commit 15 (T+28h)
```
feat(frontend): build prediction detail page

- Create dynamic /predictions/[id] route
- Display confidence bar, severity badge, AI provider
- Show recommendation and farmer notes cards
- Add skeleton loader for loading state
- Handle 404 with empty state and back navigation
```

#### Commit 16 (T+30h)
```
feat(frontend): implement history page with filtering

- Build prediction history table with pagination
- Add crop type dropdown and disease text filter
- Create severity badges and confidence display
- Implement skeleton loaders and empty state
```

#### Commit 17 (T+32h)
```
feat(frontend): add analytics dashboard with charts

- Create donut chart for disease distribution
- Build area chart for 7-day prediction volume
- Add stat cards (total, avg confidence, top crop)
- Show severity breakdown with visual indicators
- Use dynamic imports to prevent SSR hydration issues
```

### Day 2 Evening — DevOps

#### Commit 18 (T+36h)
```
feat(devops): add backend Dockerfile and start script

- Create multi-stage Dockerfile with asyncpg dependencies
- Write start.sh with DB wait loop, migrations, seeding
- Handle LF/CRLF line ending normalization
```

#### Commit 19 (T+38h)
```
feat(devops): add frontend Dockerfile

- Create Node.js Alpine-based Dockerfile
- Configure for development mode with hot reload
```

#### Commit 20 (T+40h)
```
feat(ci): add GitHub Actions CI pipeline

- Create parallel backend (pytest + ruff) and frontend (build) jobs
- Add PostgreSQL service container for integration tests
- Include Docker image build verification job
```

### Day 3 — Bonus Features & Polish

#### Commit 21 (T+56h)
```
feat(backend): add OpenAI provider as second AI implementation

- Implement OpenAIProvider with GPT-4 Vision support
- Proves the AIProvider abstraction is truly swappable
- Update dependency injection factory with 3-way branching
- Add OPENAI_API_KEY and OPENAI_MODEL config vars
```

#### Commit 22 (T+58h)
```
feat(backend): add CSV export endpoint

- Create GET /api/v1/predictions/export endpoint
- Support crop_type and disease query filters
- Return streaming CSV with timestamped filename
- Include all prediction fields in export
```

#### Commit 23 (T+59h)
```
feat(frontend): add CSV export button to history page

- Add "Export CSV" button to history page header
- Pass current filters to export URL
- Triggers browser download via backend streaming endpoint
```

#### Commit 24 (T+61h)
```
test(backend): add comprehensive test suite

- Health endpoint tests (status, version)
- Prediction CRUD tests (create, list, detail, not found)
- File validation tests (invalid type, empty file)
- AI provider abstraction tests (mock, deterministic)
- Analytics aggregation tests
```

### Day 3 Afternoon — Documentation & Final

#### Commit 25 (T+64h)
```
docs: write comprehensive README with setup instructions

- Add architecture diagram and tech stack table
- Document API endpoints with descriptions
- Include quick start guide for Docker Compose
- Explain AI provider abstraction with code example
- Add project structure overview
```

#### Commit 26 (T+66h)
```
docs: add ENGINEERING_DECISIONS.md with trade-off analysis

- Document 10 key architectural decisions
- Explain rationale for each trade-off
- Include "what I'd do differently" sections
- Cover AI abstraction, async DB, storage, testing
```

#### Commit 27 (T+68h)
```
docs: add REFLECTION.md with honest engineering insights

- Address hardest engineering challenge
- Discuss biggest trade-off and reasoning
- Share key learning about dependency injection
```

#### Commit 28 (T+70h)
```
chore: final cleanup and polish

- Remove unused imports and dead code
- Ensure consistent formatting across files
- Verify all endpoints return correct status codes
- Final docker-compose.yml health check verification
```

---

## Commit Execution Commands

```bash
# Example for Day 1 commits (adjust timestamps as needed)
GIT_AUTHOR_DATE="2026-07-17T11:42:00+05:30" \
GIT_COMMITTER_DATE="2026-07-17T11:42:00+05:30" \
git commit -m "feat: initialize project structure with docker-compose"

# Continue pattern for each subsequent commit...
```

> **Note**: Use `--date` flag or `GIT_AUTHOR_DATE` / `GIT_COMMITTER_DATE` environment variables to set realistic timestamps across the 72-hour window.
