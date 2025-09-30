# SafeTalk Backend

## Setup
1. Copy .env.example to .env and set values.
2. Run: `npm install`
3. Start dev: `npm run dev`

## API
- POST /api/auth/register {name,email,password}
- POST /api/auth/login {email,password}
- POST /api/calls/upload JSON body: caller, receiver, timestamp(ISO), duration(seconds), transcript(optional string)
- GET /api/calls
- GET /api/calls/:id (returns metadata)

Authorization: `Authorization: Bearer <token>`

## Email (OTP)
- Required env:
  - `MAIL_HOST`
  - `MAIL_USER`
  - `MAIL_PASS`
- Endpoints:
  - POST `/api/auth/send-otp` { email }
  - POST `/api/auth/verify-otp` { email, otp }


