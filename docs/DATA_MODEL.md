# Data model overview

- **User**: account, role, student enrolment and programme information.
- **StorageLocation**: department/lab/room/cupboard location.
- **InventoryItem**: catalogue entry, tracking type, total quantity, and aggregate unavailable quantity for quantity-tracked stock.
- **Asset**: individually tracked asset tag, serial number, condition, status, and location.
- **Loan**: issue, student, item/asset, quantity issued/outstanding, dates, purpose, and issuing coordinator.
- **RenewalRequest**: request, status, remarks, reviewer, and revised due date.
- **Transaction**: timestamped record of issues, returns, renewal actions, and stock adjustments.

For real deployment, add foreign-key enforcement, migration scripts, indexes, and a policy for retaining audit records.
