# Architecture

## Request flow

Browser → Flask route → role/ownership checks → SQLAlchemy model changes → SQLite commit → server-rendered Jinja template.

## Main modules

- `app.py`: route handlers, validation, workflow rules, CLI commands.
- `models.py`: users, locations, inventory catalogue, individual assets, loans, renewals, and transaction history.
- `extensions.py`: shared SQLAlchemy instance.
- `templates/`: server-rendered pages.
- `tests/`: route-level tests for due-date and renewal behaviour.

## Important invariants

- `Loan.quantity_outstanding` tracks the portion of an issue that has not been returned.
- A loan closes only when outstanding quantity reaches zero.
- Individual assets have unique asset tags and a single status.
- A pending renewal request leaves the loan due date unchanged.
- An approved renewal advances the existing due date by 15 calendar days.
- Stock and loan changes are committed only after validation passes.

## Next architecture improvements

Use database migrations, a dedicated service layer for transactions, CSRF protection, pagination, structured audit events, API schemas, and a production database such as PostgreSQL before a campus-wide rollout.
