# SISYPHUS — Skills Map

SISYPHUS is built so the product teaches the systems concepts. You don't need to know them before starting. You learn each one **when a real problem forces it**.

**Rule:** don't add infrastructure because it looks impressive. Add it when you can name the symptom that demands it.

---

## 1. Baseline skills (needed from day one)

| Skill | Used for | Good enough when you can... |
|-------|----------|------------------------------|
| Python 3.11+ & type hints | Backend, detectors | Write typed functions and dataclasses/Pydantic models |
| FastAPI | HTTP API | Build routers, dependencies, request/response models, error handlers |
| SQL & PostgreSQL | Storage | Write joins, aggregates, `GROUP BY`, `ON CONFLICT`, read `EXPLAIN` |
| SQLAlchemy 2.0 + Alembic | ORM, migrations | Create a model, generate and apply a migration |
| REST design | Public API | Choose status codes, pagination, error shapes consistently |
| TypeScript & React | Frontend | Build typed components with hooks |
| Next.js (App Router) | Pages, routing | Build server and client components, fetch data, handle auth redirects |
| Tailwind CSS | Styling | Implement `design.md` tokens |
| Docker & docker-compose | Local dev | Run Postgres + backend + frontend with one command |
| Git & GitHub | Workflow | Small commits, branches, PRs, CI basics |
| pytest | Testing | Fixture-based tests, a test DB, parametrized cases |

---

## 2. Systems-learning progression

Each stage has a **trigger** (what hurts), the **concept** it teaches, a **build task**, and a **done-when** check.

### Stage 1 — API + database + transactions
- **Trigger:** none; this is the foundation.
- **Concepts:** schema design, constraints, foreign keys, transactions, migrations.
- **Build:** projects, runs, events tables; ingestion endpoints.
- **Done when:** a full run lands in Postgres, and a failed batch insert rolls back cleanly.

### Stage 2 — Concurrency and ordering
- **Trigger:** two batches for the same run arrive at once or out of order.
- **Concepts:** race conditions, isolation levels, row locks, ordering by sequence number rather than arrival time.
- **Build:** a script that fires 50 parallel requests at one run.
- **Done when:** totals (`total_steps`, tokens) are always correct, and the timeline order is deterministic.

### Stage 3 — Idempotency
- **Trigger:** a client retries a timed-out POST and duplicates appear.
- **Concepts:** idempotent writes, unique constraints, `ON CONFLICT DO NOTHING`, at-least-once delivery.
- **Build:** `UNIQUE (run_id, sequence_number)` (introduced in Phase 1 on purpose); return `{accepted, duplicates}`.
- **Done when:** sending the same batch 10 times yields the same database state.

### Stage 4 — Scale of a single run
- **Trigger:** a run with 10,000 events makes the UI slow.
- **Concepts:** cursor pagination, composite indexes, `EXPLAIN ANALYZE`, bulk inserts, payload truncation.
- **Build:** paginated `/events`, virtualized timeline list, batch inserts.
- **Done when:** timeline first paint < 1 s on 10k events; ingestion of 10k events measured and recorded.

### Stage 5 — Separating ingestion from analysis
- **Trigger:** `/complete` is slow because analysis runs inline.
- **Concepts:** background jobs, queues, job state, decoupling latency from work.
- **Build:** a `jobs` table (Postgres as a simple queue) plus one worker process, *before* reaching for Redis.
- **Done when:** `/complete` returns in < 200 ms and analysis finishes asynchronously.

### Stage 6 — Duplicate processing
- **Trigger:** two workers pick up the same run.
- **Concepts:** `SELECT ... FOR UPDATE SKIP LOCKED`, leases, idempotent jobs, distributed coordination.
- **Build:** claim jobs atomically; make analysis safe to re-run (replace findings, don't append).
- **Done when:** running 3 workers produces exactly one set of findings per run.

### Stage 7 — Failure and recovery
- **Trigger:** a worker crashes mid-analysis.
- **Concepts:** retries with backoff, visibility timeouts, dead-letter handling, poison messages.
- **Build:** retry counter, `failed` state, a dead-letter view in an admin page.
- **Done when:** killing a worker mid-job results in the job being retried and completed by another.

### Stage 8 — Live execution
- **Trigger:** users want to watch a run as it happens.
- **Concepts:** Server-Sent Events vs WebSockets, backpressure, reconnection, `Last-Event-ID`.
- **Build:** an SSE stream of new events and findings for a running run.
- **Done when:** the timeline updates live and resumes correctly after a dropped connection.

### Stage 9 — Operating it
- **Trigger:** real users, real traffic.
- **Concepts:** rate limiting, caching, connection pooling, structured logging, metrics, tracing, health checks.
- **Build:** per-key rate limits, request IDs in logs, `/healthz`, basic dashboards of your own service.
- **Done when:** you can answer "what is slow and why?" from your own telemetry.

---

## 3. Domain skills

| Skill | Where it shows up |
|-------|-------------------|
| Agent/LLM execution patterns (ReAct, tool use, retries) | Understanding what traces look like |
| Token accounting and model pricing | Cost and waste estimates |
| Hashing & canonical JSON | `input_hash`, `output_hash`, `state_hash` |
| Sequence/pattern detection (cycles, runs, alternation) | Detectors |
| Prompting from structured evidence | AI explanations |
| API key design (entropy, hashing, prefixes, rotation) | Ingestion auth |
| OAuth / sessions / CSRF | Dashboard auth |
| Data privacy basics (PII in payloads, truncation, retention) | Event previews, 7-day cleanup |

---

## 4. Frontend and design skills

| Skill | Used for |
|-------|----------|
| Data visualization (Recharts) | Dashboard charts, token and latency trends |
| Timeline/list virtualization | 10k-step runs |
| Information hierarchy | Run page: status, then timeline, then findings, then evidence |
| Accessibility basics | Contrast, keyboard navigation, non-color status cues |
| Empty/loading/error states | First-run experience |
| Technical writing | Docs, quickstart, error messages |

---

## 5. Engineering practices to keep throughout

- **Detectors are pure functions** with fixture tests (clean, positive, near-miss).
- **Every schema change is a migration.** No manual DB edits.
- **Write an ADR** (short decision record in `docs/adr/`) whenever you add infrastructure. Include the symptom that justified it.
- **Measure before optimizing.** Record numbers (ingest rate, p95 latency) in the README.
- **Secrets never in git.** `.env.example` only.
- **Ship small, deploy often.** Deploy after Phase 2 and keep main deployable.

---

## 6. Phase-to-skill map

| Phase | Primary skills |
|-------|---------------|
| 0 Skeleton | Docker, FastAPI hello-world, Next.js fetch, CORS |
| 1 Ingestion | SQL, SQLAlchemy, idempotency, batching, API-key hashing |
| 2 Dashboard | Next.js, auth/session, pagination, Recharts, deployment |
| 3 Detection | Pattern detection, pytest fixtures, pure-function design |
| 4 Findings UI | Information design, evidence highlighting |
| 5 AI | Structured prompting, caching generated text |
| 6 Metrics + simulation | Cost model, aggregation queries |
| 7 SDK | Packaging, PyPI, API ergonomics, versioning |

---

## 7. Self-check before moving on

Before leaving each stage, you should be able to explain, out loud and without notes:

1. What broke, and how did you notice?
2. Why does your fix work, and what are its limits?
3. What would you do if the load were 100× larger?
4. What did you deliberately **not** build, and why?

If you can't answer these, you haven't learned the stage yet. Stay on it.
