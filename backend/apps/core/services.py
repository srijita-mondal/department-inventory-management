from django.db.models import Q
from .models import DepartmentMembership, RoleAssignment, RolePermission

GLOBAL_SCOPE_ROLES = {"SYSTEM_ADMIN"}

def is_active_user(user):
    return bool(user and getattr(user, "is_authenticated", False) and user.account_status == "ACTIVE")

def get_active_assignments(user):
    if not is_active_user(user):
        return RoleAssignment.objects.none()
    return RoleAssignment.objects.filter(user_id=user.pk, role__role_permissions__isnull=False).select_related("role").distinct()

def get_effective_permissions(user):
    if not is_active_user(user):
        return set()
    assignments = get_active_assignments(user)
    codes = set()
    for assignment in assignments:
        # Global scope is reserved for the explicit system-admin role. Other global
        # assignments do not silently become institution-wide grants.
        if assignment.department_id is None and assignment.role.code not in GLOBAL_SCOPE_ROLES:
            continue
        permission_codes = RolePermission.objects.filter(role_id=assignment.role_id).values_list("permission__code", flat=True)
        codes.update(permission_codes)
    return codes

def is_department_member(user, department_id):
    if not is_active_user(user) or department_id is None:
        return False
    return DepartmentMembership.objects.filter(
        user_id=user.pk, department_id=department_id, status="ACTIVE"
    ).exists()

def get_authorized_department_ids(user):
    if not is_active_user(user):
        return set()
    assigned = RoleAssignment.objects.filter(user_id=user.pk, department_id__isnull=False).values_list("department_id", flat=True)
    memberships = DepartmentMembership.objects.filter(user_id=user.pk, status="ACTIVE").values_list("department_id", flat=True)
    return set(assigned).intersection(set(memberships))

def has_permission(user, permission_code, department_id=None):
    if not is_active_user(user):
        return False
    assignments = RoleAssignment.objects.filter(
        user_id=user.pk, role__role_permissions__permission__code=permission_code
    ).select_related("role").distinct()
    for assignment in assignments:
        if assignment.department_id == department_id and department_id is not None:
            if is_department_member(user, department_id):
                return True
        elif assignment.department_id is None and assignment.role.code in GLOBAL_SCOPE_ROLES:
            return True
    return False
