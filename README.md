# Department Inventory & Student Item Issue Management System

> **New backend foundation:** the separate [`backend/`](backend/README.md) directory contains a Phase 1 Django + DRF + PostgreSQL authentication/RBAC foundation. The authoritative PostgreSQL schema and synthetic seed SQL are stored in [`inventory_seed_pack/`](inventory_seed_pack/README.md). The existing Flask/SQLite MVP remains in the repository as the current demo UI; it has not been silently replaced or connected to the new backend.

A web-based inventory and borrowing tracker built around **Problem Statement #5**. It supports coordinator-managed stock, individually tracked assets, student borrowing, 15-calendar-day due dates, renewals requiring approval, partial returns, item condition tracking, and overdue monitoring.

> **Status:** Functional starter MVP for development and demonstration. It uses SQLite and a small Flask application. Before production deployment, add institutional SSO, CSRF protection, database migrations, audit-log hardening, backups, and deployment secrets management.

## Features

- Role-based accounts: `coordinator` and `student`.
- Inventory catalogue and quantity-based stock.
- Individually tracked assets with unique asset IDs and condition/status.
- Registered-student checks before issue.
- Stock and availability validation; failed transactions do not alter stock.
- Due date automatically set to 15 calendar days after issue.
- Renewal requests do not change due dates until approved; approval adds 15 days to the existing due date.
- Complete and partial returns, with condition captured before stock is restored.
- Damaged, lost, and maintenance stock stays unavailable until an authorised coordinator changes its status.
- Overdue list with student, item, outstanding quantity, due date, and overdue days.
- Student dashboard and borrowing history.
- SQLite database created automatically on first run.
- Seed/demo data command and basic automated tests.

## Technology

- Python 3.11+
- Flask
- SQLite
- HTML templates + CSS
- pytest

## Quick start

### 1. Create and activate a virtual environment

Windows PowerShell:

```powershell
py -m venv .venv
.venv\Scripts\Activate.ps1
```

macOS/Linux:

```bash
python3 -m venv .venv
source .venv/bin/activate
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure environment

Copy `.env.example` to `.env` and change `SECRET_KEY` before deployment. The application has safe local-development defaults, but do not use those defaults in production.

### 4. Initialise the database and add demo data

```bash
flask --app app init-db
flask --app app seed-demo
```

Demo accounts:

| Role | Username | Password |
|---|---|---|
| Coordinator | `coordinator` | `ChangeMe123!` |
| Student | `student1` | `ChangeMe123!` |

Change demo passwords immediately if you use the project beyond a local demo.

### 5. Run

```bash
flask --app app run --debug
```

Open http://127.0.0.1:5000.

## Core business rules implemented

1. Only registered students can borrow.
2. Only usable, available stock can be issued.
3. Requested quantity cannot exceed availability.
4. An individual asset can have only one active borrower.
5. Due date = issue date + 15 calendar days.
6. A request alone never extends the due date.
7. Approved renewal = current due date + 15 calendar days.
8. Returned stock becomes available only after return receipt and condition are recorded.
9. Damaged/lost/maintenance stock remains unavailable until a coordinator changes its status.
10. Partial returns leave the remainder outstanding.
11. Issues, returns, renewals, and stock changes are recorded with timestamps and responsible accounts.

## Repository layout

```text
.
├── app.py                  # Routes and business workflows
├── models.py               # SQLAlchemy data models
├── extensions.py           # Shared database extension
├── requirements.txt
├── .env.example
├── .gitignore
├── pytest.ini
├── tests/
│   ├── conftest.py
│   └── test_workflows.py
├── templates/              # Jinja templates
├── static/style.css
└── docs/
    ├── ARCHITECTURE.md
    ├── BRANCHING.md
    ├── DATA_MODEL.md
    └── ROADMAP.md
```

## Secure Django backend (Phase 1)

The Django backend is developed separately from the existing Flask MVP. It maps existing database tables as unmanaged models, adds session-based authentication endpoints, and reads application permissions from the SQL seed pack. It intentionally does not yet implement inventory transaction APIs. Follow [`backend/README.md`](backend/README.md) for setup, provisioning, CSRF, and security limitations. Do not run the SQL schema or seed scripts against a non-empty database.

## Git branching workflow

The repository is organised to grow with the team:

- `main`: stable, demoable releases only.
- `develop`: integration branch for completed features.
- `feature/<short-name>`: one feature per branch.
- `fix/<short-name>`: bug fixes.
- `release/<version>`: optional release hardening.
- `hotfix/<short-name>`: urgent fixes branched from `main`.

Read [`docs/BRANCHING.md`](docs/BRANCHING.md) for exact commands and pull-request rules.

## Tests

```bash
pytest
```

## Important scope notes

This is a starter implementation, not a production-ready campus deployment. It currently uses simple username/password login, SQLite, and server-rendered pages. The current user roles are intentionally simple. Real deployments should add password reset, stronger password policy, CSRF protection, session controls, institution-approved identity integration, database migrations, automated backups, export controls, and a privacy review.

## Requirements traceability

| Requirement from problem statement | Where to find it |
|---|---|
| Inventory items and asset distinction | `models.py`, coordinator inventory pages |
| Registered students only | issue workflow in `app.py` |
| 15-day due date | issue workflow in `app.py` |
| Renewal approval required | renewal routes in `app.py` |
| Partial returns and condition recording | return route in `app.py` |
| Overdue tracking | dashboard and overdue route |
| Role-based access | login decorators and role checks |
| Transaction history | `Transaction` model and history pages |
