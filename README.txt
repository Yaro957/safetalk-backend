# SafeTalk Backend

## Setup
1. Copy .env.example to .env and set values.
2. Run: `npm install`
3. Start dev: `npm run dev`

## API
- POST /api/auth/register {name,email,password}
- POST /api/auth/login {email,password}
- POST /api/calls/upload multipart/form-data: recording(file), caller, receiver, timestamp(ISO), duration(seconds)
- GET /api/calls
- GET /api/calls/:id (downloads file)

Authorization: `Authorization: Bearer <token>`


