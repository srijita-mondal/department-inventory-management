# Secure Django Backend — Phase 1

This backend is a **Phase 1 foundation** for the Department Inventory and Student Item Issue Management System. It uses Django, Django REST Framework and PostgreSQL, and maps the authoritative schema in `../inventory_seed_pack/schema.sql`. It does not implement inventory issue/return/renewal workflows yet.

## Existing schema is authoritative

All schema-owned models in `apps/core/models.py` use `managed = False`. Django must not create, reset, migrate or reseed these existing tables. The SQL pack is provided for operators to apply manually to a **fresh, intentionally created database only**. Never run schema.sql against an existing database: it is not idempotent. Seed accounts remain `PENDING_ACTIVATION` with no usable passwords.

The custom `AUTH_USER_MODEL` maps to the existing `users` table and its `password_hash` column; it does not create an `auth_user` table. The model excludes `last_login` and Django groups/permissions. Existing application RBAC tables remain the authority. The three database views are mapped as unmanaged models with stable row keys.

## Setup (PowerShell)

1. Install PostgreSQL 14+ and create an empty database plus a least-privilege application role. The role needs normal application reads and the writes required for Django's own session/content-type/migration tables, but should not own or alter the inventory schema.
2. From `backend/`:

```powershell
py -3.12 -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
Copy-Item .env.example .env
```

3. Set a strong `DJANGO_SECRET_KEY` and PostgreSQL values in the environment (or use your preferred environment loader). Do not commit `.env`. For local development only, set `DJANGO_DEBUG=true`.
4. Apply `inventory_seed_pack/schema.sql` and then `seed.sql` manually only to a new empty database, after reviewing both files. For example, from repository root: `psql -d inventory_db -f inventory_seed_pack/schema.sql`, then `psql -d inventory_db -f inventory_seed_pack/seed.sql`. Do not run these as part of Django startup.
5. From `backend/`, run `python manage.py check`. Review `python manage.py showmigrations` and the migration plan before applying Django's own framework migrations. Apply them only to a separate test database or an approved application database after reviewing that unmanaged tables are not created.
6. Start with `python manage.py runserver` for local development. Do not use runserver in production.

## API

All routes are under `/api/`:
- `GET /health/` — minimal process health.
- `GET /auth/csrf/` — sets CSRF cookie and returns a CSRF token for same-origin browser clients.
- `POST /auth/login/` — JSON `{"email":"...","password":"..."}`; generic failure response; active LOCAL accounts only.
- `POST /auth/logout/` — authenticated session, POST with CSRF token.
- `GET /auth/me/` — safe current identity, own profile, role assignments and permission codes.
- `GET /auth/access/` — own role/permission context.

Browser clients must first GET `/api/auth/csrf/`, then send the returned token as `X-CSRFToken` on unsafe requests. Keep cookies enabled. Session cookies are HttpOnly, SameSite=Lax and Secure outside DEBUG. Configure exact allowed hosts and HTTPS/CSRF trusted origins for the deployed domain; no wildcard credentialed CORS is configured.

## Account provisioning

The SQL seed intentionally provides no default passwords and leaves all accounts pending. Before provisioning, an authorised operator must independently verify the identity against institutional records. Run `python manage.py provision_account --email exact@address --verified-by "operator identifier; verification ticket/reference"`. The command requires an existing unique registry account and prompts twice for a password without echoing it. It does not change department memberships, role assignments or email verification timestamps. This command records no institutional proof itself; operators must preserve that reference through the institution's approved process. Bootstrap a first administrator only by this same trusted local process for a previously verified existing record, then separately apply a documented, authorised role assignment using the institution's controlled DBA process. No public administrator endpoint exists.

## Authorization notes

Permission codes are read from `role_permissions` and `permissions`, not hard-coded UI state. Department roles require an active membership in the same department. A global role assignment is treated as global only for `SYSTEM_ADMIN`. Unknown/missing permission requirements deny by default through `HasDatabasePermission`. Always pass a concrete department id to `has_permission` for department-scoped operations. Future APIs must filter querysets by authorised department before fetching objects and re-check object-level ownership. The current phase exposes identity/access context only, not inventory endpoints.

## Testing and limitations

Use a dedicated PostgreSQL test database, never a production or seed database. No automated test suite against PostgreSQL was executed as part of this initial repository commit; run system checks and tests after configuring the test database. This phase does not claim PostgreSQL RLS, MFA, production-grade distributed login lockout, email verification, OIDC, inventory transaction services, full audit-table writes or end-to-end security test coverage. The default DRF/cache throttle is process-local and is only a supplemental throttle; production requires a shared cache and a persistent login-failure control (for example, the configured django-axes integration after its middleware/settings are enabled and verified). Review all security settings and authorization behavior before deployment.
