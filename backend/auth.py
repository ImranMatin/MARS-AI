"""Authentication module for MARS - JWT-based auth with email password reset via Resend"""
import os
import re
import ipaddress
import secrets
import logging
from datetime import datetime, timezone, timedelta
from html import escape
from html.parser import HTMLParser
from urllib.parse import urlparse
from typing import Optional

import bcrypt
import jwt
import httpx
from fastapi import APIRouter, HTTPException, Request, Response, Depends
from pydantic import BaseModel, EmailStr, Field
from bson import ObjectId

logger = logging.getLogger(__name__)

# ============ Config ============
JWT_ALGORITHM = "HS256"
EMAIL_BASE_URL = "https://integrations.emergentagent.com"

# ============ Password Hashing ============
def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))

# ============ JWT ============
def get_jwt_secret() -> str:
    return os.environ["JWT_SECRET"]

def create_access_token(user_id: str, email: str) -> str:
    payload = {"sub": user_id, "email": email, "exp": datetime.now(timezone.utc) + timedelta(minutes=60), "type": "access"}
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

def create_refresh_token(user_id: str) -> str:
    payload = {"sub": user_id, "exp": datetime.now(timezone.utc) + timedelta(days=7), "type": "refresh"}
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

def set_auth_cookies(response: Response, access_token: str, refresh_token: str):
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=True, samesite="none", max_age=3600, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=True, samesite="none", max_age=604800, path="/")

# ============ Email Guardrails Gate ============
_SHORTENERS = ("bit.ly", "tinyurl.com", "t.co", "is.gd", "cutt.ly", "goo.gl", "rebrand.ly")
_CRED_ASK = ("reply with your password", "reply with the code", "send your password", "cvv",
             "send us your password", "enter your password below", "confirm your card number",
             "your full card number", "seed phrase", "recovery phrase", "verify your card",
             "social security number", "confirm your bank details")
_HOSTISH = re.compile(r"\b(?:https?://)?((?:[a-z0-9-]+\.)+[a-z]{2,})", re.I)

def _host_ok(host: str) -> bool:
    if not host or "xn--" in host:
        return False
    try:
        ipaddress.ip_address(host)
        return False
    except ValueError:
        pass
    return not any(host == s or host.endswith("." + s) for s in _SHORTENERS)

def _same_site(shown: str, real: str) -> bool:
    return shown == real or real.endswith("." + shown) or shown.endswith("." + real)

class _EmailScan(HTMLParser):
    def __init__(self):
        super().__init__()
        self.tags, self.urls, self.anchors = set(), [], []
        self._href, self._text = None, []
    def handle_starttag(self, tag, attrs):
        self.tags.add(tag.lower())
        self.urls += [v for k, v in attrs if k.lower() in ("href", "src") and v]
        if tag.lower() == "a":
            self._href = dict((k.lower(), v) for k, v in attrs).get("href")
            self._text = []
    def handle_data(self, data):
        if self._href is not None:
            self._text.append(data)
    def handle_endtag(self, tag):
        if tag.lower() == "a" and self._href is not None:
            self.anchors.append((self._href, "".join(self._text)))
            self._href, self._text = None, []

def _assert_safe_email(subject: str, html: str) -> None:
    scan = _EmailScan(); scan.feed(html)
    if scan.tags & {"form", "input", "textarea", "select"}:
        raise ValueError("No forms or input fields in email (G2)")
    body = f"{subject}\n{html}".lower()
    for p in _CRED_ASK:
        if p in body:
            raise ValueError(f"Email asks for credentials: {p!r} (G2)")
    for url in scan.urls:
        low = url.strip().lower()
        if low.startswith(("mailto:", "tel:", "cid:", "#")):
            continue
        if not low.startswith("https://"):
            raise ValueError(f"Email links must be absolute https: {url!r} (G3)")
        host = urlparse(low).hostname or ""
        if not _host_ok(host) or urlparse(low).username is not None:
            raise ValueError(f"Bad URL: {url!r} (G3)")
    for href, text in scan.anchors:
        real = urlparse(href.strip().lower()).hostname or ""
        if not real:
            continue
        for m in _HOSTISH.finditer(text):
            if not _same_site(m.group(1).lower(), real):
                raise ValueError(f"Anchor mismatch (G3)")

async def send_email(*, to: str, subject: str, html: str) -> Optional[str]:
    _assert_safe_email(subject, html)
    email_key = os.environ.get("EMERGENT_EMAIL_KEY")
    if not email_key:
        logger.warning("EMERGENT_EMAIL_KEY not configured; skipping email send")
        return None
    payload = {
        "to": [to],
        "subject": subject,
        "html": html,
        "from_name": os.environ.get("EMAIL_FROM_NAME", "MARS Research"),
    }
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                f"{EMAIL_BASE_URL}/api/v1/email/send",
                headers={"X-Email-Key": email_key},
                json=payload,
            )
        resp.raise_for_status()
        return resp.json().get("id")
    except httpx.HTTPStatusError as e:
        logger.error(f"Email send failed: {e.response.status_code} {e.response.text}")
        return None
    except Exception as e:
        logger.error(f"Email send error: {str(e)}")
        return None

# ============ Pydantic Models ============
class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=100)
    name: str = Field(min_length=1, max_length=100)

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    password: str = Field(min_length=8, max_length=100)

# ============ Auth Dependency Factory ============
def make_get_current_user(db):
    async def get_current_user(request: Request) -> dict:
        token = request.cookies.get("access_token")
        if not token:
            auth_header = request.headers.get("Authorization", "")
            if auth_header.startswith("Bearer "):
                token = auth_header[7:]
        if not token:
            raise HTTPException(status_code=401, detail="Not authenticated")
        try:
            payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
            if payload.get("type") != "access":
                raise HTTPException(status_code=401, detail="Invalid token type")
            try:
                user_oid = ObjectId(payload["sub"])
            except Exception:
                raise HTTPException(status_code=401, detail="Invalid token subject")
            user = await db.users.find_one({"_id": user_oid})
            if not user:
                raise HTTPException(status_code=401, detail="User not found")
            user["id"] = str(user["_id"])
            del user["_id"]
            user.pop("password_hash", None)
            return user
        except jwt.ExpiredSignatureError:
            raise HTTPException(status_code=401, detail="Token expired")
        except jwt.InvalidTokenError:
            raise HTTPException(status_code=401, detail="Invalid token")
    return get_current_user

# ============ Router Factory ============
def create_auth_router(db, get_frontend_url):
    router = APIRouter(prefix="/api/auth", tags=["auth"])
    get_current_user = make_get_current_user(db)
    
    async def is_locked_out(identifier: str) -> bool:
        cutoff = datetime.now(timezone.utc) - timedelta(minutes=15)
        count = await db.login_attempts.count_documents({
            "identifier": identifier,
            "created_at": {"$gte": cutoff}
        })
        return count >= 5
    
    async def record_failed_attempt(identifier: str):
        await db.login_attempts.insert_one({
            "identifier": identifier,
            "created_at": datetime.now(timezone.utc)
        })
    
    async def clear_attempts(identifier: str):
        await db.login_attempts.delete_many({"identifier": identifier})
    
    @router.post("/register")
    async def register(body: RegisterRequest, request: Request, response: Response):
        email = body.email.lower().strip()
        existing = await db.users.find_one({"email": email})
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        user_doc = {
            "email": email,
            "password_hash": hash_password(body.password),
            "name": body.name.strip(),
            "role": "user",
            "created_at": datetime.now(timezone.utc),
        }
        result = await db.users.insert_one(user_doc)
        user_id = str(result.inserted_id)
        
        access_token = create_access_token(user_id, email)
        refresh_token = create_refresh_token(user_id)
        set_auth_cookies(response, access_token, refresh_token)
        
        return {"id": user_id, "email": email, "name": body.name.strip(), "role": "user"}
    
    @router.post("/login")
    async def login(body: LoginRequest, request: Request, response: Response):
        email = body.email.lower().strip()
        client_ip = request.client.host if request.client else "unknown"
        identifier = f"{client_ip}:{email}"
        
        if await is_locked_out(identifier):
            raise HTTPException(status_code=429, detail="Too many failed attempts. Try again in 15 minutes.")
        
        user = await db.users.find_one({"email": email})
        if not user or not verify_password(body.password, user["password_hash"]):
            await record_failed_attempt(identifier)
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        await clear_attempts(identifier)
        user_id = str(user["_id"])
        access_token = create_access_token(user_id, email)
        refresh_token = create_refresh_token(user_id)
        set_auth_cookies(response, access_token, refresh_token)
        
        return {
            "id": user_id,
            "email": user["email"],
            "name": user.get("name", ""),
            "role": user.get("role", "user")
        }
    
    @router.post("/logout")
    async def logout(response: Response):
        # Always clear cookies, even if token is invalid/expired
        response.delete_cookie("access_token", path="/")
        response.delete_cookie("refresh_token", path="/")
        return {"message": "Logged out"}
    
    @router.get("/me")
    async def me(current_user: dict = Depends(get_current_user)):
        return current_user
    
    @router.post("/refresh")
    async def refresh_token(request: Request, response: Response):
        token = request.cookies.get("refresh_token")
        if not token:
            raise HTTPException(status_code=401, detail="No refresh token")
        try:
            payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
            if payload.get("type") != "refresh":
                raise HTTPException(status_code=401, detail="Invalid token type")
            user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
            if not user:
                raise HTTPException(status_code=401, detail="User not found")
            new_access_token = create_access_token(str(user["_id"]), user["email"])
            response.set_cookie(
                key="access_token", value=new_access_token,
                httponly=True, secure=True, samesite="none",
                max_age=3600, path="/"
            )
            return {"message": "Token refreshed"}
        except jwt.ExpiredSignatureError:
            raise HTTPException(status_code=401, detail="Refresh token expired")
        except jwt.InvalidTokenError:
            raise HTTPException(status_code=401, detail="Invalid refresh token")
    
    @router.post("/forgot-password")
    async def forgot_password(body: ForgotPasswordRequest):
        email = body.email.lower().strip()
        user = await db.users.find_one({"email": email})
        # Always return success to avoid email enumeration
        if not user:
            return {"message": "If an account exists, a reset link has been sent"}
        
        token = secrets.token_urlsafe(32)
        expires_at = datetime.now(timezone.utc) + timedelta(hours=1)
        
        await db.password_reset_tokens.insert_one({
            "token": token,
            "user_id": str(user["_id"]),
            "email": email,
            "expires_at": expires_at,
            "used": False,
            "created_at": datetime.now(timezone.utc),
        })
        
        frontend_url = get_frontend_url()
        reset_link = f"{frontend_url}/reset-password?token={token}"
        
        # Also log to console for testing without email
        logger.info(f"Password reset link for {email}: {reset_link}")
        
        subject = "Reset your MARS Research password"
        html = f'''<table role="presentation" width="100%" style="max-width:600px;margin:auto;font-family:Arial,sans-serif">
<tr><td style="padding:24px">
<h2 style="color:#0a1428;margin:0 0 16px">Reset your password</h2>
<p style="color:#333;line-height:1.5">Hi {escape(user.get("name", "there"))},</p>
<p style="color:#333;line-height:1.5">We received a request to reset your password for your MARS Research account. Click the button below to choose a new password. This link expires in 1 hour.</p>
<p style="margin:32px 0"><a href="{reset_link}" style="background:#22c55e;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;font-weight:600">Reset Password</a></p>
<p style="color:#666;font-size:14px;line-height:1.5">If you didn't request this, you can safely ignore this email. Your password will not change.</p>
<hr style="border:none;border-top:1px solid #eee;margin:24px 0">
<p style="color:#888;font-size:12px">Sent by MARS Research. We never ask for your password by email.</p>
</td></tr></table>'''
        
        await send_email(to=email, subject=subject, html=html)
        return {"message": "If an account exists, a reset link has been sent"}
    
    @router.post("/reset-password")
    async def reset_password(body: ResetPasswordRequest):
        token_doc = await db.password_reset_tokens.find_one({"token": body.token})
        if not token_doc:
            raise HTTPException(status_code=400, detail="Invalid or expired token")
        if token_doc.get("used"):
            raise HTTPException(status_code=400, detail="Token already used")
        # Handle timezone-naive datetimes stored in Mongo
        expires_at = token_doc["expires_at"]
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if expires_at < datetime.now(timezone.utc):
            raise HTTPException(status_code=400, detail="Token expired")
        
        user_id = token_doc["user_id"]
        new_hash = hash_password(body.password)
        
        await db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"password_hash": new_hash}}
        )
        await db.password_reset_tokens.update_one(
            {"_id": token_doc["_id"]},
            {"$set": {"used": True, "used_at": datetime.now(timezone.utc)}}
        )
        return {"message": "Password reset successfully"}
    
    return router, get_current_user

async def seed_admin_and_indexes(db):
    """Create MongoDB indexes and seed admin user"""
    # Indexes
    await db.users.create_index("email", unique=True)
    await db.password_reset_tokens.create_index("expires_at", expireAfterSeconds=3600)
    await db.password_reset_tokens.create_index("token", unique=True)
    await db.login_attempts.create_index("identifier")
    await db.login_attempts.create_index("created_at", expireAfterSeconds=1800)
    
    # Seed admin
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@mars.ai").lower()
    admin_password = os.environ.get("ADMIN_PASSWORD", "Admin@2026")
    existing = await db.users.find_one({"email": admin_email})
    if existing is None:
        await db.users.insert_one({
            "email": admin_email,
            "password_hash": hash_password(admin_password),
            "name": "MARS Admin",
            "role": "admin",
            "created_at": datetime.now(timezone.utc),
        })
        logger.info(f"Seeded admin user: {admin_email}")
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one(
            {"email": admin_email},
            {"$set": {"password_hash": hash_password(admin_password)}}
        )
        logger.info(f"Updated admin password: {admin_email}")
