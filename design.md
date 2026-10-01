# SISYPHUS — Design Guide

A calm, precise, dark-first interface for developers. It should feel like a good debugger: dense where it needs to be, quiet everywhere else.

---

## 1. Design principles

1. **Evidence first.** Every warning is one click from the steps that caused it.
2. **Scan, then dive.** Status and totals at the top, timeline in the middle, details on demand.
3. **Never rely on color alone.** Pair color with an icon or label (✓ ⚠ ✕).
4. **Monospace for machine facts, sans for human text.** IDs, tools, hashes, and durations are mono.
5. **Calm by default.** Only problems get saturated color. Healthy runs stay neutral.
6. **Explain, don't alarm.** Copy is plain, specific, and quantified.

---

## 2. Brand

- **Name:** SISYPHUS (wordmark in caps, wide tracking)
- **Tagline:** *See where your AI agent gets stuck.*
- **Motif:** a boulder and a slope, expressed as a simple upward-diagonal line that loops back. Use sparingly: logo mark, empty states, loader.
- **Voice:** dry, precise, a little wry. Never cute about failures.

---

## 3. Color tokens

Dark is the default; light is supported.

```css
:root {
  /* surfaces */
  --bg:          #0B0D10;
  --surface:     #12151A;
  --surface-2:   #181C23;
  --border:      #242A33;

  /* text */
  --text:        #E6E8EB;
  --text-muted:  #9AA3AF;
  --text-faint:  #6B7280;

  /* brand / accent */
  --accent:      #7C9CFF;   /* links, selection, focus */

  /* status */
  --ok:          #3DDC97;
  --warn:        #F5B544;
  --danger:      #FF6B6B;
  --info:        #5BC0EB;

  /* status backgrounds (12% tint) */
  --ok-bg:       rgba(61, 220, 151, 0.12);
  --warn-bg:     rgba(245, 181, 68, 0.12);
  --danger-bg:   rgba(255, 107, 107, 0.12);
}

:root[data-theme="light"] {
  --bg:          #FAFAF9;
  --surface:     #FFFFFF;
  --surface-2:   #F3F4F6;
  --border:      #E5E7EB;
  --text:        #14171C;
  --text-muted:  #4B5563;
  --text-faint:  #6B7280;
  --accent:      #3B5BDB;
  --ok:          #0E9F6E;
  --warn:        #B7791F;
  --danger:      #D64545;
  --info:        #1D7FA8;
}
```

Check contrast: body text ≥ 4.5:1, large text and UI borders ≥ 3:1.

### Event-type colors (timeline)

| Type | Color | Icon |
|------|-------|------|
| THINK | `--text-faint` | ◌ |
| TOOL | `--accent` | ▸ |
| ERROR | `--danger` | ✕ |
| LOOP / flagged | `--warn` | ⚠ |
| END | `--ok` | ■ |

---

## 4. Typography

| Role | Font | Notes |
|------|------|-------|
| UI / body | Inter (fallback: system-ui, sans-serif) | 14 px base |
| Data / code | JetBrains Mono (fallback: ui-monospace, Menlo, monospace) | IDs, tools, durations, JSON |
| Wordmark | Inter, 600, uppercase, letter-spacing 0.18em | |

Scale: 12 / 14 / 16 / 20 / 28 / 40. Line height 1.5 for text, 1.3 for headings.
Use tabular numerals (`font-variant-numeric: tabular-nums`) for all metrics.

---

## 5. Layout and spacing

- 4 px base grid; common steps: 4, 8, 12, 16, 24, 32, 48.
- App shell: left sidebar (220 px, collapsible) + content (max-width 1200 px).
- Cards: radius 10 px, 1 px `--border`, background `--surface`, no heavy shadows.
- Breakpoints: 640 / 1024 / 1280. On mobile the sidebar becomes a top menu, and the timeline switches to a single column.

---

## 6. Core components

### Stat tile
Label (12 px, muted, uppercase) over value (28 px, mono). Optional delta line. Used on the dashboard.

### Status badge
`✓ COMPLETED` (ok), `⚠ LOOP` (warn), `✕ FAILED` / `TIMEOUT` (danger), `● RUNNING` (info, subtle pulse). Always icon plus text.

### Run row
`[badge]  #8F30   31 steps   18.4s   8.4k tokens   $0.08   2m ago` → whole row clickable, keyboard focusable.

### Timeline step
```text
 04  ▸ SEARCH   "Paris hotels"            450 ms   412↑ 96↓
 05  ▸ SEARCH   "Paris hotels"            430 ms   ⚠ repeat #2
```
- Index in mono, type icon, tool name, short input preview, latency, tokens.
- Flagged steps get `--warn-bg` and a left border; hovering a finding highlights its steps.
- Clicking a step opens the detail drawer (input/output previews, hashes, error code).
- Virtualize beyond ~200 rows.

### Finding card
```text
⚠ Repeated tool call                         HIGH
search("Paris hotels") called 6 times
Steps 4–9  ·  Waste ≈ 2,184 tokens · 1.8 s · $0.03

AI explanation (generated)
The agent repeated the same search without new results…

[View evidence]  [Simulate guard]
```
Severity shown as text + color chip. The AI explanation is visibly labeled and collapsible.

### Evidence drawer
Right-side panel: the exact events (indexed), their hashes, the rule that matched, and the threshold used (`N ≥ 3`). Copy-as-JSON button.

### Loop minimap
A thin horizontal strip of colored ticks (one per step) above the timeline. Flagged ranges are shaded. Click to jump.

### Code block
Mono, `--surface-2`, copy button, language label. Used heavily in docs and onboarding.

### Empty / loading / error states
- **Empty:** short sentence plus the exact next action (a `curl` snippet).
- **Loading:** skeleton rows, not spinners.
- **Error:** what happened, what to try, request ID.

---

## 7. Pages

### 7.1 Landing `/`
```text
SISYPHUS
See where your AI agent gets stuck.

Observe execution. Detect loops. Understand failures. Reduce wasted work.

[Try Demo]  [Connect Your Agent]
```
Below the fold:
1. **Live execution panel** (static seeded run): `31 steps · 8,412 tokens · 18.4 s`, `⚠ Loop detected`, and a mini timeline `SEARCH → THINK → SEARCH → THINK`.
2. **How it works:** `01 Instrument · 02 Observe · 03 Detect · 04 Investigate`.
3. Footer: docs, GitHub, status.

Keep it to one screen of message plus one demo panel. Goal: understood in 30 seconds.

### 7.2 Demo `/demo`
Read-only seeded project, full dashboard and run pages, no sign-in. A banner states "Demo data, read-only" with a [Connect your own agent] button.

### 7.3 Login `/login`
Single card. "Continue with GitHub" (plus email magic link if enabled). No marketing.

### 7.4 Projects `/dashboard/projects`
Grid of project cards: name, language, run count, loops (last 7 days), last activity. [New project] opens a modal.

**Create project modal:** name, language → on success show **Project ID** and **API key once**, with a copy button and the message "You won't see this key again." Followed by a ready-to-paste `curl` quickstart.

### 7.5 Project `/dashboard/project/[id]`
```text
Research Agent
────────────────────────────────────────
RUNS  143   LOOPS  7   FAILED  12   TOKENS  184,291
────────────────────────────────────────
[chart: runs/day, stacked ok · loop · failed]
[chart: tokens/day]  [chart: p50/p95 latency]

Recent runs (filter: all · loops · failed)
✓ #8F31   12 steps   4.2 s
⚠ #8F30   31 steps  18.4 s
✓ #8F29    9 steps   3.1 s
✕ #8F28   timeout   42.2 s
```
Tabs: Runs · Settings (API key prefix, rotate key, delete project).

### 7.6 Run `/dashboard/run/[id]` (hero)
```text
RUN #8F30                     ⚠ TERMINATED
Duration 18.4 s · Steps 31 · Tokens 8,412 · Cost $0.08
─────────────────────────────────────────────
[Loop minimap]

EXECUTION                         │ FINDINGS
01 ◌ THINK                        │ ⚠ Repeated search · 6×
02 ▸ SEARCH  "Paris hotels"       │ ⚠ No state progress · steps 4–9
...                               │ ⚠ Token waste ≈ 31%
09 ⚠ LOOP                         │ [View evidence] [Simulate guard]
```
- Two columns on desktop (timeline 60%, findings 40%, sticky). Stacked on mobile.
- Hovering a finding highlights its steps in the timeline and the minimap. Clicking scrolls to the first step.
- Header shows the input prompt, truncated, expandable.

### 7.7 Guard simulation
Modal or tab within the run page. Side-by-side "Original" vs "With guard" timelines, rule selector (e.g. max 3 identical calls), and a savings summary (calls, tokens, seconds, dollars). Label clearly: *Simulation based on the recorded trace; the agent is not re-run.*

### 7.8 Docs `/docs`
Left nav + content. Sections: Quickstart · Authentication · Events schema · Idempotency · Detectors (each with a definition and threshold) · Limits · Errors. Every endpoint has a copyable `curl` and a response example.

### 7.9 Settings `/settings`
Account email, theme, sign out, delete account/data.

---

## 8. Charts (Recharts)

- Max 3 series per chart. Gridlines faint; no 3D, no gradients.
- Status colors only for status meaning; token and latency use `--accent` and `--info`.
- Always show units in axis labels. Tooltips in mono.
- Provide a table view toggle for accessibility.

---

## 9. Motion

- 120–180 ms ease-out for hover, drawers, and highlights.
- Running status: slow 1.6 s opacity pulse.
- Respect `prefers-reduced-motion` (disable pulses and transitions).
- No parallax or decorative animation. The one flourish allowed is the boulder-loop mark on the landing hero.

---

## 10. Accessibility

- Full keyboard navigation: `j/k` move through timeline steps, `Enter` opens details, `Esc` closes drawers, `/` focuses search.
- Visible focus ring (2 px `--accent`, 2 px offset).
- Status conveyed by icon plus text.
- Semantic landmarks, labeled controls, `aria-live="polite"` for live run updates.
- Minimum hit area 40×40 px on touch.

---

## 11. Copy guidelines

| Instead of | Write |
|-----------|-------|
| "Oops! Something went wrong" | "Couldn't load this run. Try again, or share request ID `req_9a1…`." |
| "Loop detected!!!" | "Repeated tool call: `search` ran 6 times with identical input." |
| "Great job!" | "Run analyzed. 3 findings." |

- Numbers are always formatted (`8,412`, `$0.08`, `18.4 s`).
- Say "estimated" for cost and waste.
- Error codes appear in mono.

---

## 12. Tailwind setup (sketch)

```ts
// tailwind.config.ts
export default {
  darkMode: ["class", '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)", surface: "var(--surface)", "surface-2": "var(--surface-2)",
        border: "var(--border)", text: "var(--text)", muted: "var(--text-muted)",
        accent: "var(--accent)", ok: "var(--ok)", warn: "var(--warn)", danger: "var(--danger)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "Menlo", "monospace"],
      },
      borderRadius: { card: "10px" },
    },
  },
};
```

---

## 13. Component build order

1. Tokens + theme toggle + app shell
2. Stat tile, status badge, run row
3. Timeline step + detail drawer
4. Finding card + evidence drawer
5. Loop minimap + highlight linking
6. Charts
7. Guard simulation view
8. Landing + docs polish
