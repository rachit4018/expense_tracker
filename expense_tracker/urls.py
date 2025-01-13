from django.urls import path
from . import views

urlpatterns = [

    path('', views.home_view, name='home'),
    path('signup/', views.signup_view, name='signup'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),

    path('api/groups/', views.user_groups_api, name='user-groups-api'),

    path('categories/', views.CategoryListView.as_view(), name='category_list'),
    path('category/create/', views.CategoryCreateView.as_view(), name='category_create'),
    path('category/<int:pk>/edit/', views.CategoryUpdateView.as_view(), name='category_edit'),
    path('category/<int:pk>/delete/', views.CategoryDeleteView.as_view(), name='category_delete'),

    path('expenses/', views.ExpenseListView.as_view(), name='expense_list'),
    path('expense/create/', views.ExpenseCreateView.as_view(), name='expense_create'),
    path('expense/<int:pk>/edit/', views.ExpenseUpdateView.as_view(), name='expense_edit'),
    path('expense/<int:pk>/delete/', views.ExpenseDeleteView.as_view(), name='expense_delete'),

    path('groups/', views.GroupListView.as_view(), name='group_list'),
    path('group/create/', views.GroupCreateView.as_view(), name='group_create'),
    path('group/<int:pk>/edit/', views.GroupUpdateView.as_view(), name='group_edit'),
    path('group/<int:pk>/delete/', views.GroupDeleteView.as_view(), name='group_delete'),

    path('settlements/', views.SettlementListView.as_view(), name='settlement_list'),
    path('settlement/create/', views.SettlementCreateView.as_view(), name='settlement_create'),
    path('settlement/<int:pk>/edit/', views.SettlementUpdateView.as_view(), name='settlement_edit'),
    path('settlement/<int:pk>/delete/', views.SettlementDeleteView.as_view(), name='settlement_delete'),
]
