import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.core.database import init_db
from seed_data import seed

@pytest_asyncio.fixture(autouse=True)
async def setup_test_db():
    await init_db()
    try:
        await seed()
    except Exception:
        pass

@pytest.mark.asyncio
async def test_setup_check_and_health():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Health check
        h_res = await client.get("/api/v1/health")
        assert h_res.status_code == 200
        assert h_res.json()["status"] == "HEALTHY"

        # Setup check
        s_res = await client.get("/api/v1/auth/setup-check")
        assert s_res.status_code == 200
        assert "is_setup_completed" in s_res.json()

@pytest.mark.asyncio
async def test_auth_login_roles():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Admin login
        admin_login = await client.post("/api/v1/auth/login", json={
            "email": "admin@assessmentportal.io",
            "password": "Admin@12345"
        })
        assert admin_login.status_code == 200
        admin_data = admin_login.json()
        assert admin_data["role"] == "PORTAL_ADMIN"
        admin_token = admin_data["access_token"]

        # Creator login
        creator_login = await client.post("/api/v1/auth/login", json={
            "email": "recruiter@techcorp.com",
            "password": "Creator@12345"
        })
        assert creator_login.status_code == 200
        creator_data = creator_login.json()
        assert creator_data["role"] == "TEST_CREATOR"
        creator_token = creator_data["access_token"]

        # Attender login
        attender_login = await client.post("/api/v1/auth/login", json={
            "email": "candidate@example.com",
            "password": "Candidate@12345"
        })
        assert attender_login.status_code == 200
        attender_data = attender_login.json()
        assert attender_data["role"] == "TEST_ATTENDER"
        attender_token = attender_data["access_token"]

        # Test Creator CANNOT access Admin Overview
        forbidden_admin = await client.get(
            "/api/v1/admin/overview",
            headers={"Authorization": f"Bearer {creator_token}"}
        )
        assert forbidden_admin.status_code == 403

        # Test Attender CANNOT access Creator Assessments List
        forbidden_creator = await client.get(
            "/api/v1/assessments",
            headers={"Authorization": f"Bearer {attender_token}"}
        )
        assert forbidden_creator.status_code == 403

        # Admin CAN access Admin Overview
        admin_overview = await client.get(
            "/api/v1/admin/overview",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert admin_overview.status_code == 200
        assert "total_assessments" in admin_overview.json()
