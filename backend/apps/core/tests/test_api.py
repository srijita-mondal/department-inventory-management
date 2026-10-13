from django.test import TestCase
from rest_framework.test import APIClient

class PublicApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_health_is_minimal(self):
        response = self.client.get("/api/health/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"status": "ok"})

    def test_csrf_endpoint_sets_cookie_and_returns_token(self):
        response = self.client.get("/api/auth/csrf/")
        self.assertEqual(response.status_code, 200)
        self.assertIn("csrfToken", response.json())
        self.assertIn("csrftoken", response.cookies)

    def test_identity_endpoint_requires_authentication(self):
        response = self.client.get("/api/auth/me/")
        self.assertEqual(response.status_code, 403)  # DRF session auth with UNAUTHENTICATED_USER=None

    def test_login_rejects_malformed_payload(self):
        response = self.client.post("/api/auth/login/", {}, format="json")
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()["detail"], "Invalid email or password.")
