import asyncio
import json
import httpx

API_BASE = "http://127.0.0.1:8000/api/v1"

async def test_end_to_end():
    async with httpx.AsyncClient(timeout=30.0) as client:
        import uuid
        uid = uuid.uuid4().hex[:6]
        # 1. Create project
        proj_resp = await client.post(f"{API_BASE}/projects", json={
            "name": f"Live Verification {uid}",
            "slug": f"live-verification-{uid}",
            "language": "python"
        })
        print(f"Project creation status: {proj_resp.status_code}")
        proj_data = proj_resp.json()
        api_key = proj_data["api_key"]
        project_id = proj_data["id"]
        print(f"Created project: {project_id}, API Key: {api_key[:12]}...")

        headers = {"Authorization": f"Bearer {api_key}"}

        # 2. Start a run
        run_resp = await client.post(f"{API_BASE}/runs", headers=headers, json={
            "input": "Find available flights from JFK to LHR"
        })
        print(f"Run creation status: {run_resp.status_code}")
        run_data = run_resp.json()
        run_id = run_data["id"]
        print(f"Created run: {run_id}")

        # 3. Stream/Batch ingest trace events with repeated tool calls (simulating a loop)
        events = [
            {"sequence_number": 1, "event_type": "think", "input_preview": "Analyzing trip requirements", "tokens_in": 300, "tokens_out": 40, "latency_ms": 150, "status": "ok"},
            {"sequence_number": 2, "event_type": "tool", "tool_name": "flight_search", "input_preview": "JFK to LHR 2026-10-10", "input_hash": "hash_flight_01", "output_hash": "out_01", "tokens_in": 400, "tokens_out": 120, "latency_ms": 380, "status": "ok"},
            {"sequence_number": 3, "event_type": "tool", "tool_name": "flight_search", "input_preview": "JFK to LHR 2026-10-10", "input_hash": "hash_flight_01", "output_hash": "out_01", "tokens_in": 400, "tokens_out": 120, "latency_ms": 390, "status": "ok"},
            {"sequence_number": 4, "event_type": "tool", "tool_name": "flight_search", "input_preview": "JFK to LHR 2026-10-10", "input_hash": "hash_flight_01", "output_hash": "out_01", "tokens_in": 400, "tokens_out": 120, "latency_ms": 410, "status": "ok"},
            {"sequence_number": 5, "event_type": "tool", "tool_name": "flight_search", "input_preview": "JFK to LHR 2026-10-10", "input_hash": "hash_flight_01", "output_hash": "out_01", "tokens_in": 400, "tokens_out": 120, "latency_ms": 405, "status": "ok"},
            {"sequence_number": 6, "event_type": "think", "input_preview": "Reviewing search results", "tokens_in": 250, "tokens_out": 60, "latency_ms": 200, "status": "ok"},
        ]

        batch_resp = await client.post(f"{API_BASE}/runs/{run_id}/events", headers=headers, json={"events": events})
        print(f"Events batch ingest status: {batch_resp.status_code}, data: {batch_resp.json()}")

        # 4. Complete the run -> triggers analysis engine
        complete_resp = await client.post(f"{API_BASE}/runs/{run_id}/complete", headers=headers, json={"status": "loop"})
        print(f"Run completion status: {complete_resp.status_code}, data: {complete_resp.json()}")

        # 5. Retrieve findings
        findings_resp = await client.get(f"{API_BASE}/runs/{run_id}/findings", headers=headers)
        print(f"Findings fetch status: {findings_resp.status_code}")
        findings = findings_resp.json()
        print(f"Detected Findings count: {len(findings)}")
        for f in findings:
            print(f"  - [{f['type']}] ({f['severity']}) steps {f['step_start']}-{f['step_end']}: {f['description']}")
            print(f"    Explanation: {f.get('explanation')}")
            print(f"    Waste: {f.get('waste_tokens')} tokens, {f.get('waste_ms')} ms, ${f.get('waste_cost')}")

        # 6. Retrieve metrics
        metrics_resp = await client.get(f"{API_BASE}/runs/{run_id}/metrics", headers=headers)
        print(f"Metrics: {json.dumps(metrics_resp.json(), indent=2)}")

if __name__ == "__main__":
    asyncio.run(test_end_to_end())
