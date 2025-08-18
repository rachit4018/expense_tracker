import pytest
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model

User = get_user_model()

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def create_user(db):
    def make_user(**kwargs):
        data = {
            "username": "testuser",
            "email": "test@example.com",
            "password": "TestPass123!",
            "college": "Test College",
            "semester": "Fall",
            "default_payment_methods": "Cash",
            "is_verified": True
        }
        data.update(kwargs)
        user = User.objects.create_user(
            username=data["username"],
            email=data["email"],
            password=data["password"],
            college=data["college"],
            semester=data["semester"],
            default_payment_methods=data["default_payment_methods"],
            is_verified=data["is_verified"]
        )
        return user
    return make_user
