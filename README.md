# Fingerprint Authentication System (FastAPI + React + PostgreSQL + Docker)

Production‑grade, containerized system to enroll and authenticate students using SecuGen fingerprint readers.
Backend: FastAPI + SQLAlchemy + Alembic + PostgreSQL. Frontend: React (TypeScript).
Includes a safe USB writer and a stubbed SecuGen SDK binding for development.


## Table of Contents
- Quick Start
- Project Stack
- Project Structure
- Project Flow
- Local Setup (Windows)
- Docker Setup
- How to Run
- Troubleshooting
- Security Notes
- License


## Quick Start
Prerequisites
- Windows with Docker Desktop OR local Python 3.11 + Node.js 18+
- Git

Steps (Docker, recommended)
1) Clone: git clone <repo> && cd auth-biometric
2) Copy env: copy .env.example .env (edit if needed)
3) Start: docker compose up --build
4) Open: Frontend http://localhost:3000 • API docs http://localhost:8000/docs


## Project Stack
- Backend: FastAPI, SQLAlchemy, Alembic, python‑jose (JWT), psycopg2
- Database: PostgreSQL 15
- Frontend: React 18 + TypeScript (CRA)
- Containers: Docker + docker‑compose
- Testing: pytest (backend)
- Device SDK: SecuGen FDx SDK Pro (Windows) — stub provided at backend/app/secugen_binding.py


## Project Structure
- backend/
  - Dockerfile
  - requirements.txt
  - alembic/
    - env.py, versions/0001_create_students_table.py
  - app/
    - main.py, config.py, database.py, models.py, schemas.py, crud.py
    - fingerprint_service.py, secugen_binding.py, usb_writer.py
    - routes/
      - enrollment.py, auth.py, admin.py, status.py
    - tests/
      - test_auth_integration.py, test_crud.py, conftest.py
- frontend/
  - Dockerfile, package.json, tsconfig.json
  - src/
    - index.tsx, App.tsx
    - components/ FingerprintCapture.tsx, StudentForm.tsx
    - pages/ Enrollment.tsx, Capture.tsx, AdminDashboard.tsx
- docker-compose.yml, docker-compose.prod.yml (placeholder), README.md, .env.example, .gitignore
- drivers/ FDx SDK and driver archives (Windows only, not used in containers)


## Project Flow
1. Enrollment
   - Frontend submits metadata; backend captures fingerprint via SecuGen binding.
   - On success, template bytes (not images) + metadata stored in PostgreSQL.
   - On failure/unavailable device, fallback path (OTP/PIN) is indicated.
2. Authentication
   - Backend captures a probe and matches against stored templates (stubbed logic now).
   - On match, returns JWT and basic student info.
3. Admin
   - List students; delete requires confirm=DELETE-{id}.
4. Status
   - /status reports device connectivity and USB dataset presence (USB_DATASET_MOUNT).
5. USB Writer
   - usb_writer.py performs dry‑run by default; requires explicit confirmation to write.


## Local Setup (Windows)
1) Prerequisites: Python 3.11, Node.js 18+, PostgreSQL 15 (if not using Docker), optional SecuGen SDK.
2) Environment
- Copy .env.example to .env and set, e.g.:
  - DATABASE_URL=postgresql+psycopg2://postgres:postgres@db:5432/fingerprintdb
  - SECRET_KEY=REPLACE_ME_STRONG_RANDOM
  - SECUGEN_SDK_PATH=C:\FDx SDK Pro for Windows v4.3.1\bin\x64
  - USB_DATASET_MOUNT=E:\\student_usb_mountpoint
3) Backend
```powershell
cd backend
py -3.11 -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
# Dev quickstart tables are auto‑created by app; for prod run Alembic:
# alembic upgrade head
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
4) Frontend
```powershell
cd frontend
npm install
npm start
```


## Docker Setup
Development (docker-compose.yml)
- Services: postgres db, backend (uvicorn), frontend (CRA dev server)
- Start
```powershell
docker compose up --build
```
- URLs
  - Frontend: http://localhost:3000
  - Backend API docs: http://localhost:8000/docs

Production (docker-compose.prod.yml)
- Placeholder; customize for your infra (backend image, static frontend via Nginx, managed Postgres, secrets, TLS).
- Run Alembic in backend container during deploy.


## How to Run
- Local (no Docker)
  - Backend: uvicorn app.main:app --reload
  - Frontend: npm start
- Docker (recommended)
  - docker compose up -d
- Health
  - GET http://localhost:8000/status/


## Troubleshooting
- DB connection errors: ensure db service is healthy or DATABASE_URL is correct.
- Device not detected: set SECUGEN_SDK_PATH and install Windows drivers; stub logs a warning otherwise.
- CORS in dev: configure CRA proxy or add CORS middleware in FastAPI for http://localhost:3000.
- Performance: naive linear template scan — replace with proper SDK matching/indexing for large datasets.


## Security Notes
- Store only fingerprint templates, not raw images.
- Keep SECRET_KEY and DB credentials in secret stores in production.
- USB writer is dry‑run by default; require explicit human confirmation for writes.
- Use TLS and enable encryption at rest (e.g., Postgres + disk encryption).
- Maintain audit logs for biometric operations per local regulations.


## License
© 2025 Hussain Gull — All rights reserved. Custom internal licensing for educational/enterprise use.