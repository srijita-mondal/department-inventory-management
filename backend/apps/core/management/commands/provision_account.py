from django.contrib.auth.password_validation import validate_password
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from getpass import getpass
from apps.core.models import User

class Command(BaseCommand):
    help = "Provision one existing, institution-verified registry account. Never changes memberships or role assignments."

    def add_arguments(self, parser):
        parser.add_argument("--email", required=True, help="Exact email of the verified registry account")
        parser.add_argument("--verified-by", required=True, help="Operator identity and reference to the completed institutional verification")

    @transaction.atomic
    def handle(self, *args, **options):
        email = options["email"].strip().lower()
        verification = options["verified_by"].strip()
        if len(verification) < 8:
            raise CommandError("--verified-by must identify the operator and institutional verification reference.")
        matches = list(User.objects.select_for_update().filter(email__iexact=email)[:2])
        if len(matches) != 1:
            raise CommandError("Expected exactly one existing account; no account was changed.")
        user = matches[0]
        if user.account_status not in {"PENDING_ACTIVATION", "ACTIVE"}:
            raise CommandError("Suspended or disabled accounts cannot be provisioned by this command.")
        if user.auth_provider != "LOCAL":
            raise CommandError("OIDC account cannot be provisioned for local password authentication.")
        first = getpass("Initial password (input hidden): ")
        second = getpass("Confirm initial password: ")
        if first != second:
            raise CommandError("Passwords did not match.")
        validate_password(first, user=user)
        user.set_password(first)
        user.account_status = "ACTIVE"
        user.save(update_fields=["password", "account_status"])
        # Intentionally does not set email_verified_at, membership or role assignments.
        self.stdout.write(self.style.SUCCESS(f"Provisioned account id={user.pk}; verification reference recorded in operator procedure: {verification}"))
