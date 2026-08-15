import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.services.coding_templates import CodingTemplateService

@pytest.mark.asyncio
async def test_coding_templates_service():
    # Test service methods
    summaries = CodingTemplateService.get_template_summaries()
    assert len(summaries) >= 5
    assert any(s["id"] == "two-sum" for s in summaries)
    assert any(s["id"] == "valid-parentheses" for s in summaries)

    two_sum = CodingTemplateService.get_template_detail("two-sum")
    assert two_sum is not None
    assert "Two Sum" in two_sum["title"]
    assert "python" in two_sum["starter_code"]
    assert len(two_sum["test_cases"]) >= 2

    # Language snippets
    py_snippet = CodingTemplateService.get_language_snippet("python")
    assert "def solve():" in py_snippet
    js_snippet = CodingTemplateService.get_language_snippet("javascript")
    assert "function solve()" in js_snippet

@pytest.mark.asyncio
async def test_coding_templates_api_endpoints():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # List templates
        res = await ac.get("/api/v1/coding/templates")
        assert res.status_code == 200
        templates = res.json()
        assert isinstance(templates, list)
        assert len(templates) > 0

        # Filter by difficulty
        res_easy = await ac.get("/api/v1/coding/templates?difficulty=EASY")
        assert res_easy.status_code == 200
        for item in res_easy.json():
            assert item["difficulty"] == "EASY"

        # Detail endpoint
        res_detail = await ac.get("/api/v1/coding/templates/two-sum")
        assert res_detail.status_code == 200
        data = res_detail.json()
        assert data["id"] == "two-sum"
        assert len(data["test_cases"]) > 0

        # Snippet endpoint
        res_snip = await ac.get("/api/v1/coding/snippets/cpp")
        assert res_snip.status_code == 200
        assert "iostream" in res_snip.json()["starter_code"]
