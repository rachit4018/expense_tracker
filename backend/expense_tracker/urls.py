from django.urls import path, include
from . import views
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from expense_tracker.api import urls_v1 as api_v1_urls
urlpatterns = [

   # HTML / UI routes
    path('home/', views.home_view, name='home'),
    path('signup/', views.signup_view, name='signup'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),

    # Resend and Verify Code
    path('resend_code/', views.ResendCodeAPIView.as_view(), name='resend_code'),
    path('verify_code/', views.verify_code, name='verify_code'),
    # Password / CSRF
    path('csrf/', views.csrf_token_view, name='csrf_token'),
    path('reset_password/', views.ResetPasswordView.as_view(), name='reset_password'),
    path('reset_password/<str:token>/', views.ResetPasswordConfirmView.as_view(), name='reset_password_confirm'),

    # Versioned APIs
    path('api/v1/', include('expense_tracker.api.urls_v1')),

]


    
    