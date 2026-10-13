from django.contrib.auth.backends import ModelBackend
from .models import User

class EmailPasswordBackend(ModelBackend):
    """Local password backend. OIDC and non-active accounts fail closed."""
    def authenticate(self, request, username=None, password=None, email=None, **kwargs):
        identifier = (email or username or kwargs.get("email") or "").strip().lower()
        if not identifier or not password:
            return None
        try:
            user = User.objects.get(email__iexact=identifier)
        except (User.DoesNotExist, User.MultipleObjectsReturned):
            # Perform a hash check to reduce obvious timing differences for unknown emails.
            from django.contrib.auth.hashers import check_password
            check_password(password, "pbkdf2_sha256$600000$invalidsalt$invalidhash")
            return None
        if user.auth_provider != "LOCAL" or user.account_status != "ACTIVE":
            return None
        if user.check_password(password) and self.user_can_authenticate(user):
            return user
        return None

    def user_can_authenticate(self, user):
        return bool(user and user.account_status == "ACTIVE")
