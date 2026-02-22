from rest_framework.authentication import BaseAuthentication, SessionAuthentication
from rest_framework.exceptions import AuthenticationFailed
from django.conf import settings
import jwt
from .models import CustomUser

class CustomAuthentication(BaseAuthentication):
    def authenticate(self, request):
        # First try JWT authentication
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
            try:
                payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
                user = CustomUser.objects.get(id=payload['user_id'])
                return (user, None)
            except (jwt.DecodeError, CustomUser.DoesNotExist):
                raise AuthenticationFailed('Invalid token')
            except jwt.ExpiredSignatureError:
                raise AuthenticationFailed('Token has expired')

        # Then try session authentication
        session_auth = SessionAuthentication()
        try:
            return session_auth.authenticate(request)
        except Exception:
            return None

    def authenticate_header(self, request):
        return 'Bearer realm="api"'