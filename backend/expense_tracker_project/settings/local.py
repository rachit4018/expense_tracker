from .base import *

DEBUG = True
SECRET_KEY = 'django-insecure-dev-only-key'
ALLOWED_HOSTS = ['*']

# Database (Local, can read from .env)
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': config('DB_NAME', default='expense_tracker_db'),
        'USER': config('DB_USER', default='postgres'),
        'PASSWORD': config('DB_PASSWORD', default='postgres'),
        'HOST': config('DB_HOST', default='db'),  # 'db' for Docker container
        'PORT': config('DB_PORT', default='5432'),
    }
}

# CORS (local frontend)
CORS_ALLOWED_ORIGINS = [
    'http://localhost:3000',
    'http://localhost:8000',
]

CSRF_TRUSTED_ORIGINS = ['http://localhost:3000']
