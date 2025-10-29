# Journyx-like Timesheets (Dockerized)

An open-source starter to emulate core Journyx-style timekeeping: timesheets, time entries,
basic approvals, CSV export for payroll/ERP, and a simple React web UI. Uses FastAPI, PostgreSQL,
Redis, Celery, and Nginx—packaged with Docker Compose.

## Quick Start

```bash
# 1) Copy env defaults
cp .env.example .env

# 2) Build and start
docker compose up -d --build

# 3) (Optional) Seed sample data
docker compose run --rm api python seed.py

# 4) Open the app
# API docs: http://localhost:5701/docs
# Web UI:   http://localhost:5700
```

## Features
- Create timesheets and time entries
- Submit/approve workflows (single approver to start)
- CSV export for a given week (download via API)
- Minimal React UI for weekly entry
- Nginx reverse proxy for `/api`

## Configuration
- `.env` carries DB credentials, app secrets, and dev mode flag `DEV_AUTH` to bypass OIDC.
- JWT auth is used for the web UI. Set `JWT_SECRET`, `JWT_ACCESS_TOKEN_EXPIRE_MINUTES`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `ADMIN_NAME` in `.env` (defaults provided in `.env.example`). Startup creates the admin account if it does not already exist.

## Seed Data

`python seed.py` (or `make seed`) seeds a couple of example users, a team, projects, and activities:

- **Admin User** (`admin@example.com` / `Admin123!`) – admin role, access to every panel
- **Maya Manager** (`maya.manager@example.com` / `Manager123!`) – manager/approver, panels: timesheets, manage data, submitted
- **Eli Employee** (`eli.employee@example.com` / `Employee123!`) – employee role, panel: timesheets

The seed also creates a "Delivery Team" with Maya as the leader and associates the demo projects/activities with that team.

## Notes
- Keycloak SSO is optional and commented in `compose.yml`. You can enable when needed.
- This is an MVP scaffold—extend with multi-level approvals, expense tracking, and advanced reports.


## TimescaleDB & Redis
- The `db` service runs TimescaleDB (PostgreSQL with time-series features).
- On startup the API enables the `timescaledb` extension and converts `time_entries(date)` into a hypertable.
- Redis powers Celery jobs and can also be used for caching/rate-limiting later.
