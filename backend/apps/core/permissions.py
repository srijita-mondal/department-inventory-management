from rest_framework.permissions import BasePermission
from .services import has_permission

class HasDatabasePermission(BasePermission):
    """Set required_permission_code and optionally resolve_department_id(view, request)."""
    message = "You do not have permission to perform this action."

    def has_permission(self, request, view):
        code = getattr(view, "required_permission_code", None)
        if not code:
            return False  # protected by default
        resolver = getattr(view, "resolve_department_id", None)
        department_id = resolver(request) if callable(resolver) else None
        return has_permission(request.user, code, department_id)
