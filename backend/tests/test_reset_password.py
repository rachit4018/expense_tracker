import pytest
from rest_framework.test import APIClient
from django.urls import reverse
from django.utils import timezone
from datetime import timedelta

from expense_tracker.models import CustomUser, PasswordResetToken
from decouple import config

pytestmark = pytest.mark.django_db


# --------------------------
# Test 1: Reset password when user is not found
# --------------------------
def test_reset_password_user_not_found():
    client = APIClient()
    url = reverse("reset_password")

    response = client.post(url, {"email": "unknown@example.com"}, format="json")

    assert response.status_code == 404
    assert response.data.get("error") == "No user found with this email."


# --------------------------
# Test 2: Reset password token creation and email sending
# --------------------------
def test_reset_password_token_creation_success(mocker):
    # Create a user
    user = CustomUser.objects.create_user(
        username="example",
        email="rachit@example.com",
        password=config("password1"),  # Use .env password
        semester="3",
        college="Test College",
        default_payment_methods="Cash",
        is_verified=True
    )

    # Mock the email sending function
    mocker.patch("expense_tracker.utils.send_reset_password_email", return_value=True)

    client = APIClient()
    url = reverse("reset_password")

    response = client.post(url, {"email": "rachit@example.com"}, format="json")

    # Assertions
    assert response.status_code == 200
    assert "Password reset link" in response.data.get("message", "")

    # Ensure token was created
    token_obj = PasswordResetToken.objects.filter(user=user).first()
    assert token_obj is not None
    assert len(token_obj.token) == 50


# --------------------------
# Test 3: Token saved correctly with expiry
# --------------------------
def test_reset_password_token_saved_correctly(mocker):
    # Create user
    user = CustomUser.objects.create_user(
        username="example2",
        email="rachit2@example.com",
        password=config("password1"),
        semester="3",
        college="Test College",
        default_payment_methods="Cash",
        is_verified=True
    )

    # Mock email sending
    mocker.patch("expense_tracker.utils.send_reset_password_email", return_value=True)

    client = APIClient()
    url = reverse("reset_password")

    response = client.post(url, {"email": "rachit2@example.com"}, format="json")

    assert response.status_code == 200

    token_obj = PasswordResetToken.objects.get(user=user)

    # Token length check
    assert len(token_obj.token) == 50

    # Expiry check: within ~10 min
    assert (token_obj.expiry - timezone.now()) <= timedelta(minutes=10, seconds=5)
