from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from decouple import config
from expense_tracker.models import CustomUser

class SignupViewTests(TestCase):
    def setUp(self):
        # APIClient with CSRF checks disabled for tests
        self.client = APIClient(enforce_csrf_checks=False)
        self.signup_url = reverse('signup')  # Make sure your URL name matches
        self.valid_data = {
            'username': 'testuser',
            'email': 'testuser@example.com',
            'password1': config('password1'),
            'password2': config('password2'),
            'semester': "4",  # Match CustomUser field type
            'college': 'Test College',
            'default_payment_methods': 'Cash',
        }

    def test_signup_with_valid_data(self):
        response = self.client.post(self.signup_url, self.valid_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('Sign up successful', response.data.get('message', ''))

        # Check if the user was created
        user = CustomUser.objects.filter(username='testuser').first()
        self.assertIsNotNone(user)
        # self.assertEqual(user.semester, "4")
        self.assertFalse(user.is_verified)  # Newly created user should not be verified

    def test_signup_with_invalid_email(self):
        invalid_data = self.valid_data.copy()
        invalid_data['email'] = 'invalid-email'
        response = self.client.post(self.signup_url, invalid_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        # self.assertIn('error', response.data)

    def test_signup_with_mismatched_passwords(self):
        invalid_data = self.valid_data.copy()
        invalid_data['password2'] = 'wrongpassword'
        response = self.client.post(self.signup_url, invalid_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)


class LoginViewTests(TestCase):
    def setUp(self):
        self.client = APIClient(enforce_csrf_checks=False)
        self.login_url = reverse('login')

        # Verified user
        self.user = CustomUser.objects.create_user(
            username='testuser',
            email='testuser@example.com',
            password=config('password1'),
            semester="4",
            college='Test College',
            default_payment_methods='Cash',
            is_verified=True
        )

    def test_login_with_valid_credentials(self):
        payload = {'email': 'testuser@example.com', 'password': config('password1')}
        response = self.client.post(self.login_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('token', response.data)

    def test_login_with_invalid_credentials(self):
        payload = {'email': 'testuser@example.com', 'password': 'wrongpassword'}
        response = self.client.post(self.login_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn('error', response.data)

    def test_login_with_unverified_user(self):
        unverified_user = CustomUser.objects.create_user(
            username='unverifieduser',
            email='unverifieduser@example.com',
            password=config('password1'),
            semester="4",
            college='Test College',
            default_payment_methods='Cash',
            is_verified=False
        )
        payload = {'email': 'unverifieduser@example.com', 'password': config('password1')}
        response = self.client.post(self.login_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn('error', response.data)
