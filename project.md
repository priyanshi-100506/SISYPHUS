# SISYPHUS

**AI Agent Reliability Platform**
> See where your AI agent gets stuck.

SISYPHUS is a real developer tool first, a systems-learning project second, and a portfolio piece third. Someone should be able to open the URL, create a project, send events from their agent, and get a useful reliability report.

---

## 1. Problem

AI agents silently waste tool calls, tokens, latency, money, and retries. Developers usually find out by reading long, ugly logs.

SISYPHUS ingests agent execution traces, detects unproductive patterns (loops, retry storms, bloat), and shows them as a visual, explainable report with evidence and estimated waste.

## 2. Target user

A developer building an LLM agent (LangChain, custom loop, etc.) who wants to know: *"Why did that run take 40 seconds and 9k tokens?"*

## 3. Product principles

1. **Usable by a stranger.** Anyone can integrate via REST in under 10 minutes.
2. **Deterministic detection, AI explanation.** Rules decide findings. The LLM only explains them.
3. **Evidence over opinion.** Every finding links to the exact steps that triggered it.
4. **Infrastructure follows pain.** No queue, cache, or worker until the product creates the problem.
5. **One backend service in V1.**

---

## 4. User flow

1. **Sign in** (GitHub OAuth or magic link) and create a project. Receive `Project ID` and an API key (`sk_live_...`, shown once).
2. **Send events** from the agent via REST (SDK comes later).
3. **Complete the run.** Analysis runs synchronously on `/complete`.
4. **Investigate:** Dashboard, then Run, then Timeline, then Findings, then Evidence, then Guard simulation.

### Instrumentation (V1: REST)

```bash
# start a run
curl -X POST $API/api/v1/runs \
  -H "Authorization: Bearer sk_live_xxx" \
  -d '{"input": "Find three hotels in Paris"}'

# send events (batched, idempotent)
curl -X POST $API/api/v1/runs/run_123/events \
  -H "Authorization: Bearer sk_live_xxx" \
  -d '{"events": [ ... ]}'

# finish
curl -X POST $API/api/v1/runs/run_123/complete \
  -H "Authorization: Bearer sk_live_xxx" \
  -d '{"status": "completed"}'
```

### Instrumentation (later: SDK)

```python
from sisyphus import monitor

run = monitor.start(project="research-agent", input="Find three hotels in Paris")
run.tool("search", {"query": "Paris hotels"})
run.end()
```

---

## 5. MVP scope

Exactly five things:

| # | Area | Deliverable |
|---|------|-------------|
| A | Projects | Create/list/get projects, issue API keys |
| B | Ingestion | Create run, post batched events, complete run |
| C | Timeline | Ordered step view of a run |
| D | Detection | 5 deterministic detectors |
| E | Dashboard | Runs, failures, loops, tokens, latency, estimated cost |

### Explicit non-goals for V1

- Payments / billing
- Real anonymous runs (use a seeded read-only demo project instead)
- Queue, Redis, Kafka, Celery, Kubernetes
- Re-executing the user's agent
- Multi-user teams / orgs
- SDK (Phase 7)

---

## 6. Tech stack

| Layer | Choice |
|-------|--------|
| Frontend | Next.js, TypeScript, Tailwind, Recharts |
| Backend | FastAPI (single service), SQLAlchemy 2.0 + Alembic |
| Database | PostgreSQL (Neon or Supabase) |
| Auth (dashboard) | GitHub OAuth or magic link, session cookie |
| Auth (ingestion) | Project API key, bearer token |
| LLM (Phase 5) | Anthropic API, explanation only |
| Hosting | Frontend on Vercel. Backend on Fly / Render / Railway. DB on Neon / Supabase |
| Local dev | docker-compose (postgres + backend + frontend) |

> Vercel hosts only the Next.js app. FastAPI needs its own host.

---

## 7. Architecture (V1)

```text
 Agent (any language)               Browser
        │  API key                     │  user session
        ▼                              ▼
   ┌─────────────────────────────────────────┐
   │              FastAPI (one service)      │
   │  Projects │ Runs │ Events │ Analysis    │
   └───────────────────┬─────────────────────┘
                       ▼
                  PostgreSQL
```

Analysis runs inline inside `POST /runs/{id}/complete`. It moves to a worker only when a real run proves it's too slow (see `skills.md`, Stage 5).

---

## 8. Authentication model

| Actor | Credential | Used for |
|-------|-----------|----------|
| Agent / script | `Authorization: Bearer sk_live_...` | `POST /runs`, `POST /runs/{id}/events`, `POST /runs/{id}/complete` |
| Dashboard user | Session cookie | Project management, reading runs/findings/metrics |

- API keys are stored **hashed** (SHA-256 of a high-entropy key is fine). Show the full key once.
- Store a short `key_prefix` (e.g. `sk_live_8af2`) for display.
- A key maps to exactly one project.
- `POST /projects` requires a **user session**, never a project key.

---

## 9. Data model

```sql
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT UNIQUE NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE projects (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id),
  name          TEXT NOT NULL,
  slug          TEXT NOT NULL,
  language      TEXT,
  api_key_hash  TEXT NOT NULL,
  key_prefix    TEXT NOT NULL,
  is_demo       BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, slug)
);

CREATE TABLE runs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id       UUID NOT NULL REFERENCES projects(id),
  status           TEXT NOT NULL,        -- running | completed | failed | terminated | timeout
  input            TEXT,
  started_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at      TIMESTAMPTZ,
  total_steps      INT NOT NULL DEFAULT 0,
  total_tokens_in  INT NOT NULL DEFAULT 0,
  total_tokens_out INT NOT NULL DEFAULT 0,
  estimated_cost   NUMERIC(10,6) NOT NULL DEFAULT 0,
  analyzed_at      TIMESTAMPTZ
);
CREATE INDEX runs_project_started ON runs (project_id, started_at DESC);

CREATE TABLE events (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id           UUID NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
  sequence_number  INT  NOT NULL,
  parent_id        UUID,                 -- optional, for branching agents
  event_type       TEXT NOT NULL,        -- think | tool | error | end
  tool_name        TEXT,
  model            TEXT,
  input_hash       TEXT,
  output_hash      TEXT,
  state_hash       TEXT,                 -- client-supplied, optional
  input_preview    TEXT,                 -- truncated to 2 KB
  output_preview   TEXT,                 -- truncated to 2 KB
  status           TEXT NOT NULL DEFAULT 'ok',   -- ok | error
  error_code       TEXT,                 -- e.g. "500", "timeout", "rate_limit"
  tokens_in        INT NOT NULL DEFAULT 0,
  tokens_out       INT NOT NULL DEFAULT 0,
  latency_ms       INT,
  timestamp        TIMESTAMPTZ NOT NULL,
  UNIQUE (run_id, sequence_number)       -- idempotency
);

CREATE TABLE findings (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id       UUID NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
  type         TEXT NOT NULL,            -- REPEATED_TOOL | STATE_LOOP | ...
  severity     TEXT NOT NULL,            -- low | medium | high
  step_start   INT NOT NULL,
  step_end     INT NOT NULL,
  description  TEXT NOT NULL,
  evidence     JSONB NOT NULL,
  waste_tokens INT NOT NULL DEFAULT 0,
  waste_ms     INT NOT NULL DEFAULT 0,
  waste_cost   NUMERIC(10,6) NOT NULL DEFAULT 0,
  explanation  TEXT,                     -- LLM text, nullable
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX findings_run ON findings (run_id);

CREATE TABLE model_pricing (
  model            TEXT PRIMARY KEY,
  input_per_mtok   NUMERIC(10,4) NOT NULL,
  output_per_mtok  NUMERIC(10,4) NOT NULL
);
```

### Definition of "state"

V1: `state = hash(tool_name, input_hash, output_hash)`. If the same tool call returns the same output, no progress was made. If the client sends `state_hash`, use that instead.

---

## 10. Event schema (ingestion contract)

`POST /api/v1/runs/{run_id}/events`

```json
{
  "events": [
    {
      "sequence_number": 4,
      "event_type": "tool",
      "tool_name": "search",
      "model": "claude-sonnet-4-6",
      "input": {"query": "Paris hotels"},
      "output": {"results": 10},
      "status": "ok",
      "error_code": null,
      "tokens_in": 412,
      "tokens_out": 96,
      "latency_ms": 450,
      "timestamp": "2026-10-01T10:00:04Z",
      "state_hash": null,
      "parent_id": null
    }
  ]
}
```

Server behavior:
- Hash `input` and `output` (canonical JSON, SHA-256). Store the first 2 KB as previews. Discard the rest.
- Insert with `ON CONFLICT (run_id, sequence_number) DO NOTHING`. Retried requests are safe.
- Accept up to 500 events per request. Return `{accepted, duplicates}`.
- Reject events for runs already marked complete (409).
- Out-of-order arrival is allowed. Order is always by `sequence_number`.

---

## 11. API

Base: `/api/v1`

**Dashboard (user session)**

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/projects` | Create project, returns key once |
| GET | `/projects` | List own projects |
| GET | `/projects/{id}` | Project detail + stats |
| GET | `/projects/{id}/runs?cursor=` | Paginated runs |
| GET | `/runs/{id}` | Run detail |
| GET | `/runs/{id}/events?after=&limit=` | Paginated timeline |
| GET | `/runs/{id}/findings` | Findings with evidence |
| GET | `/runs/{id}/metrics` | Tokens, latency, cost, waste |
| GET | `/runs/{id}/simulate` | Guard simulation |

**Ingestion (API key)**

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/runs` | Start a run |
| POST | `/runs/{id}/events` | Batched, idempotent events |
| POST | `/runs/{id}/complete` | Finish and trigger analysis |

Conventions: cursor pagination, ISO-8601 UTC timestamps, JSON errors `{error: {code, message}}`, per-key rate limiting added when needed.

---

## 12. Detection engine

Pure functions: `detect(events) -> list[Finding]`. No DB access inside detectors, so they're trivially unit-testable.

| Type | Rule | Default threshold | Severity |
|------|------|-------------------|----------|
| `REPEATED_TOOL` | Same `tool_name` + `input_hash` called N+ times in a run | N ≥ 3 | 3 = low, 4-5 = medium, 6+ = high |
| `STATE_LOOP` | Same `state` value revisited with a cycle of length ≥ 2 repeating ≥ 2 times | cycle repeats ≥ 2 | medium / high |
| `RETRY_STORM` | Same tool+input fails (`status=error`) N+ times consecutively | N ≥ 3 | medium; high if never succeeds |
| `EXECUTION_BLOAT` | `total_steps` exceeds baseline | steps > 3× project median (min 20) | low / medium |
| `TOOL_OSCILLATION` | Alternating A,B,A,B pattern with no new state | ≥ 4 alternations | medium |

**Waste estimate** for a finding = tokens, latency, and cost of the *redundant* occurrences (all but the first of a repeated group). Cost = `tokens_in × input_price + tokens_out × output_price` from `model_pricing`.

**Rules of the road**
- Thresholds live in one config module. They're documented and overridable per project later.
- One step may belong to multiple findings. The UI de-dupes display, not the data.
- Every detector ships with fixture-based tests (clean run, positive case, near-miss).

---

## 13. AI layer (Phase 5)

Input: the finding's `evidence` JSON only, never the raw run.

```json
{
  "finding": "TOOL_OSCILLATION",
  "steps": [14, 17, 20, 23],
  "tools": ["search", "browser"],
  "repetitions": 4,
  "waste_share": 0.27
}
```

Output: 1-3 sentence plain-English explanation stored in `findings.explanation`. Generated lazily on first view and cached. The UI marks it "AI-generated explanation"; detection stays deterministic.

---

## 14. Guard simulation (V2 feature)

Not a replay of the agent. It re-evaluates the recorded trace under a guard rule (e.g. "stop after the 3rd identical tool call") and reports what would have been saved.

```text
Original:   SEARCH THINK SEARCH THINK SEARCH THINK SEARCH
With guard: SEARCH THINK SEARCH THINK SEARCH ■ STOP

Potential savings: 3 tool calls · 2,184 tokens · 1.8 s · $0.03
```

---

## 15. Usage limits (free launch tier)

- Seeded read-only **demo project** (no account needed)
- Free account: 2 projects, 1,000 events/month, 100 runs/month, 7-day retention
- Enforced at ingestion with clear `429` / `402`-style errors. No payments in V1.
- Retention requires a scheduled cleanup job, an honest reason to add a scheduler later.

---

## 16. Demo agent

Ship a "Research Agent" with the repo (`/backend/demo/`):

> "Find three Python web frameworks and compare them."

Normal path: `search → read → think → search → think → search → summarize`.
Flawed path (flag): `search → search → search → search`.

The seed script loads both into the demo project so the landing page and `/demo` work immediately.

---

## 17. Deployment

```text
Vercel (Next.js)  →  FastAPI on Fly/Render/Railway  →  Neon/Supabase Postgres
```

Env vars: `DATABASE_URL`, `SESSION_SECRET`, `GITHUB_CLIENT_ID/SECRET`, `ANTHROPIC_API_KEY`, `FRONTEND_ORIGIN`.
Migrations run on deploy via Alembic. Get this deployed after Phase 2 and keep it deployed.

---

## 18. Repo layout

```text
sisyphus/
├── frontend/            # Next.js app
├── backend/
│   ├── app/
│   │   ├── api/         # routers: projects, runs, events, analysis
│   │   ├── core/        # config, auth, security
│   │   ├── db/          # models, session, migrations
│   │   ├── analysis/    # detectors/, metrics.py, simulate.py
│   │   └── main.py
│   ├── demo/            # demo agent + seed script
│   └── tests/
├── docs/                # API docs, ADRs
├── docker-compose.yml
└── README.md
```

---

## 19. Roadmap

| Phase | Time | Deliverable | Done when |
|-------|------|-------------|-----------|
| 0 | 1 d | Skeleton | Next.js calls FastAPI; docker-compose up works |
| 1 | 2 d | Ingestion | `curl` a full run into Postgres; duplicate POST is a no-op |
| 2 | 2 d | Dashboard + timeline, **deploy** | A stranger can sign in, create a project, see a run |
| 3 | 2 d | Detection engine | All 5 detectors pass fixture tests |
| 4 | 1 d | Findings UI | Each finding shows evidence and highlights steps |
| 5 | 1 d | AI explanations | Explanations render from evidence only |
| 6 | 2 d | Metrics + guard simulation | Waste tokens/latency/cost shown per run |
| 7 | opt. | Python SDK | `pip install sisyphus` works (verify the PyPI name first) |

After Phase 2 you already have a usable product.

---

## 20. Definition of done (V1)

- [ ] A new user can go from sign-in to first visible run in under 10 minutes using only the docs
- [ ] Re-sending any batch never creates duplicates
- [ ] A 10,000-event run loads the timeline without freezing (pagination)
- [ ] All five detectors have tests including near-misses
- [ ] Demo project is live and read-only
- [ ] API keys are never logged or stored in plaintext
- [ ] README has a 60-second quickstart

---

## 21. Open questions

- Auth provider: GitHub OAuth only, or add magic link?
- Which LLM-agent frameworks get example integrations first?
- Payload preview size (2 KB) vs. privacy: add an opt-out to hash-only mode?
- Should thresholds be user-configurable in V1.5?
