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
async def test_proctoring_snapshot_upload_and_gallery():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Candidate login
        c_login = await client.post("/api/v1/auth/login", json={
            "email": "candidate@example.com",
            "password": "Candidate@12345"
        })
        assert c_login.status_code == 200
        cand_token = c_login.json()["access_token"]
        cand_headers = {"Authorization": f"Bearer {cand_token}"}

        # Recruiter login
        r_login = await client.post("/api/v1/auth/login", json={
            "email": "recruiter@techcorp.com",
            "password": "Creator@12345"
        })
        assert r_login.status_code == 200
        rec_token = r_login.json()["access_token"]
        rec_headers = {"Authorization": f"Bearer {rec_token}"}

        # Get assessment and start attempt
        asm_res = await client.get("/api/v1/attenders/assessments", headers=cand_headers)
        assert asm_res.status_code == 200
        assessments = asm_res.json()
        assert len(assessments) > 0
        assessment_id = assessments[0]["id"]

        start_res = await client.post(f"/api/v1/attempts/start/{assessment_id}", headers=cand_headers)
        assert start_res.status_code == 200
        attempt_id = start_res.json()["attempt_id"]

        # Upload dummy base64 snapshot
        dummy_base64 = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA="
        snap_res = await client.post("/api/v1/proctoring/snapshot", json={
            "attempt_id": attempt_id,
            "snapshot_base64": dummy_base64,
            "event_type": "TAB_SWITCH",
            "confidence": 0.98,
            "metadata": {"trigger": "tab_hidden_event"}
        }, headers=cand_headers)
        assert snap_res.status_code == 200
        snap_data = snap_res.json()
        assert snap_data["success"] is True
        assert snap_data["snapshot_id"] is not None

        # Fetch snapshot gallery as recruiter
        gallery_res = await client.get(f"/api/v1/proctoring/snapshots/{attempt_id}", headers=rec_headers)
        assert gallery_res.status_code == 200
        gallery = gallery_res.json()
        assert isinstance(gallery, list)
        assert len(gallery) >= 1
        assert gallery[0]["snapshot_url"].startswith("data:image/")
        assert gallery[0]["event_type"] == "TAB_SWITCH"
