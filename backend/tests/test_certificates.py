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
async def test_certificate_generation_and_public_verification():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        import uuid
        test_email = f"cert_candidate_{uuid.uuid4().hex[:8]}@example.com"
        reg_res = await client.post("/api/v1/auth/register", json={
            "full_name": "Cert Test Candidate",
            "email": test_email,
            "password": "Candidate@12345"
        })
        assert reg_res.status_code == 200
        cand_token = reg_res.json()["access_token"]
        cand_headers = {"Authorization": f"Bearer {cand_token}"}

        # Fetch assigned assessments
        asm_res = await client.get("/api/v1/attenders/assessments", headers=cand_headers)
        assessment_id = asm_res.json()[0]["id"]

        start_res = await client.post(f"/api/v1/attempts/start/{assessment_id}", headers=cand_headers)
        start_json = start_res.json()
        attempt_id = start_json.get("attempt_id") or start_json.get("id")
        assert attempt_id is not None

        # Submit attempt to complete and compute scores
        sub_res = await client.post(f"/api/v1/attempts/{attempt_id}/submit", headers=cand_headers)
        assert sub_res.status_code == 200

        # Fetch certificate
        cert_res = await client.get(f"/api/v1/results/certificate/{attempt_id}", headers=cand_headers)
        assert cert_res.status_code == 200
        cert_data = cert_res.json()
        assert "certificate_id" in cert_data
        assert cert_data["certificate_id"].startswith("CERT-")
        assert cert_data["verification_hash"] is not None
        assert len(cert_data["skill_breakdown"]) > 0

        cert_id = cert_data["certificate_id"]

        # Verify certificate publicly (no auth headers)
        verify_res = await client.get(f"/api/v1/results/verify/{cert_id}")
        assert verify_res.status_code == 200
        verify_data = verify_res.json()
        assert verify_data["is_valid"] is True
        assert verify_data["certificate_id"] == cert_id
        assert verify_data["candidate_name"] is not None
        assert "EvalAI Enterprise" in verify_data["issuer"]
