"""Read-only ORM mappings for schema-owned tables; Django must not create them."""
from django.contrib.auth.base_user import AbstractBaseUser
from django.db import models
from .managers import UserManager

class User(AbstractBaseUser):
    id = models.BigAutoField(primary_key=True)
    full_name = models.CharField(max_length=120)
    email = models.EmailField(max_length=254)
    password = models.CharField(max_length=128, db_column="password_hash", null=True, blank=True)
    auth_provider = models.CharField(max_length=12, default="LOCAL")
    account_status = models.CharField(max_length=20, default="PENDING_ACTIVATION")
    email_verified_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField()
    last_login = None
    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["full_name"]
    objects = UserManager()
    class Meta:
        db_table = "users"
        managed = False
    @property
    def is_active(self):
        return self.account_status == "ACTIVE"
    @property
    def is_staff(self):
        return False
    def get_full_name(self):
        return self.full_name
    def get_short_name(self):
        return self.full_name.split()[0] if self.full_name else self.email

class Department(models.Model):
    id = models.BigAutoField(primary_key=True)
    code = models.CharField(max_length=6)
    short_code = models.CharField(max_length=12)
    name = models.CharField(max_length=120)
    status = models.CharField(max_length=12)
    created_at = models.DateTimeField()
    class Meta: db_table = "departments"; managed = False

class StudentProfile(models.Model):
    id = models.BigAutoField(primary_key=True)
    user = models.OneToOneField(User, db_column="user_id", on_delete=models.DO_NOTHING, related_name="student_profile")
    department = models.ForeignKey(Department, db_column="department_id", on_delete=models.DO_NOTHING)
    enrolment_number = models.CharField(max_length=12)
    admission_year = models.SmallIntegerField()
    course_code = models.CharField(max_length=2)
    roll_number = models.SmallIntegerField()
    programme = models.CharField(max_length=120)
    semester = models.SmallIntegerField()
    contact_phone = models.CharField(max_length=30, null=True, blank=True)
    created_at = models.DateTimeField()
    class Meta: db_table = "student_profiles"; managed = False

class DepartmentMembership(models.Model):
    user = models.ForeignKey(User, db_column="user_id", on_delete=models.DO_NOTHING)
    department = models.ForeignKey(Department, db_column="department_id", on_delete=models.DO_NOTHING)
    membership_type = models.CharField(max_length=12)
    status = models.CharField(max_length=12)
    created_at = models.DateTimeField()
    class Meta:
        db_table = "department_memberships"; managed = False
        unique_together = (("user", "department"),)

class Role(models.Model):
    id = models.BigAutoField(primary_key=True)
    code = models.CharField(max_length=40)
    name = models.CharField(max_length=80)
    class Meta: db_table = "roles"; managed = False

class Permission(models.Model):
    id = models.BigAutoField(primary_key=True)
    code = models.CharField(max_length=80)
    description = models.CharField(max_length=240)
    class Meta: db_table = "permissions"; managed = False

class RolePermission(models.Model):
    role = models.ForeignKey(Role, db_column="role_id", on_delete=models.DO_NOTHING, related_name="role_permissions")
    permission = models.ForeignKey(Permission, db_column="permission_id", on_delete=models.DO_NOTHING, related_name="role_permissions")
    class Meta:
        db_table = "role_permissions"; managed = False
        unique_together = (("role", "permission"),)

class RoleAssignment(models.Model):
    id = models.BigAutoField(primary_key=True)
    user = models.ForeignKey(User, db_column="user_id", on_delete=models.DO_NOTHING)
    role = models.ForeignKey(Role, db_column="role_id", on_delete=models.DO_NOTHING)
    department = models.ForeignKey(Department, db_column="department_id", null=True, blank=True, on_delete=models.DO_NOTHING)
    assigned_by = models.ForeignKey(User, db_column="assigned_by", null=True, blank=True, related_name="role_assignments_made", on_delete=models.DO_NOTHING)
    assigned_at = models.DateTimeField()
    class Meta: db_table = "role_assignments"; managed = False

class StorageLocation(models.Model):
    id = models.BigAutoField(primary_key=True)
    department = models.ForeignKey(Department, db_column="department_id", on_delete=models.DO_NOTHING)
    location_code = models.CharField(max_length=32)
    name = models.CharField(max_length=120)
    location_type = models.CharField(max_length=20)
    status = models.CharField(max_length=12)
    class Meta: db_table = "storage_locations"; managed = False

class InventoryItem(models.Model):
    id = models.BigAutoField(primary_key=True)
    department = models.ForeignKey(Department, db_column="department_id", on_delete=models.DO_NOTHING)
    item_code = models.CharField(max_length=32)
    name = models.CharField(max_length=120)
    category = models.CharField(max_length=80)
    description = models.TextField()
    make_model = models.CharField(max_length=120, null=True, blank=True)
    tracking_type = models.CharField(max_length=12)
    unit = models.CharField(max_length=24)
    status = models.CharField(max_length=12)
    created_at = models.DateTimeField()
    class Meta: db_table = "inventory_items"; managed = False

class QuantityStock(models.Model):
    item = models.OneToOneField(InventoryItem, db_column="item_id", primary_key=True, on_delete=models.DO_NOTHING)
    department = models.ForeignKey(Department, db_column="department_id", on_delete=models.DO_NOTHING)
    total_quantity = models.IntegerField()
    available_quantity = models.IntegerField()
    issued_quantity = models.IntegerField()
    damaged_quantity = models.IntegerField()
    lost_quantity = models.IntegerField()
    maintenance_quantity = models.IntegerField()
    retired_quantity = models.IntegerField()
    updated_at = models.DateTimeField()
    class Meta: db_table = "quantity_stock"; managed = False

class Asset(models.Model):
    id = models.BigAutoField(primary_key=True)
    department = models.ForeignKey(Department, db_column="department_id", on_delete=models.DO_NOTHING)
    inventory_item = models.ForeignKey(InventoryItem, db_column="inventory_item_id", on_delete=models.DO_NOTHING)
    asset_tag = models.CharField(max_length=32)
    serial_number = models.CharField(max_length=100, null=True, blank=True)
    location = models.ForeignKey(StorageLocation, db_column="location_id", on_delete=models.DO_NOTHING)
    current_condition = models.CharField(max_length=12)
    status = models.CharField(max_length=14)
    acquired_date = models.DateField()
    created_at = models.DateTimeField()
    class Meta: db_table = "assets"; managed = False

class DepartmentPolicy(models.Model):
    department = models.OneToOneField(Department, db_column="department_id", primary_key=True, on_delete=models.DO_NOTHING)
    max_units_per_student = models.IntegerField()
    max_renewals_per_issue = models.IntegerField()
    renewal_request_before_due_days = models.IntegerField()
    allow_overdue_renewal = models.BooleanField()
    updated_at = models.DateTimeField()
    class Meta: db_table = "department_policies"; managed = False

class Issue(models.Model):
    id = models.BigAutoField(primary_key=True)
    department = models.ForeignKey(Department, db_column="department_id", on_delete=models.DO_NOTHING)
    student = models.ForeignKey(StudentProfile, db_column="student_id", on_delete=models.DO_NOTHING)
    issued_by = models.ForeignKey(User, db_column="issued_by", on_delete=models.DO_NOTHING)
    purpose = models.CharField(max_length=500)
    status = models.CharField(max_length=12)
    created_at = models.DateTimeField()
    class Meta: db_table = "issues"; managed = False

class IssueLine(models.Model):
    id = models.BigAutoField(primary_key=True)
    issue = models.ForeignKey(Issue, db_column="issue_id", on_delete=models.DO_NOTHING)
    department = models.ForeignKey(Department, db_column="department_id", on_delete=models.DO_NOTHING)
    inventory_item = models.ForeignKey(InventoryItem, db_column="inventory_item_id", on_delete=models.DO_NOTHING)
    asset = models.ForeignKey(Asset, db_column="asset_id", null=True, blank=True, on_delete=models.DO_NOTHING)
    issue_date = models.DateField()
    quantity_issued = models.IntegerField()
    quantity_returned = models.IntegerField()
    due_date = models.DateField()
    renewal_count = models.IntegerField()
    created_at = models.DateTimeField()
    class Meta: db_table = "issue_lines"; managed = False

class ReturnRecord(models.Model):
    id = models.BigAutoField(primary_key=True)
    issue = models.ForeignKey(Issue, db_column="issue_id", on_delete=models.DO_NOTHING)
    department = models.ForeignKey(Department, db_column="department_id", on_delete=models.DO_NOTHING)
    return_date = models.DateField()
    received_at = models.DateTimeField()
    received_by = models.ForeignKey(User, db_column="received_by", on_delete=models.DO_NOTHING)
    notes = models.CharField(max_length=1000, null=True, blank=True)
    class Meta: db_table = "returns"; managed = False

class ReturnLine(models.Model):
    id = models.BigAutoField(primary_key=True)
    return_record = models.ForeignKey(ReturnRecord, db_column="return_id", on_delete=models.DO_NOTHING)
    issue = models.ForeignKey(Issue, db_column="issue_id", on_delete=models.DO_NOTHING)
    issue_line = models.ForeignKey(IssueLine, db_column="issue_line_id", on_delete=models.DO_NOTHING)
    department = models.ForeignKey(Department, db_column="department_id", on_delete=models.DO_NOTHING)
    quantity_returned = models.IntegerField()
    condition_on_return = models.CharField(max_length=20)
    notes = models.CharField(max_length=1000, null=True, blank=True)
    created_at = models.DateTimeField()
    class Meta: db_table = "return_lines"; managed = False

class RenewalRequest(models.Model):
    id = models.BigAutoField(primary_key=True)
    issue_line = models.ForeignKey(IssueLine, db_column="issue_line_id", on_delete=models.DO_NOTHING)
    department = models.ForeignKey(Department, db_column="department_id", on_delete=models.DO_NOTHING)
    requested_by = models.ForeignKey(User, db_column="requested_by", on_delete=models.DO_NOTHING)
    requested_at = models.DateTimeField()
    request_date = models.DateField()
    status = models.CharField(max_length=12)
    old_due_date = models.DateField()
    revised_due_date = models.DateField(null=True, blank=True)
    decided_by = models.ForeignKey(User, db_column="decided_by", null=True, blank=True, related_name="renewal_decisions", on_delete=models.DO_NOTHING)
    decided_at = models.DateTimeField(null=True, blank=True)
    remarks = models.CharField(max_length=1000, null=True, blank=True)
    class Meta: db_table = "renewal_requests"; managed = False

class StockTransaction(models.Model):
    id = models.BigAutoField(primary_key=True)
    department = models.ForeignKey(Department, db_column="department_id", on_delete=models.DO_NOTHING)
    inventory_item = models.ForeignKey(InventoryItem, db_column="inventory_item_id", on_delete=models.DO_NOTHING)
    asset = models.ForeignKey(Asset, db_column="asset_id", null=True, blank=True, on_delete=models.DO_NOTHING)
    transaction_type = models.CharField(max_length=24)
    quantity = models.IntegerField()
    from_bucket = models.CharField(max_length=16)
    to_bucket = models.CharField(max_length=16)
    reason = models.CharField(max_length=1000)
    performed_by = models.ForeignKey(User, db_column="performed_by", null=True, blank=True, on_delete=models.DO_NOTHING)
    issue = models.ForeignKey(Issue, db_column="issue_id", null=True, blank=True, on_delete=models.DO_NOTHING)
    return_record = models.ForeignKey(ReturnRecord, db_column="return_id", null=True, blank=True, on_delete=models.DO_NOTHING)
    occurred_at = models.DateTimeField()
    class Meta: db_table = "stock_transactions"; managed = False

class AuditLog(models.Model):
    id = models.BigAutoField(primary_key=True)
    department = models.ForeignKey(Department, db_column="department_id", null=True, blank=True, on_delete=models.DO_NOTHING)
    actor_user = models.ForeignKey(User, db_column="actor_user_id", null=True, blank=True, on_delete=models.DO_NOTHING)
    action = models.CharField(max_length=80)
    entity_type = models.CharField(max_length=80)
    entity_id = models.CharField(max_length=80, null=True, blank=True)
    reason = models.CharField(max_length=1000, null=True, blank=True)
    before_values = models.JSONField()
    after_values = models.JSONField()
    request_id = models.CharField(max_length=100, null=True, blank=True)
    occurred_at = models.DateTimeField()
    class Meta: db_table = "audit_logs"; managed = False

class InventorySummary(models.Model):
    inventory_item_id = models.BigIntegerField(primary_key=True)
    department_id = models.BigIntegerField()
    department_name = models.CharField(max_length=120)
    item_code = models.CharField(max_length=32)
    item_name = models.CharField(max_length=120)
    category = models.CharField(max_length=80)
    tracking_type = models.CharField(max_length=12)
    total_quantity = models.IntegerField()
    available_quantity = models.IntegerField()
    issued_quantity = models.IntegerField()
    damaged_quantity = models.IntegerField()
    lost_quantity = models.IntegerField()
    maintenance_quantity = models.IntegerField()
    retired_quantity = models.IntegerField()
    overdue_quantity = models.IntegerField()
    class Meta: db_table = "v_inventory_summary"; managed = False

class OverdueIssue(models.Model):
    issue_line_id = models.BigIntegerField(primary_key=True)
    department_id = models.BigIntegerField()
    department_name = models.CharField(max_length=120)
    enrolment_number = models.CharField(max_length=12)
    student_name = models.CharField(max_length=120)
    item_code = models.CharField(max_length=32)
    item_name = models.CharField(max_length=120)
    quantity_issued = models.IntegerField()
    quantity_returned = models.IntegerField()
    outstanding_quantity = models.IntegerField()
    due_date = models.DateField()
    overdue_days = models.IntegerField()
    issue_id = models.BigIntegerField()
    class Meta: db_table = "v_overdue_issues"; managed = False

class UpcomingDueIssue(models.Model):
    issue_line_id = models.BigIntegerField(primary_key=True)
    department_id = models.BigIntegerField()
    department_name = models.CharField(max_length=120)
    enrolment_number = models.CharField(max_length=12)
    student_name = models.CharField(max_length=120)
    item_code = models.CharField(max_length=32)
    item_name = models.CharField(max_length=120)
    outstanding_quantity = models.IntegerField()
    due_date = models.DateField()
    days_until_due = models.IntegerField()
    issue_id = models.BigIntegerField()
    class Meta: db_table = "v_upcoming_due_issues"; managed = False
