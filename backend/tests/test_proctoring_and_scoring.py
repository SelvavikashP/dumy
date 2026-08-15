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
async def test_attempt_lifecycle_and_proctoring_warnings():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        import uuid
        test_email = f"proc_cand_{uuid.uuid4().hex[:8]}@example.com"
        reg_res = await client.post("/api/v1/auth/register", json={
            "full_name": "Proctor Test Candidate",
            "email": test_email,
            "password": "Candidate@12345"
        })
        token = reg_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Get assigned assessments
        asm_res = await client.get("/api/v1/attenders/assessments", headers=headers)
        assert asm_res.status_code == 200
        assessments = asm_res.json()
        assert len(assessments) > 0
        assessment_id = assessments[0]["id"]

        # Start attempt
        start_res = await client.post(f"/api/v1/attempts/start/{assessment_id}", headers=headers)
        assert start_res.status_code == 200
        start_data = start_res.json()
        attempt_id = start_data["attempt_id"]
        assert start_data["time_remaining_seconds"] > 0

        # Ingest proctoring event 1: Tab switch
        p1 = await client.post("/api/v1/proctoring/event", json={
            "attempt_id": attempt_id,
            "event_type": "TAB_SWITCH",
            "severity": "MEDIUM",
            "confidence": 0.95
        }, headers=headers)
        assert p1.status_code == 200
        assert p1.json()["active_warnings"] >= 1
        assert p1.json()["is_suspended"] is False

        # Ingest proctoring event 2: Fullscreen exit
        p2 = await client.post("/api/v1/proctoring/event", json={
            "attempt_id": attempt_id,
            "event_type": "FULLSCREEN_EXIT",
            "severity": "MEDIUM",
            "confidence": 0.95
        }, headers=headers)
        assert p2.status_code == 200
        assert p2.json()["active_warnings"] >= 2

        # Recover attempt state
        state_res = await client.get(f"/api/v1/attempts/{attempt_id}/state", headers=headers)
        assert state_res.status_code == 200
        assert state_res.json()["warning_count"] >= 2

        # Submit attempt
        sub_res = await client.post(f"/api/v1/attempts/{attempt_id}/submit", headers=headers)
        assert sub_res.status_code == 200
        res_data = sub_res.json()
        assert "results" in res_data
