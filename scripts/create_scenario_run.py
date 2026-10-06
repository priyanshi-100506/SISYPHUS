import asyncio
import sys
import httpx

API_BASE = "http://localhost:8000/api/v1"

SCENARIOS = {
    "repeated_tool": {
        "name": "Live Test: Repeated Search Loop",
        "input": "Find hotels in Tokyo near Shinjuku",
        "events": [
            {"sequence_number": 1, "event_type": "think", "input_preview": "Searching for hotels in Tokyo Shinjuku area", "tokens_in": 250, "tokens_out": 40, "latency_ms": 190, "status": "ok"},
            {"sequence_number": 2, "event_type": "tool", "tool_name": "hotel_search", "input_preview": "Tokyo Shinjuku hotels", "input_hash": "h_shinjuku_01", "tokens_in": 400, "tokens_out": 100, "latency_ms": 420, "status": "ok"},
            {"sequence_number": 3, "event_type": "tool", "tool_name": "hotel_search", "input_preview": "Tokyo Shinjuku hotels", "input_hash": "h_shinjuku_01", "tokens_in": 400, "tokens_out": 100, "latency_ms": 430, "status": "ok"},
            {"sequence_number": 4, "event_type": "tool", "tool_name": "hotel_search", "input_preview": "Tokyo Shinjuku hotels", "input_hash": "h_shinjuku_01", "tokens_in": 400, "tokens_out": 100, "latency_ms": 410, "status": "ok"},
            {"sequence_number": 5, "event_type": "tool", "tool_name": "hotel_search", "input_preview": "Tokyo Shinjuku hotels", "input_hash": "h_shinjuku_01", "tokens_in": 400, "tokens_out": 100, "latency_ms": 415, "status": "ok"},
            {"sequence_number": 6, "event_type": "think", "input_preview": "Aggregating hotel options...", "tokens_in": 350, "tokens_out": 150, "latency_ms": 380, "status": "ok"}
        ]
    },
    "retry_storm": {
        "name": "Live Test: Retry Storm",
        "input": "Sync customer records with CRM API",
        "events": [
            {"sequence_number": 1, "event_type": "think", "input_preview": "Initiating CRM push", "tokens_in": 200, "tokens_out": 30, "latency_ms": 150, "status": "ok"},
            {"sequence_number": 2, "event_type": "tool", "tool_name": "crm_push", "input_preview": "POST /customers/sync", "input_hash": "hash_crm_post", "tokens_in": 500, "tokens_out": 50, "latency_ms": 900, "status": "error"},
            {"sequence_number": 3, "event_type": "tool", "tool_name": "crm_push", "input_preview": "POST /customers/sync", "input_hash": "hash_crm_post", "tokens_in": 500, "tokens_out": 50, "latency_ms": 880, "status": "error"},
            {"sequence_number": 4, "event_type": "tool", "tool_name": "crm_push", "input_preview": "POST /customers/sync", "input_hash": "hash_crm_post", "tokens_in": 500, "tokens_out": 50, "latency_ms": 910, "status": "error"},
            {"sequence_number": 5, "event_type": "tool", "tool_name": "crm_push", "input_preview": "POST /customers/sync", "input_hash": "hash_crm_post", "tokens_in": 500, "tokens_out": 50, "latency_ms": 890, "status": "error"},
            {"sequence_number": 6, "event_type": "think", "input_preview": "CRM service unavailable after multiple retries", "tokens_in": 300, "tokens_out": 40, "latency_ms": 200, "status": "error"}
        ]
    },
    "oscillation": {
        "name": "Live Test: Tool Oscillation",
        "input": "Compare specifications between Phone A and Phone B",
        "events": [
            {"sequence_number": 1, "event_type": "think", "input_preview": "Starting spec lookup", "tokens_in": 220, "tokens_out": 30, "latency_ms": 150, "status": "ok"},
            {"sequence_number": 2, "event_type": "tool", "tool_name": "search_db", "input_preview": "Phone A specs", "tokens_in": 300, "tokens_out": 80, "latency_ms": 350, "status": "ok"},
            {"sequence_number": 3, "event_type": "tool", "tool_name": "parse_html", "input_preview": "parse Phone A spec page", "tokens_in": 600, "tokens_out": 90, "latency_ms": 500, "status": "ok"},
            {"sequence_number": 4, "event_type": "tool", "tool_name": "search_db", "input_preview": "Phone B specs", "tokens_in": 310, "tokens_out": 85, "latency_ms": 340, "status": "ok"},
            {"sequence_number": 5, "event_type": "tool", "tool_name": "parse_html", "input_preview": "parse Phone B spec page", "tokens_in": 620, "tokens_out": 95, "latency_ms": 510, "status": "ok"},
            {"sequence_number": 6, "event_type": "tool", "tool_name": "search_db", "input_preview": "Phone A camera details", "tokens_in": 320, "tokens_out": 80, "latency_ms": 360, "status": "ok"},
            {"sequence_number": 7, "event_type": "tool", "tool_name": "parse_html", "input_preview": "parse camera page", "tokens_in": 580, "tokens_out": 90, "latency_ms": 490, "status": "ok"},
            {"sequence_number": 8, "event_type": "think", "input_preview": "Constructing comparison table", "tokens_in": 400, "tokens_out": 200, "latency_ms": 350, "status": "ok"}
        ]
    }
}

async def generate_live_run(scenario_key: str):
    sc = SCENARIOS.get(scenario_key, SCENARIOS["repeated_tool"])
    async with httpx.AsyncClient(timeout=30.0) as client:
        import uuid
        uid = uuid.uuid4().hex[:6]
        # Create project
        proj = await client.post(f"{API_BASE}/projects", json={
            "name": f"{sc['name']} {uid}",
            "slug": f"live-test-{uid}",
            "language": "python"
        })
        pdata = proj.json()
        api_key = pdata["api_key"]
        headers = {"Authorization": f"Bearer {api_key}"}

        # Create run
        run = await client.post(f"{API_BASE}/runs", headers=headers, json={"input": sc["input"]})
        run_id = run.json()["id"]

        # Ingest events
        await client.post(f"{API_BASE}/runs/{run_id}/events", headers=headers, json={"events": sc["events"]})

        # Complete run
        await client.post(f"{API_BASE}/runs/{run_id}/complete", headers=headers, json={"status": "completed"})

        print(f"LIVE_RUN_ID:{run_id}")
        return run_id

if __name__ == "__main__":
    key = sys.argv[1] if len(sys.argv) > 1 else "repeated_tool"
    asyncio.run(generate_live_run(key))
