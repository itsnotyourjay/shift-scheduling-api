# Staff Shift Scheduling API

A REST API for managing staff shifts end-to-end — scheduling, assignment, attendance tracking, and analytics. Built with NestJS and PostgreSQL as a take-home assessment submission.

Two user roles are supported: **Manager** (full CRUD, assign staff, view all attendance and analytics) and **Staff** (view own shifts, clock in/out, personal analytics).

---

## Tech Decisions

### Why PostgreSQL?
Native UUID and TIMESTAMP support without workarounds. Better suited for relational scheduling data where join queries on dates/times matter.

### Why TypeORM over Prisma?
TypeORM uses decorators directly on entity classes — no separate schema file, no codegen step. It integrates naturally with NestJS's module system and `@nestjs/typeorm`. Easier to reason about when reading the code top-to-bottom.

### Why JWT + Passport.js?
Standard pairing for NestJS auth. `passport-jwt` handles Bearer token extraction cleanly, and `JwtAuthGuard` + `RolesGuard` in `common/guards/` keep route protection declarative.

---

## Prerequisites

- **Node.js** v18 or higher
- **PostgreSQL** 14+ running locally (or a remote connection string)
- Create the database before starting:

```sql
CREATE DATABASE shift_scheduling;
```

---

## Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

| Variable | Description |
|----------|-------------|
| `DB_HOST` | PostgreSQL host (usually `localhost`) |
| `DB_PORT` | PostgreSQL port (default `5432`) |
| `DB_USER` | PostgreSQL username |
| `DB_PASS` | PostgreSQL password |
| `DB_NAME` | Database name (create it first — see Prerequisites) |
| `JWT_SECRET` | Any long random string — used to sign and verify tokens |
| `JWT_EXPIRES_IN` | Token expiry duration (e.g. `7d`, `24h`) |
| `PORT` | Port the server listens on (default `3000`) |

---

## Setup

```bash
# 1. Clone the repo
git clone https://github.com/jayrelljerryiaan/staff-shift-scheduling-api.git
cd staff-shift-scheduling-api

# 2. Install dependencies
npm install

# 3. Create and fill in your .env
cp .env.example .env
# Edit .env with your DB credentials and JWT secret

# 4. Start the server (TypeORM synchronize:true handles table creation in dev)
npm run start:dev
```

No manual migrations needed in development — TypeORM auto-creates tables on first start.

---

## Seeding

Populates the database with test users (1 manager + 3 staff), 5–8 shifts, assignments, and attendance logs covering all status values (`present`, `late`, `absent`).

```bash
npm run seed
```

Seed accounts:

| Email | Password | Role |
|-------|----------|------|
| manager@example.com | password | manager |
| staff1@example.com | password | staff |
| staff2@example.com | password | staff |
| staff3@example.com | password | staff |

---

## Swagger Documentation

Once the server is running, interactive API docs are available at:

```
http://localhost:3000/api/docs
```

All endpoints are documented with request/response schemas. Use the **Authorize** button to paste a Bearer token and test protected routes directly in the browser.

---

## API Endpoints

```
Auth
  POST    /api/auth/register
  POST    /api/auth/login
  GET     /api/auth/me

Shifts
  GET     /api/shifts
  POST    /api/shifts
  GET     /api/shifts/:id
  PUT     /api/shifts/:id
  DELETE  /api/shifts/:id
  POST    /api/shifts/:id/assign
  DELETE  /api/shifts/:id/assign/:userId

Attendance
  POST    /api/attendance/:shiftId/clock-in
  POST    /api/attendance/:shiftId/clock-out
  GET     /api/attendance/:shiftId

Analytics
  GET     /api/analytics/dashboard

Users
  GET     /api/users
```

---

## What Was Completed

- [x] NestJS project scaffolded with global prefix `/api`
- [x] PostgreSQL + TypeORM connection via `ConfigService` (async)
- [x] `User` entity — UUID PK, bcrypt password (`select: false`), role enum
- [x] Auth module — register, login, `GET /me`, JWT strategy, `JwtAuthGuard`, `RolesGuard`
- [x] `@Roles()` and `@CurrentUser()` decorators
- [x] `HttpExceptionFilter` — standardised error response shape
- [x] `ValidationPipe` on all DTOs
- [x] Swagger setup with Bearer auth
- [ ] Shifts module (CRUD + assign/unassign + overlap detection)
- [ ] Attendance module (clock-in/out + status logic)
- [ ] Analytics module (role-aware dashboard)
- [ ] Users listing endpoint (`GET /api/users`)
- [ ] Seed script (`npm run seed`)
- [ ] Postman collection export (`postman/` folder)

---

## What Was NOT Completed

- Shifts, Attendance, Analytics, and Users modules are not yet implemented (Days 2–5 of the build plan)
- Seed script does not exist yet — `npm run seed` will fail until Day 4/5
- Postman collection has not been exported yet
- Swagger decorators are only on Auth endpoints so far

---

## Known Limitations

- **Absent status is not auto-set** — there is no cron job to mark staff as `absent` at end of day. It would need to be set manually or via a scheduled task (e.g. `@nestjs/schedule`)
- **`synchronize: true` is dev-only** — in production this should be replaced with proper TypeORM migrations
- **No rate limiting** — register and login endpoints are not rate-limited, which is a security gap for production use
- **Single-user password reset not implemented** — no forgot-password or reset flow
