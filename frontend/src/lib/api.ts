export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export interface ProjectData {
  id: string;
  name: string;
  slug: string;
  language?: string;
  key_prefix: string;
  api_key?: string;
  is_demo: boolean;
  created_at: string;
}

export interface RunData {
  id: string;
  project_id: string;
  status: string;
  input?: string;
  started_at: string;
  finished_at?: string;
  total_steps: number;
  total_tokens_in: number;
  total_tokens_out: number;
  estimated_cost: number;
  analyzed_at?: string;
}

export interface EventDataApi {
  id: string;
  run_id: string;
  sequence_number: number;
  parent_id?: string;
  event_type: string;
  tool_name?: string;
  model?: string;
  input_preview?: string;
  output_preview?: string;
  status: string;
  error_code?: string;
  tokens_in: number;
  tokens_out: number;
  latency_ms?: number;
  timestamp: string;
}

export interface FindingDataApi {
  id: string;
  run_id: string;
  type: string;
  severity: string;
  step_start: number;
  step_end: number;
  description: string;
  evidence: Record<string, any>;
  waste_tokens: number;
  waste_ms: number;
  waste_cost: number;
  explanation?: string | null;
  created_at: string;
}

export async function createProject(data: {
  name: string;
  slug: string;
  language?: string;
}): Promise<ProjectData> {
  const res = await fetch(`${API_BASE_URL}/projects`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to create project`);
  return res.json();
}

export async function fetchProjects(): Promise<ProjectData[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/projects`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    console.warn("Backend API unavailable, using demo project list:", e);
    return [
      {
        id: "proj_demo_01",
        name: "Research Agent (Demo)",
        slug: "research-agent",
        language: "python",
        key_prefix: "sk_live_demo",
        is_demo: true,
        created_at: new Date().toISOString(),
      },
    ];
  }
}

export async function fetchProjectRuns(
  projectId: string,
  apiKey?: string
): Promise<RunData[]> {
  try {
    const headers: Record<string, string> = {};
    if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;

    const res = await fetch(`${API_BASE_URL}/projects/${projectId}/runs`, {
      headers,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.items || data;
  } catch (e) {
    console.warn("Backend API unavailable, using demo runs:", e);
    return [
      {
        id: "run_8f31",
        project_id: projectId,
        status: "completed",
        input: "Compare 3 Python web frameworks",
        started_at: "2026-10-01T10:00:00Z",
        finished_at: "2026-10-01T10:00:04Z",
        total_steps: 12,
        total_tokens_in: 2400,
        total_tokens_out: 1000,
        estimated_cost: 0.02,
      },
      {
        id: "run_8f30",
        project_id: projectId,
        status: "loop",
        input: "Find three hotels in Paris with available rooms",
        started_at: "2026-10-01T10:05:00Z",
        finished_at: "2026-10-01T10:05:18Z",
        total_steps: 31,
        total_tokens_in: 5812,
        total_tokens_out: 2600,
        estimated_cost: 0.08,
      },
    ];
  }
}

export async function fetchRunDetail(
  runId: string,
  apiKey?: string
): Promise<RunData | null> {
  try {
    const headers: Record<string, string> = {};
    if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;

    const res = await fetch(`${API_BASE_URL}/runs/${runId}`, { headers });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    console.warn("Backend API fetchRunDetail failed, using fallback:", e);
    return null;
  }
}

export async function fetchRunEvents(
  runId: string,
  apiKey?: string
): Promise<EventDataApi[]> {
  try {
    const headers: Record<string, string> = {};
    if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;

    const res = await fetch(`${API_BASE_URL}/runs/${runId}/events`, {
      headers,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.items || data;
  } catch (e) {
    console.warn("Backend API fetchRunEvents failed, using fallback:", e);
    return [];
  }
}

export async function fetchRunFindings(
  runId: string,
  apiKey?: string
): Promise<FindingDataApi[]> {
  try {
    const headers: Record<string, string> = {};
    if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;

    const res = await fetch(`${API_BASE_URL}/runs/${runId}/findings`, {
      headers,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    console.warn("Backend API fetchRunFindings failed, using fallback:", e);
    return [];
  }
}
