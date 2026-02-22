from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
import expense_tracker.views as views

urlpatterns = [
    path('groups/', views.UserGroupsAPIView.as_view()),
    path('groups/create/', views.CreateGroupAPI.as_view()),
    path('groups/<int:group_id>/', views.GroupDetailsAPIView.as_view()),
    path('groups/<int:group_id>/add_member/', views.AddMemberAPIView.as_view()),

    path('expenses/<int:group_id>/add/', views.AddExpenseAPIView.as_view(), name='add_expense'),

    path('categories/', views.CategoryView.as_view(), name='categories'),

    path('settlements/<int:settlementId>/', views.UpdatePaymentStatusAPIView.as_view()),
    path('settlements/<str:username>/', views.SettlementsView.as_view(), name='settlements_view'),  # HTML rendering

    path('token/', TokenObtainPairView.as_view()),
    path('token/refresh/', TokenRefreshView.as_view()),
]
