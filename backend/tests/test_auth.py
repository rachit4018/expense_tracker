import pytest
from django.utils.timezone import now, timedelta
from rest_framework.test import APIClient
from django.urls import reverse
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
            "semester": "3",
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
pytestmark = pytest.mark.django_db


signup_url = reverse('signup')
login_url = reverse('login')
verify_code_url = reverse('verify_code')
resend_code_url = reverse('resend_code')
def test_signup_success(api_client):
    payload = {
        "username": "newuser",
        "email": "new@example.com",
        "password1": "NewPass123!",
        "password2": "NewPass123!",
        "college": "Test College",
        "semester": "3",
        "default_payment_methods": "Cash"
    }
    response = api_client.post(signup_url, payload, format="json")
    assert response.status_code == 201
    assert "Sign up successful" in response.data["message"]

def test_signup_existing_email(api_client, create_user):
    create_user(email="dup@example.com")
    payload = {
        "username": "dupuser",
        "email": "dup@example.com",
        "password1": "Pass123!",
        "password2": "Pass123!",
        "college": "Test College",
        "semester": "3",
        "default_payment_methods": "Cash"
    }
    
    response = api_client.post(signup_url, payload, format="json")
    assert response.status_code == 400
    assert "already exists" in response.data["error"]

def test_login_success(api_client, create_user):
    user = create_user(password="TestPass123!")
    payload = {"email": user.email, "password": "TestPass123!"}
    response = api_client.post(login_url, payload, format="json")
    assert response.status_code == 200
    assert "token" in response.data

def test_login_unverified_user(api_client, create_user):
    user = create_user(is_verified=False, password="TestPass123!")
    payload = {"email": user.email, "password": "TestPass123!"}
    response = api_client.post(login_url, payload, format="json")
    assert response.status_code == 401
    assert "not verified" in response.data["error"]

def test_verify_code(api_client, create_user):
    user = create_user(is_verified=False)
    user.verification_code = "123456"
    user.verification_code_created_at = now()
    user.save()

    payload = {"email": user.email, "code": "123456"}
    response = api_client.post(verify_code_url, payload, format="json")
    assert response.status_code == 200
    assert "verified" in response.data["message"].lower()

def test_resend_code(api_client, create_user):
    user = create_user(is_verified=False)
    payload = {"email": user.email}
    response = api_client.post(resend_code_url, payload, format="json")
    assert response.status_code == 200
    assert "verification code" in response.data["message"].lower()
