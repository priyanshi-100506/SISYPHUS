import pytest
from sqlalchemy import select
from app.db.models import Project

@pytest.mark.asyncio
async def test_create_project_returns_key_once(client, db_session):
    response = await client.post(
        "/api/v1/projects",
        json={"name": "Test Project", "slug": "test-project", "language": "python"}
    )
    assert response.status_code == 201
    data = response.json()
    assert "api_key" in data
    assert data["api_key"].startswith("sk_live_")
    assert "key_prefix" in data
    assert data["key_prefix"].startswith("sk_live_")

    # Verify key is stored hashed in DB
    res = await db_session.execute(select(Project).where(Project.slug == "test-project"))
    project = res.scalar_one()
    assert project.api_key_hash != data["api_key"]
    assert project.key_prefix == data["key_prefix"]

@pytest.mark.asyncio
async def test_get_project_hides_api_key(client, db_session):
    # Create project
    create_res = await client.post(
        "/api/v1/projects",
        json={"name": "Get Test", "slug": "get-test"}
    )
    project_id = create_res.json()["id"]

    # Get project
    get_res = await client.get(f"/api/v1/projects/{project_id}")
    assert get_res.status_code == 200
    data = get_res.json()
    assert "api_key" not in data
    assert data["slug"] == "get-test"
