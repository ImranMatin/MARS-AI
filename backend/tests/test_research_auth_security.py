"""
Tests for security fixes on research endpoints (iteration_7):
- GET /api/research/{id}, /export/*, /stream/{id} require auth + ownership
- POST /api/auth/logout works without auth
- Malformed JWT sub returns 401 (not 500)
"""
import os
import uuid
import time
import requests
import pytest
import jwt as pyjwt
from datetime import datetime, timezone, timedelta

def _load_backend_url():
    url = os.environ.get("REACT_APP_BACKEND_URL")
    if url:
        return url.rstrip("/")
    env_path = "/app/frontend/.env"
    if os.path.exists(env_path):
        with open(env_path) as f:
            for line in f:
                if line.startswith("REACT_APP_BACKEND_URL="):
                    return line.split("=", 1)[1].strip().rstrip("/")
    raise RuntimeError("REACT_APP_BACKEND_URL not set")

BASE_URL = _load_backend_url()
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@mars.ai"
ADMIN_PASSWORD = "Admin@2026"


def _new_email():
    return f"test_sec_{uuid.uuid4().hex[:8]}@example.com"


# ============ Fixtures ============
@pytest.fixture(scope="module")
def owner_session_and_id():
    """Register user A, start a research session, return (session, session_id, user_id)."""
    s = requests.Session()
    email = _new_email()
    r = s.post(f"{API}/auth/register", json={"email": email, "password": "OwnerPass123!", "name": "Owner"})
    assert r.status_code == 200, r.text
    user_id = r.json()["id"]

    # Start a research session (fast_mode for speed)
    r2 = s.post(f"{API}/research/start", json={"topic": "TEST_security_topic", "fast_mode": True})
    assert r2.status_code == 200, r2.text
    session_id = r2.json()["session_id"]
    return s, session_id, user_id


@pytest.fixture(scope="module")
def other_user_session():
    """Register user B (non-admin, non-owner)."""
    s = requests.Session()
    email = _new_email()
    r = s.post(f"{API}/auth/register", json={"email": email, "password": "OtherPass123!", "name": "Other"})
    assert r.status_code == 200, r.text
    return s


@pytest.fixture(scope="module")
def admin_session():
    s = requests.Session()
    r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, r.text
    return s


# ============ Unauth (401) tests ============
def test_get_session_requires_auth(owner_session_and_id):
    _, session_id, _ = owner_session_and_id
    r = requests.get(f"{API}/research/{session_id}")
    assert r.status_code == 401, r.text


@pytest.mark.parametrize("fmt", ["pdf", "markdown", "json", "latex", "docx"])
def test_export_requires_auth(owner_session_and_id, fmt):
    _, session_id, _ = owner_session_and_id
    r = requests.get(f"{API}/research/{session_id}/export/{fmt}")
    assert r.status_code == 401, f"{fmt}: {r.status_code} {r.text[:200]}"


def test_stream_requires_auth(owner_session_and_id):
    _, session_id, _ = owner_session_and_id
    r = requests.get(f"{API}/research/stream/{session_id}", stream=False, timeout=10)
    assert r.status_code == 401, r.text


# ============ Non-owner (403) tests ============
def test_get_session_non_owner_403(owner_session_and_id, other_user_session):
    _, session_id, _ = owner_session_and_id
    r = other_user_session.get(f"{API}/research/{session_id}")
    assert r.status_code == 403, r.text


@pytest.mark.parametrize("fmt", ["pdf", "markdown", "json", "latex", "docx"])
def test_export_non_owner_403(owner_session_and_id, other_user_session, fmt):
    _, session_id, _ = owner_session_and_id
    r = other_user_session.get(f"{API}/research/{session_id}/export/{fmt}")
    assert r.status_code == 403, f"{fmt}: {r.status_code} {r.text[:200]}"


def test_stream_non_owner_403(owner_session_and_id, other_user_session):
    _, session_id, _ = owner_session_and_id
    r = other_user_session.get(f"{API}/research/stream/{session_id}", stream=False, timeout=10)
    assert r.status_code == 403, r.text


# ============ Owner (positive) tests ============
def test_owner_can_get_session(owner_session_and_id):
    s, session_id, _ = owner_session_and_id
    r = s.get(f"{API}/research/{session_id}")
    assert r.status_code == 200, r.text
    assert r.json()["id"] == session_id


def test_owner_can_export_markdown(owner_session_and_id):
    s, session_id, _ = owner_session_and_id
    r = s.get(f"{API}/research/{session_id}/export/markdown")
    # 200 even if session not complete - md gen tolerates partial data
    assert r.status_code == 200, r.text


def test_owner_can_export_json(owner_session_and_id):
    s, session_id, _ = owner_session_and_id
    r = s.get(f"{API}/research/{session_id}/export/json")
    assert r.status_code == 200, r.text


# ============ Admin (positive) tests ============
def test_admin_can_access_any_session(owner_session_and_id, admin_session):
    _, session_id, _ = owner_session_and_id
    r = admin_session.get(f"{API}/research/{session_id}")
    assert r.status_code == 200, r.text


def test_admin_can_export_any_session(owner_session_and_id, admin_session):
    _, session_id, _ = owner_session_and_id
    r = admin_session.get(f"{API}/research/{session_id}/export/markdown")
    assert r.status_code == 200, r.text


# ============ 404 test ============
def test_nonexistent_session_returns_404_when_authed(other_user_session):
    fake = "nonexistent-session-id-xyz"
    r = other_user_session.get(f"{API}/research/{fake}")
    assert r.status_code == 404, r.text


# ============ Logout without auth ============
def test_logout_without_auth_succeeds():
    s = requests.Session()
    r = s.post(f"{API}/auth/logout")
    assert r.status_code == 200, r.text
    assert "message" in r.json()


def test_logout_with_invalid_cookie_succeeds():
    s = requests.Session()
    s.cookies.set("access_token", "invalid.jwt.token")
    r = s.post(f"{API}/auth/logout")
    assert r.status_code == 200, r.text


# ============ Malformed JWT sub -> 401 (not 500) ============
def test_malformed_jwt_sub_returns_401():
    """JWT signed with correct secret but sub is not a valid ObjectId."""
    secret = os.environ.get("JWT_SECRET")
    if not secret:
        # Fetch from backend .env directly
        env_path = "/app/backend/.env"
        if os.path.exists(env_path):
            with open(env_path) as f:
                for line in f:
                    if line.startswith("JWT_SECRET="):
                        secret = line.split("=", 1)[1].strip().strip('"').strip("'")
                        break
    if not secret:
        pytest.skip("JWT_SECRET not available")

    payload = {
        "sub": "not-a-valid-objectid",
        "email": "bad@example.com",
        "exp": datetime.now(timezone.utc) + timedelta(minutes=5),
        "type": "access",
    }
    bad_token = pyjwt.encode(payload, secret, algorithm="HS256")
    s = requests.Session()
    s.cookies.set("access_token", bad_token)
    r = s.get(f"{API}/auth/me")
    assert r.status_code == 401, f"Expected 401, got {r.status_code}: {r.text}"


def test_completely_invalid_jwt_returns_401():
    s = requests.Session()
    s.cookies.set("access_token", "totally.invalid.token")
    r = s.get(f"{API}/auth/me")
    assert r.status_code == 401


# ============ Regression: auth me still works ============
def test_me_endpoint_regression(admin_session):
    r = admin_session.get(f"{API}/auth/me")
    assert r.status_code == 200
    assert r.json()["email"] == ADMIN_EMAIL
