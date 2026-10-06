# SISYPHUS

**AI Agent Reliability & Execution Diagnostics Platform**

SISYPHUS is a full-stack developer observability platform engineered to diagnose, quantify, and mitigate non-deterministic failure modes in autonomous AI agents (such as infinite tool loops, retry storms, state cycling, and tool oscillation).

The platform ingests high-throughput execution traces, applies deterministic graph and sequence detection algorithms, computes empirical token and financial waste, and generates explainable root-cause reports powered by Google Gemini.

---

## Executive Summary & Architecture

Modern LLM-based agents frequently fail silently by entering repetitive tool execution loops or unhandled error cycles. SISYPHUS provides full trace observability with idempotent ingestion, automated pattern analysis, and actionable guardrail simulation.

### Data Flow Diagram

```mermaid
flowchart TD
    subgraph AgentClient [Client Agent / SDK]
        A1[Agent Turn Loop] -->|POST /api/v1/runs| B1[Run Management Service]
        A1 -->|POST /api/v1/runs/{id}/events| B2[Idempotent Batch Ingestion]
        A1 -->|POST /api/v1/runs/{id}/complete| B3[Run Completion Trigger]
    end

    subgraph BackendService [FastAPI Backend Service]
        B1
        B2
        B3 --> D1[Reliability Analysis Engine]
        
        D1 --> DET[Deterministic Pattern Detectors]
        DET -->|Compute Waste Metrics| D2[Waste & Cost Calculator]
        DET -->|Generate Root Cause| D3[AI Explainer Engine - Gemini 2.5]
    end

    subgraph DatabaseLayer [PostgreSQL 16 Storage]
        DB1[(Users & Projects)]
        DB2[(Execution Events - Composite Index)]
        DB3[(Findings & Structured Evidence)]
        
        B1 <--> DB1
        B2 <--> DB2
        D1 & D2 & D3 --> DB3
    end

    subgraph FrontendApp [Next.js Observability Dashboard]
        UI1[Project Management]
        UI2[Execution Minimap & Timeline]
        UI3[Finding Cards & Evidence Drawer]
        UI4[Guard Simulation & Policy Generator]
        
        UI1 & UI2 & UI3 & UI4 <-->|REST API| BackendService
    end
```

---

## Key Technical Features & Engineering Decisions

### 1. Idempotent High-Throughput Trace Ingestion
- Ingestion endpoints enforce a composite unique constraint on `(run_id, sequence_number)` with `ON CONFLICT DO NOTHING`.
- Guarantees network retry safety (`accepted: N, duplicates: M`) without polluting trace sequences during network partitions.

### 2. Deterministic Pattern Detection Algorithms
Rather than relying solely on probabilistic anomaly detection, the core engine runs deterministic algorithms over trace events:

| Detector | Category | Detection Logic | Threshold |
|---|---|---|---|
| `REPEATED_TOOL` | Redundancy | Groups identical tool names and input hashes | 3 or more consecutive identical calls |
| `STATE_LOOP` | Cycle Detection | Sliding-window state sequence matching ($S_1 \rightarrow S_2 \rightarrow S_1 \rightarrow S_2$) | Cycle length $\ge 2$, iterations $\ge 2$ |
| `RETRY_STORM` | Fault Tolerance | Identifies consecutive unhandled downstream API errors | 3 or more consecutive tool errors |
| `EXECUTION_BLOAT` | Efficiency | Monitors trace step count against statistical baselines | $> 3\times$ baseline median (or $>20$ steps) |
| `TOOL_OSCILLATION` | Convergence | Tracks rapid ping-pong alternations between complementary tools | 4 or more alternations |

### 3. Granular Waste & Financial Impact Model
- Calculates exact token waste (prompt + completion) and wall-clock latency lost to unproductive steps.
- Evaluates per-model pricing rates (Claude, GPT, Gemini) to present precise dollar costs attributable to agent errors.

### 4. Hybrid AI Root-Cause Explanations
- Integrates Google Gemini 2.5 Flash (`google-genai` SDK) to synthesize natural-language explanations from structured JSON evidence.
- Features automatic fallback to deterministic rule-based explanations if external AI APIs are unreachable.

### 5. Proactive Guard Simulation
- Allows engineers to simulate early-stopping guard policies (e.g., `@guard.watch(break_on=["STATE_LOOP"], max_repeats=3)`) against recorded traces to evaluate savings prior to production deployment.

---

## Quickstart Guide

### Prerequisites
- Docker & Docker Compose v2
- cURL, Postman, or PowerShell

### 1. Clone Repository and Configure Environment

```bash
git clone https://github.com/priyanshi-100506/SISYPHUS.git
cd SISYPHUS
cp .env.example .env
```

### 2. Launch Services with Docker Compose

```bash
docker compose up -d --build
```

### 3. Service Endpoints

| Component | URL | Purpose |
|---|---|---|
| Web Dashboard | http://localhost:3000 | Interactive trace visualization, timeline, and minimap |
| Interactive Scenarios | http://localhost:3000/demo | Pre-configured test scenarios and trace switcher |
| Backend API | http://localhost:8000 | Core REST API |
| Swagger Documentation | http://localhost:8000/docs | OpenAPI interactive documentation |
| PostgreSQL Database | localhost:5436 | Relational store (mapped container port 5432) |

---

## API Workflow Example

### 1. Create a Project and Generate an API Key

```bash
curl -s -X POST http://localhost:8000/api/v1/projects \
  -H "Content-Type: application/json" \
  -d '{"name": "Research Agent", "slug": "research-agent", "language": "python"}'
```

Response includes an API token (`sk_live_...`).

### 2. Initialize an Execution Run

```bash
API_KEY="sk_live_..."

RUN_ID=$(curl -s -X POST http://localhost:8000/api/v1/runs \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"input": "Search and compare hotel prices in Paris"}' | jq -r '.id')
```

### 3. Ingest Trace Events (Batched & Idempotent)

```bash
curl -s -X POST http://localhost:8000/api/v1/runs/$RUN_ID/events \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "events": [
      {"sequence_number": 1, "event_type": "think", "input_preview": "Analyzing request parameters", "tokens_in": 300, "tokens_out": 40, "latency_ms": 190, "status": "ok"},
      {"sequence_number": 2, "event_type": "tool", "tool_name": "hotel_search", "input_preview": "Paris luxury hotels", "tokens_in": 400, "tokens_out": 100, "latency_ms": 420, "status": "ok"},
      {"sequence_number": 3, "event_type": "tool", "tool_name": "hotel_search", "input_preview": "Paris luxury hotels", "tokens_in": 400, "tokens_out": 100, "latency_ms": 420, "status": "ok"},
      {"sequence_number": 4, "event_type": "tool", "tool_name": "hotel_search", "input_preview": "Paris luxury hotels", "tokens_in": 400, "tokens_out": 100, "latency_ms": 420, "status": "ok"},
      {"sequence_number": 5, "event_type": "think", "input_preview": "Compiling results table", "tokens_in": 500, "tokens_out": 200, "latency_ms": 350, "status": "ok"}
    ]
  }'
```

### 4. Complete Run and Trigger Diagnostics

```bash
curl -s -X POST http://localhost:8000/api/v1/runs/$RUN_ID/complete \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"status": "completed"}'
```

Navigate to `http://localhost:3000/demo?run_id=$RUN_ID` to inspect findings, view the execution timeline, and simulate guard interventions.

---

## Automated Verification & Scenario Generator

A dedicated script is included to generate live test traces in the database:

```bash
# Execute predefined scenario (options: repeated_tool, retry_storm, oscillation)
python scripts/create_scenario_run.py repeated_tool
```

---

## Project Structure

```text
SISYPHUS/
├── frontend/                     # Next.js 14 App Router, TypeScript, Tailwind CSS
│   ├── src/
│   │   ├── app/                  # Application routes (/, /demo, /dashboard)
│   │   ├── components/           # UI components (Timeline, Minimap, Drawer, Modal)
│   │   └── lib/                  # API client and test scenario fixtures
│   └── Dockerfile
├── backend/                      # FastAPI, SQLAlchemy 2.0 Async, Alembic
│   ├── app/
│   │   ├── api/                  # REST routers (/projects, /runs, /events)
│   │   ├── analysis/             # Deterministic pattern detectors and AI explainer
│   │   ├── db/                   # PostgreSQL models and connection pool
│   │   └── services/             # Core business logic and ingestion layer
│   ├── tests/                    # Unit and integration test suite (pytest)
│   └── Dockerfile
├── scripts/                      # Scenario generators and verification tools
├── docker-compose.yml            # Multi-service configuration
└── README.md
```

---

## License

Apache-2.0
