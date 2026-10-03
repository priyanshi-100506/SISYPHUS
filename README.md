# SISYPHUS

**AI Agent Reliability Platform** — *See where your AI agent gets stuck.*

SISYPHUS ingests agent execution traces, detects unproductive patterns (loops, retry storms, bloat), and surfaces them as a visual, explainable report with evidence and estimated waste.

---

## ⚡ 60-Second Quickstart

### Prerequisites
- Docker & Docker Compose v2
- `curl` or any HTTP client

### 1. Clone and configure

```bash
git clone https://github.com/your-org/sisyphus.git
cd sisyphus
cp .env.example .env          # edit if needed (defaults work for local dev)
```

### 2. Start everything

```bash
docker compose up --build
```

This starts three services:
| Service | URL |
|---------|-----|
| PostgreSQL | `localhost:5432` |
| Backend (FastAPI) | http://localhost:8000 |
| Frontend (Next.js) | http://localhost:3000 |

Migrations run automatically on backend startup.

### 3. Verify the backend is alive

```bash
curl http://localhost:8000/healthz
# {"status":"ok","db":"ok"}
```

### 4. Create a project and get an API key

```bash
# DEV mode only — Phase 2 adds real OAuth
curl -s -X POST http://localhost:8000/api/v1/projects \
  -H "Content-Type: application/json" \
  -H "X-Dev-Mode: true" \
  -d '{"name": "My Agent", "slug": "my-agent", "language": "python"}' | jq .
# → { "id": "...", "api_key": "sk_live_...", "key_prefix": "sk_live_xxxx" }
#   Save the api_key — it is shown exactly once.
```

### 5. Run a full agent trace

```bash
API_KEY="sk_live_..."   # from step 4

# Start a run
RUN=$(curl -s -X POST http://localhost:8000/api/v1/runs \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"input": "Find three Python web frameworks"}' | jq -r '.id')

# Post events (batched, idempotent — safe to retry)
curl -s -X POST http://localhost:8000/api/v1/runs/$RUN/events \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "events": [
      {"sequence_number":1,"event_type":"tool","tool_name":"search",
       "input":{"query":"python frameworks"},"output":{"results":10},
       "tokens_in":100,"tokens_out":50,"latency_ms":300,
       "timestamp":"2026-10-01T05:00:01Z","status":"ok"},
      {"sequence_number":2,"event_type":"think",
       "input":{"reasoning":"I found Django, Flask, FastAPI"},"output":null,
       "tokens_in":200,"tokens_out":80,"latency_ms":800,
       "timestamp":"2026-10-01T05:00:02Z","status":"ok"}
    ]
  }' | jq .

# Complete the run
curl -s -X POST http://localhost:8000/api/v1/runs/$RUN/complete \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"status": "completed"}' | jq .

# Inspect
curl -s http://localhost:8000/api/v1/runs/$RUN \
  -H "Authorization: Bearer $API_KEY" | jq .
```

### 6. Re-send any batch — zero duplicates

```bash
# Sending the same events again is a no-op
curl -s -X POST http://localhost:8000/api/v1/runs/$RUN/events \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{ "events": [ ... same batch ... ] }' | jq .
# → {"accepted": 0, "duplicates": 2}
```

---

## Load the demo data

```bash
docker compose exec backend python -m demo.seed
```

This loads a clean "Research Agent" run and a flawed run (4× identical search call) into a demo project. Visit http://localhost:3000 to see them.

---

## Run the tests

```bash
# Requires a running Postgres (docker compose up db)
docker compose exec backend pytest -v
```

---

## Architecture

```text
Browser / Agent (any language)
        │  API key / session
        ▼
   FastAPI (single service, port 8000)
   ├── /api/v1/projects   — project management
   ├── /api/v1/runs       — run lifecycle
   ├── /api/v1/runs/{id}/events  — batched ingestion
   └── /healthz
        │
        ▼
   PostgreSQL (port 5432)
   ├── users, projects, runs
   ├── events (UNIQUE run_id + sequence_number)
   ├── findings (populated by analysis engine)
   └── model_pricing
```

---

## Repo layout

```text
sisyphus/
├── frontend/       Next.js App Router, TypeScript, Tailwind
├── backend/
│   ├── app/
│   │   ├── api/        routers: projects, runs, events
│   │   ├── core/       config, security, auth
│   │   ├── db/         models, session, migrations
│   │   ├── services/   business logic
│   │   └── analysis/   detector stub (Phase 3)
│   ├── demo/           seed script
│   └── tests/
├── docs/
├── docker-compose.yml
└── README.md
```

---

---

## What is built (SISYPHUS v1.0)

| Component | Status | Description |
|-----------|--------|-------------|
| Ingestion Engine | ✅ Complete | Idempotent batch event ingestion (`UNIQUE(run_id, sequence_number)`) |
| Detection Engine | ✅ Complete | Deterministic algorithms: `REPEATED_TOOL`, `STATE_LOOP`, `RETRY_STORM`, `EXECUTION_BLOAT`, `TOOL_OSCILLATION` |
| AI Explainer | ✅ Complete | Google Gemini 2.5 Flash via `google-genai` SDK with deterministic fallback summaries |
| Findings & Metrics API | ✅ Complete | Computed waste calculations (tokens, latency, cost) and summary endpoints |
| Interactive Dashboard & UI | ✅ Complete | Run timeline, loop minimap, finding cards, evidence drawer, guard simulation modal |
| Verification & Test Suite | ✅ Complete | 13/13 passing async tests (`pytest`) + end-to-end integration script |

---

## Environment variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | `sqlite+aiosqlite:///./test.db` | Database connection URL (PostgreSQL in prod, SQLite for dev/test) |
| `FRONTEND_ORIGIN` | Yes | `http://localhost:3000` | CORS allowed origin |
| `SECRET_KEY` | Yes | `change-me-in-production` | Secret key for auth / API key hashing |
| `GEMINI_API_KEY` | Optional | — | Google Gemini API key for AI root-cause explanations (graceful fallback if unset) |
| `NEXT_PUBLIC_API_URL` | Optional | `http://localhost:8000/api/v1` | Backend API base URL for frontend client |

Copy `.env.example` → `.env` and fill in values.
