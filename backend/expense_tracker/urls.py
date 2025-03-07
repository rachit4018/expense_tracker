from django.urls import path
from . import views
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [

    path('home/', views.home_view, name='home'),
    path('signup/', views.signup_view, name='signup'),
    path('', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('login/', views.login_view, name='login'),

    
    path('api/groups/', views.UserGroupsAPIView.as_view(), name='user_groups_api'),
    path('groups/api/<int:group_id>/', views.GroupDetailsAPIView.as_view(), name='group_details'),
    path('home/groups/<int:group_id>/', views.group_details_template, name='group_details_template'),
    path('group/<int:group_id>/add_member/', views.AddMemberAPIView.as_view(), name='add_member'),
    path('resend_code/', views.resend_code, name='resend_code'),
    path('api/groups/create/', views.CreateGroupAPI.as_view(), name='create_group'),
    path('verify_code/', views.verify_code, name='verify_code'),
    path('expense/add/<int:group_id>', views.AddExpenseView.as_view(), name='add_expense'),
    path('expense/add_expense_api/<int:group_id>', views.AddExpenseAPIView.as_view(), name='add_expense_api'),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('settlements/<str:username>/', views.SettlementsView.as_view(), name='settlements_view'),  # HTML rendering
    # path('settlements/api/<str:username>/', views.SettlementsAPIView.as_view(), name='settlements_api'),  # JSON API
    path('settlements/api/<int:settlementId>/', views.UpdatePaymentStatusAPIView.as_view(), name='settlement_view'),
    path("csrf/", views.csrf_token_view, name="csrf_token"),

]
