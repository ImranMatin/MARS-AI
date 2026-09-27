# MARS Test Credentials

## Admin Account
- **Email**: admin@mars.ai
- **Password**: Admin@2026
- **Role**: admin

## Auth Endpoints
- POST /api/auth/register - {email, password, name}
- POST /api/auth/login - {email, password}
- POST /api/auth/logout - authenticated
- GET /api/auth/me - authenticated
- POST /api/auth/refresh - uses refresh_token cookie
- POST /api/auth/forgot-password - {email}
- POST /api/auth/reset-password - {token, password}

## Notes
- JWT tokens stored as httpOnly cookies (access_token, refresh_token)
- Access token expires in 60 minutes
- Refresh token expires in 7 days
- Password reset tokens expire in 1 hour
- Brute force lockout: 5 failed attempts = 15 min lockout
- All research sessions are scoped to the logged-in user
- Admin can see all users' sessions
