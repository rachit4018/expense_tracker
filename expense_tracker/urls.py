from django.urls import path
from . import views
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [

    path('home/', views.home_view, name='home'),
    path('signup/', views.signup_view, name='signup'),
    path('', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),

    
    path('api/groups/', views.UserGroupsAPIView.as_view(), name='user_groups_api'),
    path('groups/api/<int:group_id>/', views.GroupDetailsAPIView.as_view(), name='group_details'),
    path('home/groups/<int:group_id>/', views.group_details_template, name='group_details_template'),
    path('group/<int:group_id>/add_member/', views.AddMemberAPIView.as_view(), name='add_member'),
    path('resend_code/', views.resend_code, name='resend_code'),

    path('verify_code/', views.verify_code, name='verify_code'),
    path('expense/add/', views.add_expense_view, name='add_expense'),
    path('expense/add/add_expense_api', views.add_expense, name='add_expense_api'),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

]
