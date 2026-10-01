import pytest

@pytest.mark.asyncio
async def test_full_run_lifecycle(client):
    # 1. Create project
    proj_res = await client.post(
        "/api/v1/projects",
        json={"name": "Lifecycle Project", "slug": "lifecycle-proj"}
    )
    api_key = proj_res.json()["api_key"]
    headers = {"Authorization": f"Bearer {api_key}"}

    # 2. Create run
    run_res = await client.post(
        "/api/v1/runs",
        headers=headers,
        json={"input": "Test prompt"}
    )
    assert run_res.status_code == 201
    run_id = run_res.json()["id"]
    assert run_res.json()["status"] == "running"

    # 3. Post events
    events_payload = {
        "events": [
            {
                "sequence_number": 1,
                "event_type": "tool",
                "tool_name": "search",
                "input": {"q": "python"},
                "output": {"res": 1},
                "tokens_in": 100,
                "tokens_out": 50,
                "timestamp": "2026-10-01T10:00:00Z"
            }
        ]
    }
    ev_res = await client.post(f"/api/v1/runs/{run_id}/events", headers=headers, json=events_payload)
    assert ev_res.status_code == 200
    assert ev_res.json() == {"accepted": 1, "duplicates": 0}

    # 4. Complete run
    comp_res = await client.post(f"/api/v1/runs/{run_id}/complete", headers=headers, json={"status": "completed"})
    assert comp_res.status_code == 200
    completed_data = comp_res.json()
    assert completed_data["status"] == "completed"
    assert completed_data["total_steps"] == 1
    assert completed_data["total_tokens_in"] == 100
    assert completed_data["total_tokens_out"] == 50

@pytest.mark.asyncio
async def test_completed_run_event_rejection_409(client):
    # Create project & run
    proj_res = await client.post("/api/v1/projects", json={"name": "409 Test", "slug": "409-test"})
    headers = {"Authorization": f"Bearer {proj_res.json()['api_key']}"}
    run_res = await client.post("/api/v1/runs", headers=headers, json={})
    run_id = run_res.json()["id"]

    # Complete run
    await client.post(f"/api/v1/runs/{run_id}/complete", headers=headers, json={"status": "completed"})

    # Post event after complete -> 409
    events_payload = {
        "events": [
            {
                "sequence_number": 1,
                "event_type": "think",
                "timestamp": "2026-10-01T10:00:00Z"
            }
        ]
    }
    ev_res = await client.post(f"/api/v1/runs/{run_id}/events", headers=headers, json=events_payload)
    assert ev_res.status_code == 409

@pytest.mark.asyncio
async def test_run_completion_triggers_findings(client):
    proj_res = await client.post("/api/v1/projects", json={"name": "Findings Test", "slug": "findings-test"})
    headers = {"Authorization": f"Bearer {proj_res.json()['api_key']}"}
    run_res = await client.post("/api/v1/runs", headers=headers, json={})
    run_id = run_res.json()["id"]

    # Send 3 identical tool events to trigger REPEATED_TOOL detector
    events_payload = {
        "events": [
            {
                "sequence_number": i,
                "event_type": "tool",
                "tool_name": "search",
                "input": {"q": "duplicate"},
                "tokens_in": 100,
                "tokens_out": 20,
                "timestamp": f"2026-10-01T10:00:0{i}Z"
            }
            for i in range(1, 4)
        ]
    }
    await client.post(f"/api/v1/runs/{run_id}/events", headers=headers, json=events_payload)

    # Complete run
    comp_res = await client.post(f"/api/v1/runs/{run_id}/complete", headers=headers, json={"status": "completed"})
    assert comp_res.status_code == 200
    assert comp_res.json()["analyzed_at"] is not None

