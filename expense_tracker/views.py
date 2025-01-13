from django.shortcuts import render
from django.http import HttpResponse
from django.views.generic import ListView, CreateView, UpdateView, DeleteView
from .models import Category, Expense, Group, Settlement
from django.urls import reverse_lazy
from django.shortcuts import render, redirect
from django.contrib.auth import login, logout
from django.contrib.auth.decorators import login_required
from .forms import CustomUserCreationForm, CustomAuthenticationForm
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .models import Group
from django.utils.decorators import method_decorator
import json
from .forms import GroupForm

def signup_view(request):
    if request.method == 'POST':
        form = CustomUserCreationForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)  # Log in the user after successful sign-up
            return redirect('home')
    else:
        form = CustomUserCreationForm()
    return render(request, 'signup.html', {'form': form})

def login_view(request):
    if request.method == 'POST':
        form = CustomAuthenticationForm(data=request.POST)
        if form.is_valid():
            user = form.get_user()
            login(request, user)  # Log in the user
            return redirect('home')
    else:
        form = CustomAuthenticationForm()
    return render(request, 'login.html', {'form': form})

def logout_view(request):
    if request.method == 'POST':
        logout(request)
        return redirect('home')
    



@login_required
def user_groups_api(request):
    if request.method == 'GET':
        # Read username from custom header
        username = request.headers.get('X-Username')

        if not username:
            return JsonResponse({'error': 'Username is required'}, status=400)

        # Fetch groups for the user
        groups = Group.objects.filter(members__username=username)
        group_data = [{'id': group.group_id, 'name': group.name} for group in groups]
        return JsonResponse({'groups': group_data}, safe=False)

    return JsonResponse({'error': 'Method not allowed'}, status=405)

@csrf_exempt  # Allow POST requests without CSRF token for API (use cautiously in production)
def home_view(request):
    if request.method == 'POST':
        # Handle group creation
        group_name = request.POST.get('group_name')
        if group_name:
            new_group = Group.objects.create(name=group_name)
            new_group.members.add(request.user)
            return redirect('home')  # Redirect to the home page after creating the group

    # Render the home page (groups are fetched via the API separately)
    return render(request, 'home.html', {'user': request.user})


# Views for Category
class CategoryListView(ListView):
    model = Category
    template_name = 'category_list.html'
    context_object_name = 'categories'


class CategoryCreateView(CreateView):
    model = Category
    template_name = 'category_form.html'
    fields = ['name']
    success_url = reverse_lazy('category_list')


class CategoryUpdateView(UpdateView):
    model = Category
    template_name = 'category_form.html'
    fields = ['name']
    success_url = reverse_lazy('category_list')


class CategoryDeleteView(DeleteView):
    model = Category
    template_name = 'category_confirm_delete.html'
    success_url = reverse_lazy('category_list')


# Views for Expense
class ExpenseListView(ListView):
    model = Expense
    template_name = 'expense_list.html'
    context_object_name = 'expenses'


class ExpenseCreateView(CreateView):
    model = Expense
    template_name = 'expense_form.html'
    fields = ['amount', 'category', 'split_type', 'date', 'receipt_image', 'created_by']
    success_url = reverse_lazy('expense_list')


class ExpenseUpdateView(UpdateView):
    model = Expense
    template_name = 'expense_form.html'
    fields = ['amount', 'category', 'split_type', 'date', 'receipt_image', 'created_by']
    success_url = reverse_lazy('expense_list')


class ExpenseDeleteView(DeleteView):
    model = Expense
    template_name = 'expense_confirm_delete.html'
    success_url = reverse_lazy('expense_list')


# Views for Group
class GroupListView(ListView):
    model = Group
    template_name = 'group_list.html'
    context_object_name = 'groups'


class GroupCreateView(CreateView):
    model = Group
    template_name = 'group_form.html'
    fields = ['group_id','name', 'members']
    success_url = reverse_lazy('group_list')


class GroupUpdateView(UpdateView):
    model = Group
    template_name = 'group_form.html'
    fields = ['name', 'members']
    success_url = reverse_lazy('group_list')


class GroupDeleteView(DeleteView):
    model = Group
    template_name = 'group_confirm_delete.html'
    success_url = reverse_lazy('group_list')


# Views for Settlement
class SettlementListView(ListView):
    model = Settlement
    template_name = 'settlement_list.html'
    context_object_name = 'settlements'


class SettlementCreateView(CreateView):
    model = Settlement
    template_name = 'settlement_form.html'
    fields = ['payment_status', 'settlement_method', 'due_date', 'group']
    success_url = reverse_lazy('settlement_list')


class SettlementUpdateView(UpdateView):
    model = Settlement
    template_name = 'settlement_form.html'
    fields = ['payment_status', 'settlement_method', 'due_date', 'group']
    success_url = reverse_lazy('settlement_list')


class SettlementDeleteView(DeleteView):
    model = Settlement
    template_name = 'settlement_confirm_delete.html'
    success_url = reverse_lazy('settlement_list')
