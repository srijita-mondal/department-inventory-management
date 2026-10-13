from django.urls import path
from .views import AccessView, CsrfView, HealthView, LoginView, LogoutView, MeView

urlpatterns = [
    path("health/", HealthView.as_view(), name="health"),
    path("auth/csrf/", CsrfView.as_view(), name="csrf"),
    path("auth/login/", LoginView.as_view(), name="login"),
    path("auth/logout/", LogoutView.as_view(), name="logout"),
    path("auth/me/", MeView.as_view(), name="me"),
    path("auth/access/", AccessView.as_view(), name="access"),
]
