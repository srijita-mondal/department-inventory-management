from django.test import SimpleTestCase
from apps.core.models import (
    Asset, AuditLog, Department, DepartmentMembership, DepartmentPolicy,
    InventoryItem, InventorySummary, Issue, IssueLine, OverdueIssue, Permission,
    QuantityStock, RenewalRequest, ReturnLine, ReturnRecord, Role, RoleAssignment,
    RolePermission, StockTransaction, StorageLocation, StudentProfile, UpcomingDueIssue, User,
)

class ExistingSchemaMappingTests(SimpleTestCase):
    def test_schema_models_are_unmanaged(self):
        mapped = [
            User, Department, StudentProfile, DepartmentMembership, Role, Permission,
            RolePermission, RoleAssignment, StorageLocation, InventoryItem, QuantityStock,
            Asset, DepartmentPolicy, Issue, IssueLine, ReturnRecord, ReturnLine,
            RenewalRequest, StockTransaction, AuditLog, InventorySummary, OverdueIssue,
            UpcomingDueIssue,
        ]
        self.assertTrue(all(model._meta.managed is False for model in mapped))

    def test_user_maps_existing_table_and_password_column(self):
        self.assertEqual(User._meta.db_table, "users")
        self.assertEqual(User._meta.get_field("password").db_column, "password_hash")
        self.assertNotIn("last_login", [field.name for field in User._meta.fields])
        self.assertEqual(User._meta.managed, False)

    def test_view_models_use_stable_row_identifiers(self):
        self.assertEqual(InventorySummary._meta.pk.name, "inventory_item_id")
        self.assertEqual(OverdueIssue._meta.pk.name, "issue_line_id")
        self.assertEqual(UpcomingDueIssue._meta.pk.name, "issue_line_id")
