import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_user_management_and_excel_export():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # 1. Login as Admin
        login_res = await ac.post("/api/v1/auth/login", json={
            "email": "admin@assessmentportal.io",
            "password": "Admin@12345"
        })
        assert login_res.status_code == 200
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 2. List all users
        users_res = await ac.get("/api/v1/admin/users/all", headers=headers)
        assert users_res.status_code == 200
        data = users_res.json()
        assert "admins" in data
        assert "teachers" in data
        assert "students" in data
        assert data["total_users"] > 0

        # 3. Export Excel spreadsheet
        excel_res = await ac.get("/api/v1/admin/users/export-excel", headers=headers)
        assert excel_res.status_code == 200
        assert excel_res.headers["content-type"] == "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        assert len(excel_res.content) > 0
