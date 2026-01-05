import pytest
from rest_framework.test import APIClient
from django.urls import reverse

pytestmark = pytest.mark.django_db

#Test #1 for reset password when user is not found
def test_reset_password_user_not_found():
    client = APIClient()
    url = reverse("reset_password")

    response = client.post(url, {"email": "unknown@example.com"}, format="json")

    assert response.status_code == 404
    assert response.data["error"] == "No user found with this email."

#Test #2 for reset password when token creation fails

from expense_tracker.models import CustomUser, PasswordResetToken

def test_reset_password_token_creation_failure(mocker):
    user = CustomUser.objects.create_user(username="example",
        email="rachit@example.com", password="pass123", semester=3,
    )

    # Mock the email function
    mocker.patch("expense_tracker.utils.send_reset_password_email", return_value=True)

    client = APIClient()
    url = reverse("reset_password")

    response = client.post(url, {"email": "rachit@example.com"}, format="json")

    # Assertions
    assert response.status_code == 200
    assert response.data["message"] == "Password reset link has been sent to your email."

    # Ensure token was created
    token_obj = PasswordResetToken.objects.filter(user=user).first()
    assert token_obj is not None
    assert len(token_obj.token) == 50


#Test #3 for reset password token saved correctly
from django.utils import timezone
from datetime import timedelta

def test_reset_password_token_saved(mocker):
    user = CustomUser.objects.create_user(username="example",
        email="rachit@example.com", password="pass123", semester=3,
    )

    mocker.patch("expense_tracker.utils.send_reset_password_email", return_value=True)

    client = APIClient()
    url = reverse("reset_password")

    response = client.post(url, {"email": "rachit@example.com"}, format="json")

    assert response.status_code == 200

    token_obj = PasswordResetToken.objects.get(user=user)

    # Token length check
    assert len(token_obj.token) == 50

    # Expiry should be approx NOW + 10 min
    assert (token_obj.expiry - timezone.now()) <= timedelta(minutes=10, seconds=5)
