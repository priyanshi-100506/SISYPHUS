import { EventData } from "@/components/timeline/timeline";
import { Finding } from "@/components/findings/finding-card";

export interface DemoScenario {
  id: string;
  title: string;
  subtitle: string;
  tag: string;
  query: string;
  status: "loop_detected" | "failed" | "completed";
  duration_ms: number;
  events: EventData[];
  findings: Finding[];
}

export const DEMO_SCENARIOS: DemoScenario[] = [
  {
    id: "repeated-tool-search",
    title: "Repeated Tool Loop",
    subtitle: "Identical query executed 6 times consecutively",
    tag: "REPEATED_TOOL",
    query: "Find the best hotels in Paris with available rooms tonight.",
    status: "loop_detected",
    duration_ms: 18400,
    events: [
      { sequence_number: 1, event_type: "think", input_preview: "Analyzing request: Find three hotels in Paris", status: "ok", tokens_in: 320, tokens_out: 45, latency_ms: 210, timestamp: "2026-10-01T10:00:01Z" },
      { sequence_number: 2, event_type: "tool", tool_name: "search", input_preview: "query: Paris hotels", output_preview: "results: 10 hotels found", status: "ok", tokens_in: 410, tokens_out: 120, latency_ms: 450, timestamp: "2026-10-01T10:00:02Z" },
      { sequence_number: 3, event_type: "think", input_preview: "Processing search results...", status: "ok", tokens_in: 512, tokens_out: 60, latency_ms: 310, timestamp: "2026-10-01T10:00:03Z" },
      { sequence_number: 4, event_type: "tool", tool_name: "search", input_preview: "query: Paris hotels", output_preview: "results: 10 hotels found", status: "ok", tokens_in: 410, tokens_out: 120, latency_ms: 440, timestamp: "2026-10-01T10:00:04Z" },
      { sequence_number: 5, event_type: "tool", tool_name: "search", input_preview: "query: Paris hotels", output_preview: "results: 10 hotels found", status: "ok", tokens_in: 410, tokens_out: 120, latency_ms: 430, timestamp: "2026-10-01T10:00:05Z" },
      { sequence_number: 6, event_type: "tool", tool_name: "search", input_preview: "query: Paris hotels", output_preview: "results: 10 hotels found", status: "ok", tokens_in: 410, tokens_out: 120, latency_ms: 445, timestamp: "2026-10-01T10:00:06Z" },
      { sequence_number: 7, event_type: "tool", tool_name: "search", input_preview: "query: Paris hotels", output_preview: "results: 10 hotels found", status: "ok", tokens_in: 410, tokens_out: 120, latency_ms: 450, timestamp: "2026-10-01T10:00:07Z" },
      { sequence_number: 8, event_type: "tool", tool_name: "search", input_preview: "query: Paris hotels", output_preview: "results: 10 hotels found", status: "ok", tokens_in: 410, tokens_out: 120, latency_ms: 435, timestamp: "2026-10-01T10:00:08Z" },
      { sequence_number: 9, event_type: "tool", tool_name: "search", input_preview: "query: Paris hotels", output_preview: "results: 10 hotels found", status: "ok", tokens_in: 410, tokens_out: 120, latency_ms: 440, timestamp: "2026-10-01T10:00:09Z" },
      { sequence_number: 10, event_type: "think", input_preview: "Attempting to summarize findings...", status: "ok", tokens_in: 600, tokens_out: 250, latency_ms: 500, timestamp: "2026-10-01T10:00:10Z" },
    ],
    findings: [
      {
        id: "find_01",
        type: "REPEATED_TOOL",
        severity: "high",
        step_start: 4,
        step_end: 9,
        description: "tool 'search' executed 6 times consecutively with identical query: 'Paris hotels'",
        evidence: { tool_name: "search", input_hash: "a9f87c2b...", total_calls: 6, redundant_calls: 5 },
        waste_tokens: 2184,
        waste_ms: 1800,
        waste_cost: 0.0312,
        explanation: "The agent repeatedly called the 'search' tool with the exact same input, indicating it did not store or reuse the initial result.",
      },
      {
        id: "find_02",
        type: "STATE_LOOP",
        severity: "medium",
        step_start: 4,
        step_end: 9,
        description: "Identical state hash revisited across steps 4 through 9 without state progress",
        evidence: { state_hash: "7f4c1e...", cycle_length: 1, repetitions: 6 },
        waste_tokens: 1500,
        waste_ms: 1200,
        waste_cost: 0.021,
        explanation: "No state variables changed between execution turns.",
      },
    ],
  },
  {
    id: "retry-storm-api",
    title: "Retry Storm",
    subtitle: "5 consecutive 503/429 failures without exponential backoff",
    tag: "RETRY_STORM",
    query: "Fetch latest quarterly balance sheet for NVDA via FinTech API.",
    status: "failed",
    duration_ms: 12300,
    events: [
      { sequence_number: 1, event_type: "think", input_preview: "Querying financial data service for NVDA financials", status: "ok", tokens_in: 280, tokens_out: 35, latency_ms: 180, timestamp: "2026-10-01T11:15:01Z" },
      { sequence_number: 2, event_type: "tool", tool_name: "fin_api", input_preview: "GET /v1/stocks/NVDA/financials", output_preview: "HTTP 503: Service Unavailable", status: "error", tokens_in: 340, tokens_out: 60, latency_ms: 820, timestamp: "2026-10-01T11:15:02Z" },
      { sequence_number: 3, event_type: "tool", tool_name: "fin_api", input_preview: "GET /v1/stocks/NVDA/financials", output_preview: "HTTP 503: Service Unavailable", status: "error", tokens_in: 340, tokens_out: 60, latency_ms: 780, timestamp: "2026-10-01T11:15:03Z" },
      { sequence_number: 4, event_type: "tool", tool_name: "fin_api", input_preview: "GET /v1/stocks/NVDA/financials", output_preview: "HTTP 503: Service Unavailable", status: "error", tokens_in: 340, tokens_out: 60, latency_ms: 790, timestamp: "2026-10-01T11:15:04Z" },
      { sequence_number: 5, event_type: "tool", tool_name: "fin_api", input_preview: "GET /v1/stocks/NVDA/financials", output_preview: "HTTP 503: Service Unavailable", status: "error", tokens_in: 340, tokens_out: 60, latency_ms: 810, timestamp: "2026-10-01T11:15:05Z" },
      { sequence_number: 6, event_type: "tool", tool_name: "fin_api", input_preview: "GET /v1/stocks/NVDA/financials", output_preview: "HTTP 503: Service Unavailable", status: "error", tokens_in: 340, tokens_out: 60, latency_ms: 830, timestamp: "2026-10-01T11:15:06Z" },
      { sequence_number: 7, event_type: "think", input_preview: "External provider remains down. Returning error to caller.", status: "error", tokens_in: 490, tokens_out: 85, latency_ms: 320, timestamp: "2026-10-01T11:15:07Z" },
    ],
    findings: [
      {
        id: "find_storm_01",
        type: "RETRY_STORM",
        severity: "high",
        step_start: 2,
        step_end: 6,
        description: "Tool 'fin_api' failed 5 times consecutively with identical inputs and no backoff.",
        evidence: { tool_name: "fin_api", input_hash: "93bd41e...", consecutive_failures: 5 },
        waste_tokens: 1600,
        waste_ms: 3220,
        waste_cost: 0.0245,
        explanation: "The agent hit an unreachable external API repeatedly without checking error codes or applying jittered backoff.",
      },
    ],
  },
  {
    id: "tool-oscillation",
    title: "Tool Oscillation (Ping-Pong)",
    subtitle: "Alternating search and scrape without parsing results",
    tag: "TOOL_OSCILLATION",
    query: "Extract and compare the refund policy for Airline X and Airline Y.",
    status: "loop_detected",
    duration_ms: 22600,
    events: [
      { sequence_number: 1, event_type: "think", input_preview: "Plan: Check policy page and search queries for Airline X and Y", status: "ok", tokens_in: 310, tokens_out: 40, latency_ms: 210, timestamp: "2026-10-01T12:00:01Z" },
      { sequence_number: 2, event_type: "tool", tool_name: "search_web", input_preview: "Airline X refund policy link", output_preview: "URL: flights.com/airline-x/refunds", status: "ok", tokens_in: 420, tokens_out: 90, latency_ms: 480, timestamp: "2026-10-01T12:00:02Z" },
      { sequence_number: 3, event_type: "tool", tool_name: "scrape_page", input_preview: "GET flights.com/airline-x/refunds", output_preview: "Raw HTML: 24KB unparsed text", status: "ok", tokens_in: 850, tokens_out: 140, latency_ms: 920, timestamp: "2026-10-01T12:00:03Z" },
      { sequence_number: 4, event_type: "tool", tool_name: "search_web", input_preview: "Airline X refund conditions full text", output_preview: "URL: flights.com/airline-x/terms", status: "ok", tokens_in: 430, tokens_out: 95, latency_ms: 470, timestamp: "2026-10-01T12:00:04Z" },
      { sequence_number: 5, event_type: "tool", tool_name: "scrape_page", input_preview: "GET flights.com/airline-x/terms", output_preview: "Raw HTML: 31KB unparsed text", status: "ok", tokens_in: 890, tokens_out: 150, latency_ms: 940, timestamp: "2026-10-01T12:00:05Z" },
      { sequence_number: 6, event_type: "tool", tool_name: "search_web", input_preview: "Airline X refund policy cancel within 24h", output_preview: "URL: flights.com/airline-x/refunds-faq", status: "ok", tokens_in: 440, tokens_out: 90, latency_ms: 460, timestamp: "2026-10-01T12:00:06Z" },
      { sequence_number: 7, event_type: "tool", tool_name: "scrape_page", input_preview: "GET flights.com/airline-x/refunds-faq", output_preview: "Raw HTML: 18KB unparsed text", status: "ok", tokens_in: 810, tokens_out: 130, latency_ms: 890, timestamp: "2026-10-01T12:00:07Z" },
      { sequence_number: 8, event_type: "think", input_preview: "Compiling refund comparison table", status: "ok", tokens_in: 650, tokens_out: 320, latency_ms: 610, timestamp: "2026-10-01T12:00:08Z" },
    ],
    findings: [
      {
        id: "find_osc_01",
        type: "TOOL_OSCILLATION",
        severity: "high",
        step_start: 2,
        step_end: 7,
        description: "Oscillating between tools 'search_web' and 'scrape_page' (6 alternations).",
        evidence: { tool_a: "search_web", tool_b: "scrape_page", alternations: 6 },
        waste_tokens: 3820,
        waste_ms: 3760,
        waste_cost: 0.0528,
        explanation: "The agent was trapped in a ping-pong pattern searching for URLs then scraping them without extracting answers.",
      },
    ],
  },
  {
    id: "clean-run-fast",
    title: "Clean Execution (Baseline)",
    subtitle: "Optimal multi-step run with 0 loops and minimal latency",
    tag: "CLEAN",
    query: "Calculate compound interest for $10,000 at 7.5% over 5 years.",
    status: "completed",
    duration_ms: 3400,
    events: [
      { sequence_number: 1, event_type: "think", input_preview: "Parsing parameters: principal=10000, rate=0.075, time=5, compound=annual", status: "ok", tokens_in: 210, tokens_out: 35, latency_ms: 160, timestamp: "2026-10-01T14:20:01Z" },
      { sequence_number: 2, event_type: "tool", tool_name: "python_calc", input_preview: "10000 * ((1 + 0.075) ** 5)", output_preview: "Result: 14356.2933", status: "ok", tokens_in: 290, tokens_out: 50, latency_ms: 190, timestamp: "2026-10-01T14:20:02Z" },
      { sequence_number: 3, event_type: "think", input_preview: "Formatting clear breakdown with annual growth steps", status: "ok", tokens_in: 340, tokens_out: 180, latency_ms: 320, timestamp: "2026-10-01T14:20:03Z" },
    ],
    findings: [],
  },
];
