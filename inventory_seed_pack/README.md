# Department Inventory Seed Pack

## What is included

- `schema.sql` — PostgreSQL schema, constraints, role/permission tables, stock/asset tracking, issue/return/renewal history tables, views, and cross-department consistency constraints.
- `seed.sql` — synthetic demo dataset.
- `data/` — CSV snapshots for quick review/import into other tools.

## Dataset size

- Departments: 2
- Students: 20 (10 DFIS, 10 Cyber Security)
- Inventory catalogue records: 60 (20 individually tracked item types; 40 quantity-tracked item types)
- Individually tracked physical assets: 50
- Quantity stock records: 40
- Storage locations: 10

## Enrolment number format

`YY + six-digit department code + two-digit course code + two-digit roll number`

- DFIS department code: `000101`; course code: `01`; sample: `260001010101`
- Cyber Security department code: `000102`; course code: `02`; sample: `260001020201`
- All student records use admission year 2026 and roll numbers 01-10 per department.
- A PostgreSQL trigger validates that each student's enrolment number matches their admission year, department code, course code and roll number.

## Item and serial constraints

- `item_code` is required, format-constrained, and unique within a department.
- An item name must be 2-120 non-whitespace characters. Duplicate case-insensitive name + make/model combinations are rejected within the same department. Item names alone are not globally unique because different departments or models can legitimately share a name.
- `asset_tag` is required and globally unique.
- `serial_number` is optional where a manufacturer does not provide one, but when present it must be unique case-insensitively across all assets.
- `INDIVIDUAL` items must have asset records. `QUANTITY` items must have a quantity-stock balance. Database triggers prevent creating assets for quantity-tracked types or quantity stock for individual-tracked types.
- `quantity_stock` prevents negative counts and enforces that total quantity equals the sum of available, issued, damaged, lost, maintenance and retired quantities.
- The seed includes opening-balance / asset-registration stock transactions, so initial stock is not silent.

## Authentication safety

All seeded accounts are `PENDING_ACTIVATION`. Password hashes and default passwords are intentionally not supplied. Do not change these users to `ACTIVE` until an authorised onboarding flow has assigned a secure password hash or linked a verified identity-provider account. The `.example` email addresses are synthetic placeholders, not deliverable accounts.

## Load the data

Create an empty PostgreSQL database, then run:

```bash
psql -d inventory_db -f schema.sql
psql -d inventory_db -f seed.sql
```

Run commands from this directory, or provide the full paths to the files. The schema script is intended for a fresh database and will fail if these tables already exist.

## Scope and implementation notes

The schema matches the main requirements and adds the important constraints that were absent from the earlier outline. Application service code must still implement transactional issue/return/renewal operations, lock stock rows during concurrent issuance, check actor permissions and department scope on every request, update the stock balances + transaction ledger together, and ensure approved renewals update `issue_lines.due_date` atomically. Those workflow rules cannot be fully enforced with simple `CHECK` constraints alone.

The database does not create any historical issues or returns in the seed. It supplies the students, opening inventory, assets, and stock ledger. Use the actual issue/return workflows to create borrowing history.