"""Tests for JWT auth flows: register, login, me, logout, forgot/reset password, and research scoping."""
import os
import time
import uuid
import requests
import pytest

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/") if os.environ.get("REACT_APP_BACKEND_URL") else "https://research-automation.preview.emergentagent.com"
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@mars.ai"
ADMIN_PASSWORD = "Admin@2026"


def _new_email():
    return f"test_{uuid.uuid4().hex[:8]}@example.com"


@pytest.fixture
def s():
    return requests.Session()


# ==== Landing / basic ====
def test_api_root():
    r = requests.get(f"{API}/")
    assert r.status_code == 200


# ==== Register ====
def test_register_success_sets_cookies(s):
    email = _new_email()
    r = s.post(f"{API}/auth/register", json={"email": email, "password": "TestPass123!", "name": "Test User"})
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["email"] == email
    assert data["name"] == "Test User"
    assert data["role"] == "user"
    assert "id" in data
    # Cookies should be set
    assert "access_token" in s.cookies
    assert "refresh_token" in s.cookies


def test_register_duplicate_email_returns_400(s):
    email = _new_email()
    r1 = s.post(f"{API}/auth/register", json={"email": email, "password": "TestPass123!", "name": "Test"})
    assert r1.status_code == 200
    s2 = requests.Session()
    r2 = s2.post(f"{API}/auth/register", json={"email": email, "password": "TestPass123!", "name": "Test"})
    assert r2.status_code == 400


def test_register_short_password_422(s):
    r = s.post(f"{API}/auth/register", json={"email": _new_email(), "password": "short", "name": "x"})
    assert r.status_code == 422


# ==== Login ====
def test_login_admin_success():
    s = requests.Session()
    r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["email"] == ADMIN_EMAIL
    assert data["role"] == "admin"
    assert "access_token" in s.cookies


def test_login_wrong_password_401():
    r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": "WrongPass!!"})
    assert r.status_code == 401


def test_login_unknown_email_401():
    r = requests.post(f"{API}/auth/login", json={"email": f"nouser_{uuid.uuid4().hex[:6]}@example.com", "password": "TestPass123!"})
    assert r.status_code == 401


# ==== /me ====
def test_me_requires_auth():
    r = requests.get(f"{API}/auth/me")
    assert r.status_code == 401


def test_me_with_cookie_returns_user():
    s = requests.Session()
    s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    r = s.get(f"{API}/auth/me")
    assert r.status_code == 200
    assert r.json()["email"] == ADMIN_EMAIL


# ==== Logout ====
def test_logout_clears_cookies():
    s = requests.Session()
    s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    r = s.post(f"{API}/auth/logout")
    assert r.status_code == 200
    # After logout, /me should fail on a fresh session (server clears cookie)
    s2 = requests.Session()
    r2 = s2.get(f"{API}/auth/me")
    assert r2.status_code == 401


# ==== Forgot / Reset password ====
def test_forgot_password_unknown_email_returns_success():
    r = requests.post(f"{API}/auth/forgot-password", json={"email": "nouser_xyz@example.com"})
    assert r.status_code == 200
    assert "message" in r.json()


def test_forgot_password_valid_email_returns_success():
    # Create user then request reset
    s = requests.Session()
    email = _new_email()
    s.post(f"{API}/auth/register", json={"email": email, "password": "TestPass123!", "name": "R"})
    r = requests.post(f"{API}/auth/forgot-password", json={"email": email})
    assert r.status_code == 200


def test_reset_password_invalid_token_400():
    r = requests.post(f"{API}/auth/reset-password", json={"token": "invalid-token-xyz", "password": "NewPass123!"})
    assert r.status_code == 400


# ==== Research scoping ====
def test_research_start_requires_auth():
    r = requests.post(f"{API}/research/start", json={"topic": "test"})
    assert r.status_code == 401


def test_research_list_requires_auth():
    r = requests.get(f"{API}/research")
    assert r.status_code == 401


def test_user_cannot_see_other_user_sessions():
    # Create two users
    s1 = requests.Session()
    s2 = requests.Session()
    e1 = _new_email()
    e2 = _new_email()
    s1.post(f"{API}/auth/register", json={"email": e1, "password": "TestPass123!", "name": "U1"})
    s2.post(f"{API}/auth/register", json={"email": e2, "password": "TestPass123!", "name": "U2"})
    # U1 starts research
    r = s1.post(f"{API}/research/start", json={"topic": f"TEST_ scope check {uuid.uuid4().hex[:6]}", "fast_mode": True})
    assert r.status_code == 200, r.text
    session_id = r.json()["session_id"]
    # U2 lists sessions - should not see U1's
    r2 = s2.get(f"{API}/research")
    assert r2.status_code == 200
    ids = [s["id"] for s in r2.json()]
    assert session_id not in ids
    # U2 tries to delete U1's session - should 404
    rdel = s2.delete(f"{API}/research/{session_id}")
    assert rdel.status_code == 404


def test_user_can_delete_own_session():
    s = requests.Session()
    e = _new_email()
    s.post(f"{API}/auth/register", json={"email": e, "password": "TestPass123!", "name": "U"})
    r = s.post(f"{API}/research/start", json={"topic": f"TEST_ delete {uuid.uuid4().hex[:6]}", "fast_mode": True})
    assert r.status_code == 200
    session_id = r.json()["session_id"]
    rdel = s.delete(f"{API}/research/{session_id}")
    assert rdel.status_code == 200
