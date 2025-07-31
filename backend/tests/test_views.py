from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from expense_tracker.models import CustomUser

class SignupViewTests(TestCase):
    def setUp(self):
        # Use APIClient with CSRF checks disabled
        self.client = APIClient(enforce_csrf_checks=False)
        self.signup_url = reverse('signup')  # Use the correct URL pattern name
        self.valid_data = {
            'username': 'testuser',
            'email': 'testuser@example.com',
            'password1': 'testpassword123',
            'password2': 'testpassword123',
            'semester': 4,  # Add the semester field
        }

    # def test_signup_with_valid_data(self):
    #     """
    #     Test that a user can sign up with valid data.
    #     """
    #     response = self.client.post(self.signup_url, self.valid_data, format='json')
    #     self.assertEqual(response.status_code, status.HTTP_201_CREATED)
    #     self.assertEqual(response.data['message'], 'Sign up successful! Please check your email for the verification code.')

    #     # Check if the user was created
    #     user = CustomUser.objects.filter(username='testuser').first()
    #     self.assertIsNotNone(user)
    #     self.assertEqual(user.semester, 4)  # Check if semester is set correctly
    #     self.assertFalse(user.is_verified)  # User should not be verified yet

    def test_signup_with_invalid_data(self):
        """
        Test that signup fails with invalid data.
        """
        invalid_data = {
            'username': 'testuser',
            'email': 'invalid-email',  # Invalid email
            'password1': 'testpassword123',
            'password2': 'testpassword123',
            'semester': 4,
        }
        response = self.client.post(self.signup_url, invalid_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        #self.assertIn('error', response.data)

    def test_signup_with_mismatched_passwords(self):
        """
        Test that signup fails if passwords do not match.
        """
        invalid_data = {
            'username': 'testuser',
            'email': 'testuser@example.com',
            'password1': 'testpassword123',
            'password2': 'differentpassword',  # Mismatched passwords
            'semester': 4,
        }
        response = self.client.post(self.signup_url, invalid_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        #self.assertIn('error', response.data)


class LoginViewTests(TestCase):
    def setUp(self):
        # Use APIClient with CSRF checks disabled
        self.client = APIClient(enforce_csrf_checks=False)
        self.login_url = reverse('login')  # Use the correct URL pattern name
        self.user = CustomUser.objects.create_user(
            username='testuser',
            email='testuser@example.com',
            password='testpassword123',
            semester=4,  # Add the semester field
            is_verified=True,  # Mark the user as verified
        )

    def test_login_with_valid_credentials(self):
        """
        Test that a user can log in with valid credentials.
        """
        valid_data = {
            'email': 'testuser@example.com',
            'password': 'testpassword123',
        }
        response = self.client.post(self.login_url, valid_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('token', response.data)  # Check if a token is returned

    def test_login_with_invalid_credentials(self):
        """
        Test that login fails with invalid credentials.
        """
        invalid_data = {
            'email': 'testuser@example.com',  # Correct email
            'password': 'wrongpassword',  # Incorrect password
        }
        response = self.client.post(self.login_url, invalid_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn('error', response.data)

    def test_login_with_unverified_account(self):
        """
        Test that login fails if the account is not verified.
        """
        unverified_user = CustomUser.objects.create_user(
            username='unverifieduser',
            email='unverifieduser@example.com',
            password='testpassword123',
            semester=4,  # Add the semester field
            is_verified=False,  # User is not verified
        )
        valid_data = {
            'email': 'unverifieduser@example.com',
            'password': 'testpassword123',
        }
        response = self.client.post(self.login_url, valid_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn('error', response.data)