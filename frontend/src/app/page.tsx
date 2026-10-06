"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { CreateProjectModal } from "@/components/projects/create-project-modal";

/* ─── data constants (mirrors the HTML prototype exactly) ─── */
const N: Record<string, string> = { t: "think", s: "search", r: "read_url", f: "summarize", e: "end" };
const Q = "django vs flask vs fastapi benchmarks";
const RS = 6, RE = 16;

const RAW = `t|Plan: three frameworks, then compare|312
s|python web frameworks 2026|912
t||341
r|fastapi.tiangolo.com|1208
t||297
s|${Q}|874
t||358
s|${Q}|861
t||326
s|${Q}|902
t||349
s|${Q}|847
t||331
s|${Q}|889
t||364
s|${Q}|858
t||318
r|flask.palletsprojects.com|1104
t||372
r|djangoproject.com|1321
t||305
s|fastapi async performance|796
t||344
r|techempower.com/benchmarks|1893
t||381
s|flask production deployment|818
t||336
r|docs.djangoproject.com/en/5.1/topics/async|1047
t||327
f|Compare three frameworks|1460
e||0`;

interface Step { n: number; k: string; x: string; ms: number; ti: number; to: number; }

const L: Step[] = RAW.split("\n").map((l, i) => {
  const [k, x, m] = l.split("|");
  const n = i + 1;
  const t = k === "t";
  return { n, k, x, ms: +m, ti: t ? 220 + n * 14 + (n * 37 % 53) : 52 + (n * 19 % 40), to: t ? 70 + (n * 29 % 41) : 10 + (n * 13 % 30) };
});

const sum = (a: Step[], f: (e: Step) => number) => a.reduce((s, e) => s + f(e), 0);
const cost = (e: Step) => e.ti * 3e-6 + e.to * 15e-6;
const agg = (a: Step[]) => ({ n: a.length, tok: sum(a, e => e.ti + e.to), ms: sum(a, e => e.ms), c: sum(a, cost) });

const T = agg(L);
const W = agg(L.slice(6, 16));
const G = agg(L.slice(10, 16));

const f0 = (n: number) => n.toLocaleString("en-US");
const sec = (m: number) => (m / 1000).toFixed(1);
const usd = (c: number) => "$" + c.toFixed(2);

function djb2(s: string) {
  let a = 5381;
  for (const c of s) a = ((a * 33) ^ c.charCodeAt(0)) >>> 0;
  return a.toString(16).padStart(8, "0");
}

let gid = 0;
function mm(cut?: number): string {
  const id = "g" + gid++;
  const end = cut || RE;
  const a = (RS - 1) * 20 + 2;
  const b = end * 20 - 2;
  const p = `M${a + 8} 7L${a + 70} 5L${b + 7} 9L${b + 3} 28L${b - 7} 50L${a + 60} 48L${a - 6} 46L${a + 1} 27Z`;
  let s = `<svg class="mm" viewBox="0 0 620 56" role="img" aria-label="Steps ${RS} to ${RE} flagged as repeated search"><defs><linearGradient id="${id}" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".32"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/></linearGradient></defs><g class="stroke"><path d="${p}" fill="var(--sf)"/><path d="${p}" fill="url(#${id})"/></g>`;
  L.forEach(e => {
    const x = (e.n - 1) * 20 + 10;
    const hh = e.k === "t" ? 12 : 24;
    const inR = e.n >= RS && e.n <= end;
    const gone = cut && e.n > cut && e.n <= RE;
    s += `<line x1="${x}" x2="${x}" y1="${28 - hh / 2}" y2="${28 + hh / 2}" stroke="${inR ? "#E9C9D1" : e.k === "t" ? "var(--tick)" : "var(--ac)"}" stroke-width="3" stroke-linecap="round" opacity="${gone ? .2 : 1}"/>`;
  });
  if (cut) s += `<rect x="${cut * 20}" y="8" width="3" height="40" rx="1.5" fill="var(--ac)"/>`;
  return s + "</svg>";
}

const met = (b: string, s: string) => `<div><b>${b}</b><span>${s}</span></div>`;

/* ─── Chart ─── */
const DT = [9, 12, 8, 11, 10, 7, 6, 13, 12, 9, 11, 14, 10, 11];
const DL = [0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 2, 0, 1];
const DF = [1, 0, 1, 2, 0, 1, 0, 1, 2, 0, 1, 1, 1, 1];
const dn = (i: number) => i < 12 ? `Sep ${19 + i}` : `Oct ${i - 11}`;

function buildChart(): string {
  let c = `<svg viewBox="0 0 570 164" width="100%" role="img" aria-label="Runs per day for the last 14 days"><line x1="0" x2="570" y1="140.5" y2="140.5" stroke="var(--soft)"/>`;
  DT.forEach((t, i) => {
    const x = i * 40 + 10;
    const ok = t - DL[i] - DF[i];
    let y = 140;
    const bar = (v: number, f: string, top?: boolean) => {
      if (!v) return "";
      y -= v * 8;
      return `<rect x="${x}" y="${y}" width="28" height="${v * 8}" rx="2" fill="${f}"/>${top ? `<rect x="${x}" y="${y}" width="28" height="2" fill="var(--st)"/>` : ""}`;
    };
    c += `<g><title>${dn(i)}: ${ok} completed, ${DL[i]} loops, ${DF[i]} failed</title>${bar(ok, "var(--tick)")}${bar(DL[i], "var(--sf)", true)}${bar(DF[i], "var(--dg)")}</g>`;
  });
  c += `<g font-size="11" fill="var(--fa)"><text x="10" y="157">Sep 19</text><text x="304" y="157" text-anchor="middle">Sep 26</text><text x="562" y="157" text-anchor="end">Oct 2</text></g></svg>`;
  return c;
}

/* ─── Runs table ─── */
const B: Record<string, [string, string]> = {
  ok: ["✓", "Completed"],
  loop: ["↻", "Loop detected"],
  to: ["✕", "Timeout"],
  fail: ["✕", "Failed"],
};
const R: [string, string, number | string, string, string, string, string][] = [
  ["ok", "8F31", 12, "4.2 s", "2,914", "$0.02", "6 min ago"],
  ["loop", "8F30", T.n, sec(T.ms) + " s", f0(T.tok), usd(sum(L, cost)), "41 min ago"],
  ["ok", "8F2F", 9, "3.1 s", "2,206", "$0.01", "1 h ago"],
  ["to", "8F2E", 27, "42.2 s", "6,031", "$0.04", "2 h ago"],
  ["ok", "8F2D", 14, "5.8 s", "3,477", "$0.02", "3 h ago"],
  ["loop", "8F2C", 24, "15.9 s", "7,102", "$0.06", "5 h ago"],
  ["ok", "8F2B", 11, "3.9 s", "2,688", "$0.02", "yesterday"],
  ["fail", "8F2A", 5, "1.7 s", "1,142", "$0.01", "yesterday"],
];

function buildList(filter: string): string {
  return R.filter(r => filter === "all" || (filter === "loop" ? r[0] === "loop" : r[0] === "to" || r[0] === "fail"))
    .map(r => {
      const isRun = r[1] === "8F30";
      const tag = isRun ? "button" : "div";
      return `<${tag} class="rr" ${isRun ? 'data-go="run"' : ""}><span class="bd b-${r[0]}">${B[r[0]][0]} ${B[r[0]][1]}</span><span class="mono">#${r[1]}</span><span>${r[2]} steps</span><span class="mono">${r[3]}</span><span class="mono">${r[4]}</span><span class="mono">${r[5]}</span><span>${r[6]}</span></${tag}>`;
    }).join("");
}

/* ─── Findings ─── */
const FD = [
  {
    t: "Repeated tool call", s: "High",
    d: `<code>search</code> ran 6 times with the same input (steps 6–16).`,
    w: true,
    x: "The agent ran the same benchmark search six times between steps 6 and 16. Each call returned identical output, so the run made no progress in that range.",
    ev: { finding: "REPEATED_TOOL", tool: "search", input_hash: djb2("s" + Q), steps: [6, 8, 10, 12, 14, 16], repetitions: 6, rule: "same tool and input_hash, 3 or more" },
  },
  {
    t: "No state progress", s: "Medium",
    d: "Steps 6–16 returned the same output 6 times. The run did not reach a new state.",
    w: false,
    x: "",
    ev: { finding: "STATE_LOOP", output_hash: djb2("os" + Q), steps: [6, 8, 10, 12, 14, 16], repetitions: 6, rule: "same output_hash, repeated 2 or more times" },
  },
];

function buildFindings(): string {
  return FD.map(f =>
    `<article class="fc" tabindex="0">
      <div class="fh"><h3>${f.t}</h3><span class="sv">${f.s}</span></div>
      <p>${f.d}</p>
      ${f.w ? `<p class="m">About ${f0(W.tok)} tokens, ${sec(W.ms)} s, ${usd(W.c)} wasted (steps 7–16).</p>
      <details><summary>Explanation, written by an AI from the evidence above</summary><p>${f.x}</p></details>` : ""}
      <div class="ac">
        <button class="btn" data-ev>View evidence</button>
        ${f.w ? '<button class="btn" data-gd>Simulate guard</button>' : ""}
      </div>
      <pre class="ev" hidden>${JSON.stringify(f.ev, null, 2)}</pre>
    </article>`
  ).join("");
}

function buildTimeline(): string {
  let rc = 0;
  return L.map(e => {
    const fl = e.n >= RS && e.n <= RE;
    const r = e.k === "s" && e.x === Q ? ++rc : 0;
    return `<button class="row ${e.k === "t" ? "t" : ""} ${fl ? "f" : ""}" data-n="${e.n}">
      <span class="n">${String(e.n).padStart(2, "0")}</span>
      <span>${e.k === "t" ? "◌" : e.k === "e" ? "■" : "▸"} ${N[e.k]}</span>
      <span class="in">${e.x}${r > 1 ? `<i class="chip">repeat ${r} of 6</i>` : ""}</span>
      <span class="ms">${e.k === "e" ? "" : e.ms + " ms"}</span>
      <span class="tk">${e.k === "e" ? "" : e.ti + "↑ " + e.to + "↓"}</span>
    </button>`;
  }).join("");
}

/* ─── Component ─── */
export default function Home() {
  const initialized = useRef(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const route = useCallback(() => {
    const v = location.hash.slice(1);
    const k = ["landing", "dashboard", "run"].includes(v) ? v : "landing";
    document.querySelectorAll<HTMLElement>(".view").forEach(s => { s.hidden = s.id !== "v-" + k; });
    document.querySelectorAll<HTMLButtonElement>("nav button").forEach(b => {
      b.setAttribute("aria-current", b.dataset.go === k ? "page" : "false");
    });
    window.scrollTo(0, 0);
    document.querySelectorAll<SVGElement>(".view:not([hidden]) .stroke").forEach(s => {
      s.classList.remove("go");
      void s.getBoundingClientRect();
      s.classList.add("go");
    });
  }, []);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // Reset gid for SSR safety
    gid = 0;

    /* landing */
    const lp = document.getElementById("lp");
    if (lp) lp.innerHTML = met(String(T.n), "steps") + met(f0(T.tok), "tokens") + met(sec(T.ms) + " s", "duration");
    const lmm = document.getElementById("lmm");
    if (lmm) lmm.innerHTML = mm();
    const lf = document.getElementById("lf");
    if (lf) lf.innerHTML = `<code>search</code> ran 6 times with the same input. About ${f0(W.tok)} tokens wasted.`;

    /* dashboard */
    const ch = document.getElementById("ch");
    if (ch) ch.innerHTML = buildChart();
    const rl = document.getElementById("rl");
    if (rl) rl.innerHTML = buildList("all");
    document.querySelectorAll<HTMLButtonElement>(".chipb").forEach(b => {
      b.onclick = () => {
        document.querySelectorAll<HTMLButtonElement>(".chipb").forEach(x => x.setAttribute("aria-pressed", x === b ? "true" : "false"));
        const rl2 = document.getElementById("rl");
        if (rl2) rl2.innerHTML = buildList(b.dataset.f || "all");
      };
    });

    /* run */
    const metEl = document.getElementById("met");
    if (metEl) metEl.innerHTML = met(sec(T.ms) + " s", "duration") + met(String(T.n), "steps") + met(f0(T.tok), "tokens") + met(usd(sum(L, cost)), "estimated cost");
    const rmm = document.getElementById("rmm");
    if (rmm) rmm.innerHTML = mm();
    const tl = document.getElementById("tl");
    if (tl) {
      tl.innerHTML = buildTimeline();
      tl.onclick = (ev: MouseEvent) => {
        const b = (ev.target as Element).closest<HTMLElement>(".row");
        if (!b) return;
        const open = b.classList.contains("sel");
        document.querySelectorAll(".dt").forEach(d => d.remove());
        document.querySelectorAll(".row.sel").forEach(x => x.classList.remove("sel"));
        if (open) return;
        const n = +(b.dataset.n || 0);
        const e = L[n - 1];
        b.classList.add("sel");
        b.insertAdjacentHTML("afterend", `<div class="dt">input_hash ${djb2(e.k + e.x)}<br/>output_hash ${djb2("o" + e.k + e.x + (e.k === "t" ? String(e.n) : ""))}<br/>${e.ti} tokens in, ${e.to} out</div>`);
      };
    }

    /* minimap click */
    if (rmm) {
      rmm.onclick = (ev: MouseEvent) => {
        const r = rmm.getBoundingClientRect();
        const n = Math.min(31, Math.max(1, Math.ceil((ev.clientX - r.left) / r.width * 31)));
        const row = document.querySelector<HTMLElement>(`.row[data-n="${n}"]`);
        if (row) { row.scrollIntoView({ block: "center", behavior: "smooth" }); row.focus(); }
      };
    }

    /* findings highlight */
    const hl = (on: boolean) => {
      document.querySelectorAll<HTMLElement>(".row").forEach(r => {
        const n = +(r.dataset.n || 0);
        r.classList.toggle("hl", on && n >= RS && n <= RE);
      });
      document.querySelector<SVGElement>("#rmm .mm")?.classList.toggle("hl", on);
    };
    const fd = document.getElementById("fd");
    if (fd) {
      fd.innerHTML = buildFindings();
      document.querySelectorAll<HTMLElement>(".fc").forEach(c => {
        ["mouseenter", "focusin"].forEach(t => c.addEventListener(t, () => hl(true)));
        ["mouseleave", "focusout"].forEach(t => c.addEventListener(t, () => hl(false)));
      });
    }

    /* guard sim */
    const g1 = document.getElementById("g1");
    if (g1) g1.innerHTML = mm();
    const g2 = document.getElementById("g2");
    if (g2) g2.innerHTML = mm(10);
    const gs = document.getElementById("gs");
    if (gs) gs.innerHTML = `Saved: 3 tool calls, ${G.n} steps, ${f0(G.tok)} tokens, ${sec(G.ms)} s, ${usd(G.c)}.`;

    /* theme toggle */
    const th = document.getElementById("th");
    if (th) th.onclick = () => {
      const d = document.documentElement;
      d.dataset.theme = d.dataset.theme === "dark" ? "light" : "dark";
    };

    /* navigation */
    document.addEventListener("click", (e: MouseEvent) => {
      const g = (e.target as Element).closest<HTMLElement>("[data-go]");
      if (g) { location.hash = g.dataset.go || ""; return; }
      if ((e.target as Element).closest("[data-ev]")) {
        const p = (e.target as Element).closest(".fc")?.querySelector<HTMLElement>(".ev");
        if (p) p.hidden = !p.hidden;
      }
      if ((e.target as Element).closest("[data-gd]")) {
        const d = document.getElementById("gd");
        if (d) { d.hidden = !d.hidden; if (!d.hidden) d.scrollIntoView({ block: "nearest", behavior: "smooth" }); }
      }
    });

    /* keyboard */
    window.addEventListener("keydown", (e: KeyboardEvent) => {
      if (location.hash !== "#run") return;
      const rows = Array.from(document.querySelectorAll<HTMLElement>(".row"));
      const i = rows.indexOf(document.activeElement as HTMLElement);
      if (e.key === "j") rows[Math.min(rows.length - 1, i + 1)]?.focus();
      if (e.key === "k") rows[Math.max(0, i - 1)]?.focus();
    });

    window.addEventListener("hashchange", route);
    route();
  }, [route]);

  return (
    <>
      <header className="top">
        <a className="wm" href="#landing">SISYPHUS</a>
        <nav aria-label="Main navigation">
          <button data-go="landing">Landing</button>
          <button data-go="dashboard">Dashboard</button>
          <button data-go="run">Run 8F30</button>
        </nav>
        <button className="ghost" id="th">Theme</button>
      </header>

      <main>
        {/* ── Landing ── */}
        <section className="view" id="v-landing">
          <div className="hero">
            <div className="paint" aria-hidden="true"></div>
            <div>
              <h1>See where your AI agent gets stuck.</h1>
              <p>Send your agent's tool calls to SISYPHUS. It shows which calls repeated, which retries failed, and what they cost.</p>
              <div className="btns">
                <button className="btn p" data-go="run">Try the demo</button>
                <button
                  type="button"
                  className="btn"
                  onClick={() => setIsCreateModalOpen(true)}
                >
                  Create a project
                </button>
              </div>
            </div>
            <div className="panel">
              <div className="pl">Demo run</div>
              <div className="pm" id="lp"></div>
              <div id="lmm"></div>
              <p className="pf" id="lf"></p>
            </div>
          </div>
          <div className="wrap" style={{ paddingTop: 8 }}>
            <h2 className="d" style={{ fontSize: 24, fontWeight: 500 }}>How it works</h2>
            <div className="how">
              <div>
                <div className="n">1</div>
                <h3>Create a project</h3>
                <p>Copy the API key. It is shown once.</p>
                <code className="cm">sk_live_8af2…</code>
              </div>
              <div>
                <div className="n">2</div>
                <h3>Send your tool calls</h3>
                <p>Post events in batches of up to 500.</p>
                <code className="cm">POST /api/v1/runs/{"{id}"}/events</code>
              </div>
              <div>
                <div className="n">3</div>
                <h3>Read the findings</h3>
                <p>Each run is checked for five patterns when you complete it.</p>
                <code className="cm">POST /api/v1/runs/{"{id}"}/complete</code>
              </div>
              <div>
                <div className="n">4</div>
                <h3>Trace it to the steps</h3>
                <p>Open a finding to see the exact calls and hashes.</p>
                <code className="cm">GET /api/v1/runs/{"{id}"}/findings</code>
              </div>
            </div>
          </div>
        </section>

        {/* ── Dashboard ── */}
        <section className="view wrap" id="v-dashboard" hidden>
          <div className="hd">
            <div>
              <h1 className="d" style={{ font: "500 32px/1.15 Fraunces,Georgia,serif" }}>Research Agent</h1>
              <p className="m">proj_8af21, last 14 days</p>
            </div>
            <button
              type="button"
              className="btn p"
              onClick={() => setIsCreateModalOpen(true)}
            >
              + New Project
            </button>
          </div>
          <div className="tiles">
            <div className="tile"><span>Runs</span><b>143</b></div>
            <div className="tile"><span>Loops</span><b className="s">7</b></div>
            <div className="tile"><span>Failed</span><b>12</b></div>
            <div className="tile"><span>Tokens</span><b>184,291</b></div>
          </div>
          <div className="card">
            <h2>Runs per day</h2>
            <div id="ch" style={{ marginTop: 12 }}></div>
            <div className="leg">
              <span><i style={{ background: "var(--tick)" }}></i>Completed</span>
              <span><i style={{ background: "var(--sf)", boxShadow: "inset 0 2px 0 var(--st)" }}></i>Loop detected</span>
              <span><i style={{ background: "var(--dg)" }}></i>Failed</span>
            </div>
          </div>
          <div className="fl">
            <h2>Recent runs</h2>
            <button className="chipb" data-f="all" aria-pressed="true">All</button>
            <button className="chipb" data-f="loop" aria-pressed="false">Loops</button>
            <button className="chipb" data-f="fail" aria-pressed="false">Failed</button>
          </div>
          <div className="ow"><div className="rl" id="rl"></div></div>
          <p className="m" style={{ marginTop: 10 }}>Click a run to inspect its trace.</p>
        </section>

        {/* ── Run ── */}
        <section className="view wrap" id="v-run" hidden>
          <div className="rh">
            <h1>Run <span className="mono">8F30</span></h1>
            <span className="bd b-loop">↻ Loop detected</span>
          </div>
          <p className="q">Find three Python web frameworks and compare them.</p>
          <div className="met" id="met"></div>
          <div className="mmw" id="rmm" title="Click to jump to a step"></div>
          <div className="cols">
            <div>
              <h2 style={{ marginBottom: 8 }}>Execution</h2>
              <div className="tlw"><div className="tl" id="tl"></div></div>
              <p className="m" style={{ marginTop: 8 }}>Press j and k to move between steps. Select a step for its hashes.</p>
            </div>
            <div className="side">
              <h2>Findings</h2>
              <div id="fd" style={{ display: "grid", gap: 12 }}></div>
              <div className="card" id="gd" hidden>
                <h3>Guard simulation</h3>
                <p className="m" style={{ marginTop: 4 }}>Rule: block an identical tool call after the third. Simulated from the recorded trace. Your agent is not re-run.</p>
                <div className="gl">Recorded</div>
                <div id="g1"></div>
                <div className="gl">With guard</div>
                <div id="g2"></div>
                <p id="gs" style={{ marginTop: 10 }}></p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer>Run 8F30 is a recorded example trace. <a href="#landing" style={{color: "var(--accent)"}}>See how it works →</a></footer>

      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </>
  );
}
