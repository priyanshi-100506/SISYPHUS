# SISYPHUS — Frontend Direction

Visual direction for the Next.js app, derived from the reference image: thick impasto paint in **dusty periwinkle** and **deep oxblood**, meeting along a hard diagonal.

**Precedence:** this file overrides `design.md` for color, typography, texture, motion, and all written copy (sections 10-13 are the anti-slop rules). `design.md` still governs page structure, component inventory, copy rules, and accessibility behavior. Where they conflict, `frontend.md` wins on how it looks; `project.md` wins on what exists.

---

## 1. The idea

An agent's run is a smooth, steady stroke until it gets stuck. SISYPHUS makes that boundary visible.

- **Periwinkle = motion.** Steps that move the run forward. Calm, cool, matte.
- **Oxblood = stuck.** Loops, repeats, waste. Heavy, glossy, hard to ignore.
- **The diagonal where they meet** is the product's signature: the exact step where progress turns into repetition.

Everything else stays quiet so those two colors carry meaning. If a screen has no problems, it should be almost entirely periwinkle on dark. Oxblood appears only where something is wrong.

---

## 2. Palette (sampled by eye from the reference image)

Re-sample with an eyedropper if you want exact values. These are close and tuned for UI use.

### Brand colors

| Name | Hex | From the image | Role |
|------|-----|----------------|------|
| Periwinkle | `#8FA3C9` | The flat blue body | Primary accent, links, healthy steps |
| Periwinkle light | `#B7C5E0` | Ridge highlights on the blue | Hover, selected text, chart highlights |
| Periwinkle deep | `#5F77A6` | Shadowed blue folds | Borders on accent, pressed states |
| Oxblood | `#5C0F1E` | The flat red body | Stuck fills, loop ranges, hero surface |
| Oxblood deep | `#3A0913` | Darkest red pools | Dark surfaces, backgrounds |
| Oxblood gloss | `#C65A74` | Wet highlights on the red | Stuck text, icons, strokes on dark |

### Supporting colors (not in the image, kept muted so they don't compete)

| Name | Hex | Role |
|------|-----|------|
| Sage | `#7FC4A4` | Completed / success |
| Amber | `#E3B25C` | Retry storms, medium severity |
| Coral | `#F0737C` | Failed / error (brighter and redder than oxblood gloss) |

The image has only two hues. A reliability tool still needs distinct success, warning, and failure signals, so these three are borrowed, desaturated, and used sparingly.

---

## 3. Tokens

### 3.1 Dark theme (default)

The background is not neutral black. It's oxblood pulled almost to black, so the whole app feels like it sits on the darkest paint.

```css
:root {
  /* surfaces */
  --bg:          #12080C;
  --surface:     #1B0E14;
  --surface-2:   #25141C;
  --border:      #3A2230;
  --border-soft: #2B1822;

  /* text */
  --text:        #F2EBEE;
  --text-muted:  #B8A8B0;
  --text-faint:  #85727C;

  /* brand */
  --accent:        #8FA3C9;
  --accent-light:  #B7C5E0;
  --accent-deep:   #5F77A6;
  --accent-bg:     rgba(143, 163, 201, 0.12);

  --stuck:         #C65A74;   /* text, icons, strokes on dark */
  --stuck-fill:    #5C0F1E;   /* solid fills, loop ranges */
  --stuck-deep:    #3A0913;
  --stuck-bg:      rgba(198, 90, 116, 0.14);

  /* status */
  --ok:            #7FC4A4;
  --warn:          #E3B25C;
  --danger:        #F0737C;
  --ok-bg:         rgba(127, 196, 164, 0.12);
  --warn-bg:       rgba(227, 178, 92, 0.12);
  --danger-bg:     rgba(240, 115, 124, 0.12);

  /* texture */
  --gloss: linear-gradient(180deg, rgba(255,255,255,0.22), rgba(255,255,255,0) 40%);
  --ridge: inset 0 1px 0 rgba(183, 197, 224, 0.18);
}
```

### 3.2 Light theme

Paper tinted toward periwinkle, with oxblood as ink.

```css
:root[data-theme="light"] {
  --bg:          #F1F3F9;
  --surface:     #FFFFFF;
  --surface-2:   #E8ECF5;
  --border:      #CDD5E6;
  --border-soft: #DEE3EF;

  --text:        #1F0A12;
  --text-muted:  #51404A;
  --text-faint:  #766670;

  --accent:        #3D5794;   /* darker so links pass contrast on white */
  --accent-light:  #5F77A6;
  --accent-deep:   #2C4272;
  --accent-bg:     rgba(61, 87, 148, 0.10);

  --stuck:         #8A1530;
  --stuck-fill:    #5C0F1E;
  --stuck-deep:    #3A0913;
  --stuck-bg:      rgba(138, 21, 48, 0.09);

  --ok:            #1E7A56;
  --warn:          #8F6416;
  --danger:        #BE2E3A;
}
```

Verify contrast in CI rather than trusting this file: body text ≥ 4.5:1, large text and UI borders ≥ 3:1, in both themes. Adjust the hexes, not the requirement.

### 3.3 Tailwind

```ts
// tailwind.config.ts
export default {
  darkMode: ["class", '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        "surface-2": "var(--surface-2)",
        border: "var(--border)",
        text: "var(--text)",
        muted: "var(--text-muted)",
        faint: "var(--text-faint)",
        accent: { DEFAULT: "var(--accent)", light: "var(--accent-light)", deep: "var(--accent-deep)" },
        stuck: { DEFAULT: "var(--stuck)", fill: "var(--stuck-fill)", deep: "var(--stuck-deep)" },
        ok: "var(--ok)", warn: "var(--warn)", danger: "var(--danger)",
      },
      fontFamily: {
        display: ["Fraunces", "Georgia", "serif"],
        sans: ["Geist", "system-ui", "sans-serif"],
        mono: ["Geist Mono", "ui-monospace", "Menlo", "monospace"],
      },
      borderRadius: { card: "14px", chip: "999px", tile: "10px" },
    },
  },
};
```

---

## 4. Typography

| Role | Font | Use |
|------|------|-----|
| Display | **Fraunces** (soft, optical size on) | Landing headline, page titles, the big run numbers. Its buttery, slightly swollen letterforms echo the paint. |
| UI & body | **Geist** | Everything people read: nav, labels, descriptions, buttons |
| Machine data | **Geist Mono** | Only real machine facts: run IDs, tool names, hashes, durations, token counts, JSON |

Rules:
- Load with `next/font`. Display weights 500-600; UI 400/500/600.
- Labels are **sentence case**, never all caps. "Total tokens", not "TOTAL TOKENS". The only caps allowed are the SISYPHUS wordmark.
- Don't put mono on ordinary labels just because the product is for developers. Mono is for values the user may copy.
- Tabular numerals on every metric (`font-variant-numeric: tabular-nums`).
- Line length under 80 characters for prose. Sans body 1.5 line height; Fraunces body (if ever used) 1.6.
- Scale: 12 / 14 / 16 / 20 / 28 / 44 / 64. The 64 is for the landing hero only.

---

## 5. Texture and imagery

The reference image is the mood, not wallpaper. Use texture in a few deliberate places and keep the working UI flat and legible.

**Where paint texture is allowed**
1. **Landing hero:** a cropped, darkened version of the reference, diagonal split, behind the live-run panel.
2. **Empty states:** a small paint-smear crop as an illustration.
3. **Loop minimap and stuck ranges:** see 6.5. This is the signature element.
4. **Primary button edge:** a faint highlight along the top edge.

**Where it is not allowed:** behind tables, timelines, forms, charts, or any text-heavy area.

**Asset handling**
- Save the reference as `frontend/public/brand/paint-source.jpg`. Generate `paint-hero.webp` (2400 px wide, darkened ~35%) and `paint-small.webp` (800 px) for empty states. Always set explicit width/height and `alt=""` (decorative).
- Overlay the hero image with `linear-gradient(90deg, var(--bg) 0%, transparent 60%)` so text sits on a calm area.
- If reusing the photo raises licensing questions, recreate the effect with an SVG: two flat fills split on a diagonal, an `feTurbulence` noise filter at 4-6% opacity, and 1-2 px highlight strokes along the edge.

**Surface treatment**
- Cards are flat `--surface` with a 1 px `--border-soft`. No drop shadows.
- Add `box-shadow: var(--ridge)` on raised elements (cards, buttons, the selected row). It reads as the thin catch-light on a paint ridge.
- Only glossy stuck elements may use `--gloss`, so gloss always means "something is wrong here".

---

## 6. Components

### 6.1 Buttons
- **Primary:** background `--accent`, text `--bg`, radius 10 px, `--ridge` highlight. Hover → `--accent-light`. Label says the action: "Create project", "Copy key".
- **Secondary:** transparent, 1 px `--border`, text `--text`. Hover → `--surface-2`.
- **Destructive:** `--danger-bg` fill, `--danger` text.
- Focus ring: 2 px `--accent-light`, 2 px offset.

### 6.2 Stat tile
Label in 13 px muted sentence case over a Fraunces numeral (36 px). The loops tile turns its numeral `--stuck` when the count is above zero, and nothing else changes. No icons, no gradients.

### 6.3 Status badge
Pill, icon plus text, tinted background:

| State | Style |
|-------|-------|
| Completed | `--ok` on `--ok-bg`, ✓ |
| Loop detected | `--stuck` on `--stuck-bg`, ↻ |
| Retrying | `--warn` on `--warn-bg`, ⚠ |
| Failed / timeout | `--danger` on `--danger-bg`, ✕ |
| Running | `--accent` on `--accent-bg`, ● with slow pulse |

### 6.4 Timeline step
- Normal steps: faint left rule in `--border-soft`, tool name in `--text`, preview in `--text-muted`.
- Think steps are quieter (`--text-faint`).
- Steps inside a finding get a 3 px left stroke in `--stuck` and a `--stuck-bg` row tint.
- The first redundant step in a finding gets a small "repeat 2 of 6" chip so the user sees exactly where progress stopped.
- Selected row: `--surface-2` plus `--ridge`.

### 6.5 Loop minimap (the signature element)
A horizontal strip above the timeline, one tick per step.

- Healthy steps: thin `--accent-deep` ticks of equal height.
- A flagged range is drawn as a **thick oxblood stroke** (`--stuck-fill`) with a `--gloss` highlight on top and a slightly irregular leading edge (an SVG path with a small noise displacement), like the red paint in the reference.
- Where a normal stroke meets a flagged stroke, draw the edge on a diagonal (about 20°) rather than vertical. That is the "periwinkle meets oxblood" moment from the image.
- Hover shows the finding name; click jumps to the first step; the matching timeline rows highlight in sync.

This is where the boldness goes. Keep every other element restrained.

### 6.6 Finding card
- 3 px `--stuck` left edge for loop findings, `--warn` for retry storms.
- Title in Geist 600, sentence case: "Repeated tool call".
- Summary from the deterministic template in section 12: "`search` ran 6 times with the same input (steps 4-9). About 2,184 tokens, 1.8 s, $0.03 wasted."
- Severity as a text chip (Low, Medium, High), not color alone.
- Template sentence always visible; the AI explanation is collapsed by default under the label "Explanation, written by an AI from the evidence above" (see section 12).
- Actions: **View evidence**, **Simulate guard**.

### 6.7 Guard simulation view
Two minimaps stacked: "Recorded" with the oxblood stroke, "With guard" where the stroke is cut short and replaced by a flat periwinkle end cap. The savings summary sits beneath in Fraunces numerals. Label: "Simulated from the recorded trace. Your agent is not re-run."

### 6.8 Charts (Recharts)
- Series colors in order: `--accent`, `--accent-light`, `--stuck`. Max three series.
- Stacked run status chart: completed `--accent-deep`, loop `--stuck-fill` with a `--stuck` top stroke, failed `--danger`.
- Gridlines `--border-soft`, axis text `--text-faint` 12 px. Tooltips use `--surface-2` with mono values.
- Every chart has a "View as table" toggle.

### 6.9 Code blocks
`--surface-2` background, 1 px `--border-soft`, Geist Mono 13 px, copy button top right. Syntax colors reuse the palette: strings `--accent-light`, keywords `--stuck`, comments `--text-faint`.

### 6.10 Empty and loading states
- Loading: skeleton rows in `--surface-2`, no spinners.
- Empty: a small paint-smear crop, one sentence, one next action (a copyable `curl`).

---

## 7. Pages

### 7.1 Landing

One idea per screen. The hero is the diagonal.

```text
┌──────────────────────────────────────────────────────┐
│ SISYPHUS                                  Docs  Demo │
│                                                      │
│  See where your                  ╲   periwinkle      │
│  AI agent gets stuck.             ╲  paint, calm     │
│                                    ╲                 │
│  Send your agent's tool calls. See  ╲  ┌───────────┐ │
│  which repeated, and the cost.       ╲ │ demo run  │ │
│                                oxblood│ 31 steps  │ │
│  [Try the demo] [Create project]paint │ ↻ loop    │ │
│                                       └───────────┘ │
└──────────────────────────────────────────────────────┘
```

- Left-aligned text on the calm side; the paint split runs behind the right half.
- The live-run panel is a real component fed by the seeded flawed run, with its minimap showing the oxblood stroke. No big-number-plus-gradient treatment.
- Below the fold: **How it works** as four numbered steps, since they are a true sequence: 1. Create a project and copy its key. 2. POST your agent's tool calls to the API. 3. Open the run and read the findings. 4. Click a finding to see the exact steps. Each step shows a real request or screenshot from the demo. Don't number anything else.
- Headline in Fraunces 64 px, one weight, no highlighted word.

### 7.2 Dashboard and project pages
- Quiet periwinkle-on-dark. Stat tiles in a row, then charts, then recent runs.
- Oxblood appears only on loop and failure counts, the loop segment of the stacked chart, and flagged run rows.
- A project with no problems should contain no oxblood at all.

### 7.3 Run page (hero feature)
- Header: run ID in mono, status badge, input prompt in Fraunces 20 px (truncate, expandable).
- Metrics line in plain sentence-case labels: "18.4 s", "31 steps", "8,412 tokens", "$0.08 estimated".
- Loop minimap full width, then the two-column layout from `design.md` (timeline 60%, findings 40%, sticky).
- Hovering a finding shades its stretch on the minimap and the timeline together.

### 7.4 Login, settings, docs
Plain surfaces, no paint imagery. Docs use the code-block style from 6.9 and sentence-case headings.

---

## 8. Motion

- Default transitions: 140 ms ease-out on hover, drawers, and highlights.
- **One signature moment:** when a run page first loads with findings, the oxblood stroke on the minimap draws left to right over about 600 ms. It plays once per page view and never loops.
- Running status pulse: 1.6 s opacity fade, only on the status badge.
- No entrance animations on sections, no hover lifts on cards.
- Honor `prefers-reduced-motion`: the stroke appears instantly and pulses stop.

---

## 9. Accessibility

- Periwinkle and oxblood differ strongly in **lightness**, not just hue, so they remain distinguishable for most color-vision differences. Still, pair every state with an icon and text.
- Never put `--stuck-fill` text on `--bg`; use `--stuck` (the lighter gloss tone) for text and icons on dark.
- Keyboard: `j`/`k` through steps, `Enter` for details, `Esc` closes drawers, `[` and `]` jump between findings.
- The minimap is a real control: `role="img"` with a text summary ("Steps 4-9 flagged as repeated search"), plus keyboard-focusable segments.
- Touch targets at least 40 px. Visible focus everywhere.

---

## 10. Anti-slop: visuals

"Slop" is anything that looks like it came from a template or a model's defaults and would fit any product. The test for every element: **could this appear unchanged on another SaaS site?** If yes, replace it with something specific to agent traces, or cut it.

---

## 11. Anti-slop: text and copy

Applies to UI strings, docs, empty states, errors, emails, README, and anything an AI writes inside the product.

### Banned vocabulary

```text
seamless, seamlessly, effortless, effortlessly, powerful, robust, leverage,
unlock, supercharge, elevate, empower, streamline, revolutionize, cutting-edge,
next-generation, game-changing, holistic, delve, dive into, journey, landscape,
ecosystem (unless literal), actionable insights, insights (as a vague noun),
AI-powered (as a feature adjective), intelligent, smart, magic, magical,
simply, just (as in "just add"), oops, whoops, awesome, "let's", "in today's",
"at the end of the day", "it's worth noting", "plays a crucial role",
"not just X, but Y", "whether you're X or Y"
```

### Landing copy (replace any earlier draft)

```text
Headline     See where your AI agent gets stuck.
Subhead      Send your agent's tool calls to SISYPHUS. It shows which calls
             repeated, which retries failed, and what they cost.
Buttons      Try the demo      Create a project
Demo label   Demo run: 31 steps, 8,412 tokens, 18.4 s
Demo finding search ran 6 times with the same input. About 2,184 tokens wasted.
```

---

## 12. Anti-slop: AI-written text inside the product

### Deterministic templates

```text
REPEATED_TOOL       `{tool}` ran {n} times with the same input (steps {a}-{b}).
STATE_LOOP          Steps {a}-{b} returned to an earlier state {k} times.
RETRY_STORM         `{tool}` failed {n} times in a row with {code} (steps {a}-{b}).
EXECUTION_BLOAT     This run took {n} steps. The median for this project is {m}.
TOOL_OSCILLATION    The agent alternated between `{x}` and `{y}` {n} times (steps {a}-{b}).
```

Append the waste line only if it was computed: "About {tokens} tokens, {seconds} s, ${cost} wasted."

---

## 13. Slop audit

Automated script in `scripts/copy-lint.sh`.
