# SISYPHUS

**AI Agent Reliability Platform** — *See where your AI agent gets stuck.*

SISYPHUS ingests agent execution traces, detects unproductive patterns (loops, retry storms, bloat, tool oscillation), and surfaces them as a visual, explainable report with evidence and estimated waste.

---

## ⚡ Architecture & Data Flow

```mermaid
flowchart TD
    subgraph Agent [AI Agent / Client]
        A1[Agent Execution Loop] -->|POST /api/v1/runs| B1
        A1 -->|POST /api/v1/runs/{id}/events| B2
        A1 -->|POST /api/v1/runs/{id}/complete| B3
    end

    subgraph Backend [SISYPHUS Backend - FastAPI]
        B1[Run Service]
        B2[Idempotent Batch Ingest]
        B3[Completion Trigger]
        
        B3 --> D1[Detection Engine]
        D1 -->|Detect Loops| DET[5 Deterministic Detectors]
        DET --> D2[Waste Calculator]
        DET --> D3[AI Explainer - Gemini 2.5]
    end

    subgraph Database [PostgreSQL 16]
        DB1[(Runs & Projects)]
        DB2[(Events - Unique Index)]
        DB3[(Findings & Evidence)]
        
        B1 <--> DB1
        B2 <--> DB2
        D1 & D2 & D3 --> DB3
    end

    subgraph Frontend [SISYPHUS Dashboard - Next.js]
        UI1[Project Overview]
        UI2[Execution Timeline & Minimap]
        UI3[Finding Cards & Evidence Drawer]
        UI4[Guard Simulation & Policy Generator]
        
        UI1 & UI2 & UI3 & UI4 <-->|GET /api/v1/*| Backend
    end
```

---

## ⚡ 60-Second Quickstart

### Prerequisites
- Docker & Docker Compose v2
- `curl` or any HTTP client / PowerShell

### 1. Clone and configure

```bash
git clone https://github.com/priyanshi-100506/SISYPHUS.git
cd SISYPHUS
cp .env.example .env          # edit if needed (defaults work for local dev)
```

### 2. Start everything

```bash
docker compose up -d --build
```

This starts three services:
| Service | URL | Description |
|---------|-----|-------------|
| **Frontend (Next.js)** | [http://localhost:3000](http://localhost:3000) | Interactive dashboard, timeline, minimap, simulations |
| **Backend (FastAPI)** | [http://localhost:8000](http://localhost:8000) | REST API & Analysis Engine |
| **API Docs (Swagger)** | [http://localhost:8000/docs](http://localhost:8000/docs) | Interactive API Explorer & Schemas |
| **PostgreSQL** | `localhost:5436` | Database (`sisyphus_db`) |

---

## 🔍 Supported Reliability Detectors

| Pattern | Description | Trigger Threshold |
|---|---|---|
| **`REPEATED_TOOL`** | Same tool called with identical inputs consecutively | $\ge 3$ repeated calls |
| **`STATE_LOOP`** | Sequence of states repeating without progress ($S_1 \rightarrow S_2 \rightarrow S_1 \rightarrow S_2$) | Cycle length $\ge 2$, repeats $\ge 2$ |
| **`RETRY_STORM`** | Consecutive tool failures without exponential backoff | $\ge 3$ consecutive errors |
| **`EXECUTION_BLOAT`** | Step count exceeding baseline limits | $> 3\times$ baseline median (or $>20$ steps) |
| **`TOOL_OSCILLATION`** | Rapid ping-pong alternation between two tools | $\ge 4$ alternating calls |

---

## 🚀 Live Trace Workflow

### 1. Create a Project
Open [http://localhost:3000](http://localhost:3000) and click **"+ New Project"**, or run:
```bash
curl -s -X POST http://localhost:8000/api/v1/projects \
  -H "Content-Type: application/json" \
  -d '{"name": "Research Agent", "slug": "research-agent", "language": "python"}'
```

### 2. Start a Run
```bash
API_KEY="sk_live_..."

RUN_ID=$(curl -s -X POST http://localhost:8000/api/v1/runs \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"input": "Search and compare Paris hotels"}' | jq -r '.id')
```

### 3. Ingest Events
```bash
curl -s -X POST http://localhost:8000/api/v1/runs/$RUN_ID/events \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "events": [
      {"sequence_number": 1, "event_type": "think", "input_preview": "Analyzing request", "tokens_in": 300, "tokens_out": 40, "latency_ms": 190, "status": "ok"},
      {"sequence_number": 2, "event_type": "tool", "tool_name": "search", "input_preview": "query: Paris hotels", "tokens_in": 400, "tokens_out": 100, "latency_ms": 420, "status": "ok"},
      {"sequence_number": 3, "event_type": "tool", "tool_name": "search", "input_preview": "query: Paris hotels", "tokens_in": 400, "tokens_out": 100, "latency_ms": 420, "status": "ok"},
      {"sequence_number": 4, "event_type": "tool", "tool_name": "search", "input_preview": "query: Paris hotels", "tokens_in": 400, "tokens_out": 100, "latency_ms": 420, "status": "ok"},
      {"sequence_number": 5, "event_type": "think", "input_preview": "Summarizing", "tokens_in": 500, "tokens_out": 200, "latency_ms": 350, "status": "ok"}
    ]
  }'
```

### 4. Complete & Analyze
```bash
curl -s -X POST http://localhost:8000/api/v1/runs/$RUN_ID/complete \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"status": "completed"}'
```

Open `http://localhost:3000/demo?run_id=$RUN_ID` to see the findings report, evidence breakdown, and guard simulation!

---

## 🧪 Testing & Scenarios

Run the predefined scenario generator to create instant test runs in the database:
```bash
# Available scenarios: repeated_tool, retry_storm, oscillation
python scripts/create_scenario_run.py repeated_tool
```

Or switch between scenarios interactively on the frontend at [http://localhost:3000/demo](http://localhost:3000/demo).

---

## 📁 Repository Structure

```text
SISYPHUS/
├── frontend/               # Next.js 14 App Router, TypeScript, Tailwind CSS
│   ├── src/
│   │   ├── app/            # Landing page, /demo, /dashboard
│   │   ├── components/     # Minimap, Timeline, Findings, Evidence, Simulation
│   │   └── lib/            # API client & Demo scenario fixtures
│   └── Dockerfile
├── backend/                # FastAPI 0.115, SQLAlchemy 2.0 Async, Alembic
│   ├── app/
│   │   ├── api/            # API v1 routes (projects, runs, events)
│   │   ├── analysis/       # Deterministic loop detectors & Gemini explainer
│   │   ├── db/             # Models (User, Project, Run, Event, Finding)
│   │   └── services/       # Core business & ingestion logic
│   ├── tests/              # Pytest detector & API test suite
│   └── Dockerfile
├── scripts/                # Verification and scenario seeding tools
├── docker-compose.yml      # Multi-container orchestration (DB, API, Web)
└── README.md
```

---

## 🛡️ License

Apache-2.0
