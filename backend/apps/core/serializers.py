from rest_framework import serializers
from .models import User, StudentProfile

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField(max_length=254)
    password = serializers.CharField(write_only=True, trim_whitespace=False, max_length=1024)

class StudentProfileSerializer(serializers.ModelSerializer):
    department_id = serializers.IntegerField(read_only=True)
    class Meta:
        model = StudentProfile
        fields = ("enrolment_number", "programme", "semester", "department_id")

class SafeUserSerializer(serializers.ModelSerializer):
    student_profile = serializers.SerializerMethodField()
    roles = serializers.SerializerMethodField()
    permissions = serializers.SerializerMethodField()
    class Meta:
        model = User
        fields = ("id", "full_name", "email", "account_status", "student_profile", "roles", "permissions")
    def get_student_profile(self, obj):
        from .models import StudentProfile
        from .serializers import StudentProfileSerializer
        profile = StudentProfile.objects.filter(user_id=obj.pk).select_related("department").first()
        if not profile:
            return None
        # A malformed profile/membership relationship fails closed.
        from .models import DepartmentMembership
        if not DepartmentMembership.objects.filter(user_id=obj.pk, department_id=profile.department_id, status="ACTIVE").exists():
            return None
        return StudentProfileSerializer(profile).data
    def get_roles(self, obj):
        from .models import RoleAssignment, DepartmentMembership
        assignments = RoleAssignment.objects.filter(user_id=obj.pk).select_related("role")
        result = []
        for a in assignments:
            if a.department_id is not None and not DepartmentMembership.objects.filter(user_id=obj.pk, department_id=a.department_id, status="ACTIVE").exists():
                continue
            if a.department_id is None and a.role.code != "SYSTEM_ADMIN":
                continue
            result.append({"code": a.role.code, "department_id": a.department_id})
        return result
    def get_permissions(self, obj):
        from .services import get_effective_permissions
        return sorted(get_effective_permissions(obj))
