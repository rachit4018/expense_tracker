import random
from django.core.mail import send_mail
from django.conf import settings
from datetime import datetime, timedelta
from django.http import JsonResponse
from rest_framework.permissions import IsAuthenticated
import jwt

def get_user_from_jwt(request):
    token = request.headers.get('Authorization')
    if token and token.startswith('Bearer '):
        token = token[7:]  # Remove the 'Bearer 
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
            print("Decoded JWT Payload:", payload)  # Debugging line
            return payload
        except jwt.ExpiredSignatureError:
            print("Token expired.")
            return None
        except jwt.InvalidTokenError:
            print("Invalid token.")
            return None
    return None

def generate_verification_code(existing_codes):
    """Generate a unique 6-digit verification code."""
    code = None
    while not code or code in existing_codes:
        code = str(random.randint(100000, 999999))
    return code

def send_verification_email(user, verification_code):
    """Send the verification code to the user's email."""
    subject = "Account Verification Code"
    message = f"Your verification code is: {verification_code}. This Code is valid for only 10 minutes."
    send_mail(
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        [user.email],
    )

def is_code_expired(verification_code_created_at, timeout_minutes=10):
    """Check if the verification code is expired."""
    expiration_time = verification_code_created_at + timedelta(minutes=timeout_minutes)
    return datetime.now() > expiration_time
