import logging
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_protect
from django.contrib.auth import authenticate, login, logout
from django.middleware.csrf import get_token
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from rest_framework.views import APIView
from .serializers import LoginSerializer, SafeUserSerializer

security_logger = logging.getLogger("security")

class HealthView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    def get(self, request):
        return Response({"status": "ok"})

class CsrfView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    @ensure_csrf_cookie
    def get(self, request):
        return Response({"csrfToken": get_token(request)})

class LoginThrottle(AnonRateThrottle):
    scope = "login"

@method_decorator(csrf_protect, name="dispatch")
class LoginView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    throttle_classes = [LoginThrottle]
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({"detail": "Invalid email or password."}, status=status.HTTP_400_BAD_REQUEST)
        email = serializer.validated_data["email"].strip().lower()
        user = authenticate(request, username=email, password=serializer.validated_data["password"])
        if user is None:
            security_logger.warning("login_failed")
            return Response({"detail": "Invalid email or password."}, status=status.HTTP_401_UNAUTHORIZED)
        login(request, user, backend="apps.core.backends.EmailPasswordBackend")
        security_logger.info("login_succeeded user_id=%s", user.pk)
        return Response(SafeUserSerializer(user).data)

class LogoutView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        actor_id = request.user.pk
        logout(request)
        security_logger.info("logout_succeeded user_id=%s", actor_id)
        return Response({"detail": "Logged out."}, status=status.HTTP_200_OK)

class MeView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        # Re-read account state on every request; stale sessions do not preserve access.
        from .models import User
        user = User.objects.filter(pk=request.user.pk, account_status="ACTIVE").first()
        if user is None:
            logout(request)
            return Response({"detail": "Authentication required."}, status=status.HTTP_401_UNAUTHORIZED)
        return Response(SafeUserSerializer(user).data)

class AccessView(MeView):
    def get(self, request):
        response = super().get(request)
        if response.status_code != 200:
            return response
        payload = response.data
        return Response({
            "roles": payload["roles"],
            "permissions": payload["permissions"],
            "departments": sorted({r["department_id"] for r in payload["roles"] if r["department_id"] is not None}),
            "has_global_admin_scope": any(r["code"] == "SYSTEM_ADMIN" and r["department_id"] is None for r in payload["roles"]),
        })
