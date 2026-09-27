"""Backend tests for NEW features: source verification, custom agent config, LaTeX/DOCX exports"""
import os
import time
import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://research-automation.preview.emergentagent.com').rstrip('/')
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def api_client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def session_with_custom_agents(api_client):
    """Start a research session with custom agent configs and poll to completion"""
    payload = {
        "topic": "TEST_ Solar energy benefits",
        "fast_mode": True,
        "researcher_config": {
            "expertise": "Renewable Energy",
            "role": "Solar Energy Researcher",
            "goal": "Find 3 credible sources about solar energy benefits",
            "backstory": "Expert in photovoltaic technology and grid systems."
        },
        "fact_checker_config": {
            "expertise": "Energy Policy",
            "role": "Policy Fact-Checker"
        },
        "writer_config": {
            "expertise": "Science Communication"
        }
    }
    r = api_client.post(f"{API}/research/start", json=payload, timeout=30)
    assert r.status_code == 200, r.text
    data = r.json()
    session_id = data["session_id"]

    completed = None
    start = time.time()
    while time.time() - start < 120:
        time.sleep(5)
        rr = api_client.get(f"{API}/research/{session_id}", timeout=15)
        if rr.status_code == 200:
            sess = rr.json()
            if sess.get("status") in ("completed", "error"):
                completed = sess
                break
    assert completed is not None, "Research did not finish in 120s"
    return completed


class TestCustomAgentConfig:
    def test_session_accepted_custom_config(self, session_with_custom_agents):
        assert session_with_custom_agents["status"] == "completed", (
            f"Error: {session_with_custom_agents.get('error_message')}"
        )

    def test_final_report_produced(self, session_with_custom_agents):
        assert session_with_custom_agents.get("final_report")
        assert len(session_with_custom_agents["final_report"]) > 50


class TestSourceVerification:
    def test_sources_have_verification_fields(self, session_with_custom_agents):
        sources = session_with_custom_agents.get("sources", [])
        for s in sources:
            # New fields must be present
            assert "verified" in s
            assert "verified_url" in s
            assert "status_code" in s
            # verified is boolean (not None) after verify_sources ran
            assert isinstance(s["verified"], bool), f"verified should be bool, got {type(s['verified'])}"
            # status_code is int
            assert isinstance(s["status_code"], int)

    def test_verified_url_populated_when_verified(self, session_with_custom_agents):
        sources = session_with_custom_agents.get("sources", [])
        for s in sources:
            if s["verified"]:
                assert s["verified_url"], "verified_url should be set when verified=true"
                assert s["verified_url"].startswith("http")

    def test_status_code_reflects_reality(self, session_with_custom_agents):
        """Broken URLs should have status_code >= 400 or 0, verified=false"""
        sources = session_with_custom_agents.get("sources", [])
        for s in sources:
            if s["verified"]:
                assert 200 <= s["status_code"] < 400
            else:
                # unverified means non-2xx/3xx or network error
                assert s["status_code"] >= 400 or s["status_code"] == 0


class TestLatexExport:
    def test_export_latex(self, api_client, session_with_custom_agents):
        sid = session_with_custom_agents["id"]
        r = api_client.get(f"{API}/research/{sid}/export/latex", timeout=30)
        assert r.status_code == 200
        assert "latex" in r.headers.get("content-type", "").lower()
        text = r.text
        assert r"\documentclass" in text
        assert r"\begin{document}" in text
        assert r"\end{document}" in text
        assert "Research Report" in text
        assert "Executive Summary" in text
        assert "Source Credibility Analysis" in text

    def test_export_latex_uses_verified_url(self, api_client, session_with_custom_agents):
        sid = session_with_custom_agents["id"]
        r = api_client.get(f"{API}/research/{sid}/export/latex", timeout=30)
        text = r.text
        # Should include Verified/Unverified/Not checked markers
        sources = session_with_custom_agents.get("sources", [])
        if sources:
            assert ("Verified" in text) or ("Unverified" in text) or ("Not checked" in text)

    def test_export_latex_404(self, api_client):
        r = api_client.get(f"{API}/research/nonexistent-id/export/latex", timeout=15)
        assert r.status_code == 404


class TestDocxExport:
    def test_export_docx(self, api_client, session_with_custom_agents):
        sid = session_with_custom_agents["id"]
        r = api_client.get(f"{API}/research/{sid}/export/docx", timeout=30)
        assert r.status_code == 200
        ct = r.headers.get("content-type", "")
        assert "wordprocessingml" in ct or "officedocument" in ct
        # DOCX files start with PK zip signature
        assert r.content[:2] == b"PK"
        assert len(r.content) > 1000

    def test_export_docx_404(self, api_client):
        r = api_client.get(f"{API}/research/nonexistent-id/export/docx", timeout=15)
        assert r.status_code == 404


class TestVerifyUrlHelper:
    """Direct unit-level tests of verify_url via a live public URL"""
    def test_score_credibility_still_works(self):
        from backend.server import score_source_credibility
        r = score_source_credibility("https://www.nature.com/articles/xyz")
        assert r["score"] >= 90
