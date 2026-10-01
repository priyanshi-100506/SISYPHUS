import pytest

@pytest.mark.asyncio
async def test_same_batch_3_times_idempotent(client):
    proj_res = await client.post("/api/v1/projects", json={"name": "Idempotent", "slug": "idempotent"})
    headers = {"Authorization": f"Bearer {proj_res.json()['api_key']}"}
    run_res = await client.post("/api/v1/runs", headers=headers, json={})
    run_id = run_res.json()["id"]

    batch = {
        "events": [
            {"sequence_number": 1, "event_type": "think", "timestamp": "2026-10-01T10:00:00Z"},
            {"sequence_number": 2, "event_type": "tool", "tool_name": "search", "timestamp": "2026-10-01T10:00:01Z"}
        ]
    }

    # First send
    res1 = await client.post(f"/api/v1/runs/{run_id}/events", headers=headers, json=batch)
    assert res1.json() == {"accepted": 2, "duplicates": 0}

    # Second send
    res2 = await client.post(f"/api/v1/runs/{run_id}/events", headers=headers, json=batch)
    assert res2.json() == {"accepted": 0, "duplicates": 2}

    # Third send
    res3 = await client.post(f"/api/v1/runs/{run_id}/events", headers=headers, json=batch)
    assert res3.json() == {"accepted": 0, "duplicates": 2}

@pytest.mark.asyncio
async def test_out_of_order_batches_and_cursor_pagination(client):
    proj_res = await client.post("/api/v1/projects", json={"name": "Pagination", "slug": "pagination"})
    headers = {"Authorization": f"Bearer {proj_res.json()['api_key']}"}
    run_res = await client.post("/api/v1/runs", headers=headers, json={})
    run_id = run_res.json()["id"]

    # Send batch 2 first (seq 3, 4)
    batch2 = {
        "events": [
            {"sequence_number": 3, "event_type": "tool", "tool_name": "read", "timestamp": "2026-10-01T10:00:03Z"},
            {"sequence_number": 4, "event_type": "end", "timestamp": "2026-10-01T10:00:04Z"}
        ]
    }
    await client.post(f"/api/v1/runs/{run_id}/events", headers=headers, json=batch2)

    # Send batch 1 second (seq 1, 2)
    batch1 = {
        "events": [
            {"sequence_number": 1, "event_type": "think", "timestamp": "2026-10-01T10:00:01Z"},
            {"sequence_number": 2, "event_type": "tool", "tool_name": "search", "timestamp": "2026-10-01T10:00:02Z"}
        ]
    }
    await client.post(f"/api/v1/runs/{run_id}/events", headers=headers, json=batch1)

    # Fetch page 1 (limit 2)
    p1 = await client.get(f"/api/v1/runs/{run_id}/events?limit=2", headers=headers)
    p1_data = p1.json()
    assert len(p1_data["events"]) == 2
    assert p1_data["events"][0]["sequence_number"] == 1
    assert p1_data["events"][1]["sequence_number"] == 2
    assert p1_data["next_cursor"] == 2

    # Fetch page 2 (after=2, limit=2)
    p2 = await client.get(f"/api/v1/runs/{run_id}/events?after={p1_data['next_cursor']}&limit=2", headers=headers)
    p2_data = p2.json()
    assert len(p2_data["events"]) == 2
    assert p2_data["events"][0]["sequence_number"] == 3
    assert p2_data["events"][1]["sequence_number"] == 4
    assert p2_data["next_cursor"] is None
