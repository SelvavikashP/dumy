import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy import select
from app.main import app
from app.core.database import init_db, AsyncSessionLocal
from app.models.models import EmailVerificationToken, Assessment, TestAttender
from seed_data import seed

@pytest_asyncio.fixture(autouse=True)
async def setup_test_db():
    await init_db()
    try:
        await seed()
    except Exception:
        pass

@pytest.mark.asyncio
async def test_email_verification_otp_flow():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Register a new candidate
        reg_res = await client.post("/api/v1/auth/register", json={
            "full_name": "OTP Test Candidate",
            "email": "otp_candidate@example.com",
            "password": "Password@123",
            "phone": "+1234567890"
        })
        # If already registered in a previous run, proceed to send OTP
        assert reg_res.status_code in [200, 400]

        # Request fresh OTP
        otp_send_res = await client.post("/api/v1/auth/send-verification-otp", json={
            "email": "otp_candidate@example.com"
        })
        assert otp_send_res.status_code == 200
        assert otp_send_res.json()["success"] is True

        # Fetch generated OTP from database
        async with AsyncSessionLocal() as db:
            token_res = await db.execute(
                select(EmailVerificationToken)
                .where(EmailVerificationToken.email == "otp_candidate@example.com")
                .order_by(EmailVerificationToken.created_at.desc())
            )
            token = token_res.scalars().first()
            assert token is not None
            otp_code = token.otp_code
            assert len(otp_code) == 6

        # Test invalid OTP
        bad_verify = await client.post("/api/v1/auth/verify-email-otp", json={
            "email": "otp_candidate@example.com",
            "otp_code": "000000"
        })
        assert bad_verify.status_code == 400

        # Test valid OTP
        good_verify = await client.post("/api/v1/auth/verify-email-otp", json={
            "email": "otp_candidate@example.com",
            "otp_code": otp_code
        })
        assert good_verify.status_code == 200
        assert good_verify.json()["is_verified"] is True

@pytest.mark.asyncio
async def test_admin_email_settings_and_test_probe():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Login as Admin
        admin_login = await client.post("/api/v1/auth/login", json={
            "email": "admin@assessmentportal.io",
            "password": "Admin@12345"
        })
        admin_token = admin_login.json()["access_token"]
        headers = {"Authorization": f"Bearer {admin_token}"}

        # Get Email Settings
        get_res = await client.get("/api/v1/admin/email-settings", headers=headers)
        assert get_res.status_code == 200
        assert "host" in get_res.json()
        assert "port" in get_res.json()

        # Update Email Settings
        update_res = await client.post("/api/v1/admin/email-settings", headers=headers, json={
            "host": "smtp.gmail.com",
            "port": 587,
            "user": "evalai.demo@gmail.com",
            "password": "abcd efgh ijkl mnop",
            "from_name": "EvalAI Proctoring Test",
            "from_email": "evalai.demo@gmail.com",
            "use_tls": True,
            "frontend_url": "http://localhost:5173"
        })
        assert update_res.status_code == 200

        # Send Diagnostic Test Email (Simulated or Live)
        test_probe_res = await client.post("/api/v1/admin/test-email", headers=headers, json={
            "to_email": "evalai.demo@gmail.com",
            "subject": "Pytest SMTP Test Probe",
            "custom_message": "Automated test probe verification."
        })
        assert test_probe_res.status_code == 200
        assert "success" in test_probe_res.json()

@pytest.mark.asyncio
async def test_assessment_invitations_and_reminders():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Login as Test Creator
        creator_login = await client.post("/api/v1/auth/login", json={
            "email": "recruiter@techcorp.com",
            "password": "Creator@12345"
        })
        creator_token = creator_login.json()["access_token"]
        headers = {"Authorization": f"Bearer {creator_token}"}

        # Get list of assessments
        asm_res = await client.get("/api/v1/assessments", headers=headers)
        assert asm_res.status_code == 200
        assessments = asm_res.json()
        assert len(assessments) > 0
        asm_id = assessments[0]["id"]

        # Invite Candidate
        invite_res = await client.post(
            f"/api/v1/assessments/{asm_id}/invite",
            headers=headers,
            json=["remind_candidate@example.com"]
        )
        assert invite_res.status_code == 200

        # List invitations
        invs_res = await client.get(f"/api/v1/assessments/{asm_id}/invitations", headers=headers)
        assert invs_res.status_code == 200
        invs = invs_res.json()
        assert any(i["email"] == "remind_candidate@example.com" for i in invs)

        # Dispatch assessment reminders
        remind_res = await client.post(
            f"/api/v1/assessments/{asm_id}/send-reminders",
            headers=headers,
            json={}
        )
        assert remind_res.status_code == 200
        assert "sent_count" in remind_res.json()
