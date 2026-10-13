from .models import DepartmentMembership, RoleAssignment

GLOBAL_SCOPE_ROLES = {"SYSTEM_ADMIN"}

def is_active_user(user):
    return bool(user and getattr(user, "is_authenticated", False) and user.account_status == "ACTIVE")

def get_effective_permissions(user):
    if not is_active_user(user):
        return set()
    codes = set()
    assignments = RoleAssignment.objects.filter(user_id=user.pk).select_related("role").prefetch_related("role__role_permissions__permission")
    for assignment in assignments:
        if assignment.department_id is None:
            if assignment.role.code not in GLOBAL_SCOPE_ROLES:
                continue
        elif not DepartmentMembership.objects.filter(
            user_id=user.pk, department_id=assignment.department_id, status="ACTIVE"
        ).exists():
            continue
        for link in assignment.role.role_permissions.all():
            codes.add(link.permission.code)
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
        if department_id is not None and assignment.department_id == department_id:
            if is_department_member(user, department_id):
                return True
        elif assignment.department_id is None and assignment.role.code in GLOBAL_SCOPE_ROLES:
            # Global scope is only effective for permissions explicitly granted to SYSTEM_ADMIN in the DB.
            return True
    return False
