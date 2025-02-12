from django.shortcuts import render
from django.http import HttpResponse,HttpResponseRedirect
from django.views.generic import ListView, CreateView, UpdateView, DeleteView
from .models import Category, Expense, Group, Settlement
from django.urls import reverse_lazy
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import login, logout
from django.contrib.auth.decorators import login_required
from .forms import CustomUserCreationForm, CustomAuthenticationForm
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .models import Group,CustomUser
from django.utils.decorators import method_decorator
import json
from .forms import GroupForm
from .utils import generate_verification_code, send_verification_email, is_code_expired, get_user_from_jwt
from django.utils.timezone import now
import jwt
from datetime import datetime, timedelta
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from .serializers import ExpenseSerializer, GroupSerializer,SettlementSerializer
from django.contrib import messages
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django.conf import settings
from django.db import transaction
from dateutil.relativedelta import relativedelta
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_protect
from django.views.decorators.http import require_POST
from rest_framework import generics

def signup_view(request):
    if request.method == 'POST':
        form = CustomUserCreationForm(request.POST)
        if form.is_valid():
            user = form.save()

            # Generate the verification code (ensure uniqueness)
            existing_codes = CustomUser.objects.values_list('verification_code', flat=True)
            verification_code = generate_verification_code(existing_codes)

            # Save the verification code and timestamp to the user
            user.verification_code = verification_code
            user.verification_code_created_at = now()
            user.save()

            # Send the verification code to the user's email
            send_verification_email(user, verification_code)

            # Log in the user (optional)
            #login(request, user)

            # Inform the user that they need to verify their email
            messages.success(request, 'Sign up successful! Please check your email for the verification code.')

            # Redirect to a page that asks the user to enter the verification code
            return redirect('verify_code') 
        else:
            # If form is not valid, add error messages
            messages.error(request, 'There was an error with your sign up. Please try again.')
    else:
        form = CustomUserCreationForm()

    return render(request, 'signup.html', {'form': form})

def login_view(request):
    if request.method == 'POST':
        form = CustomAuthenticationForm(data=request.POST)
        if form.is_valid():
            user = form.get_user()
            if user.is_verified:
                # Generate a JWT token
                payload = {
                    'user_id': user.id,
                    'username': user.username,
                    'exp': datetime.now() + timedelta(hours=1),  # Token expires in 1 hour
                }
                token = jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')

                # Return the token in the response as JSON
                response = JsonResponse({'token': token})
                
                # You can also set a cookie with the token if you prefer (optional)
                # response.set_cookie('jwt_token', token, secure=False, httponly=True)  # Set cookie securely if in production
                
                login(request, user)
                messages.success(request, 'Login successful.')
                
                return response  # Return token in response for frontend to store in localStorage or handle accordingly.
            else:
                #messages.error(request, 'Account is not verified. Please verify your email.')
                return render(request, 'verify_code.html',)
        else:
            messages.error(request, 'Invalid username or password.')
            return render(request, 'verify_code.html',)
    else:
        form = CustomAuthenticationForm()
    return render(request, 'login.html', {'form': form})


@login_required
def add_expense_view(request, group_id):
    """
    Renders the add expense page for a specific group.
    """
    group = get_object_or_404(Group, group_id=group_id, members=request.user)  # Ensure user is part of the group
    categories = Category.objects.all()
    return render(request, "add_expense.html", {"group": group, "categories": categories, "username": request.user.username})



class AddExpenseAPIView(APIView):
    """
    API View to handle adding an expense to a specific group.
    """
    permission_classes = [IsAuthenticated]
    def expense_splitter(self,amount, split_type, group_id):
        try:
        # Fetch the group
            group = Group.objects.prefetch_related('members').get(group_id=group_id)
            members = group.members.all()
            member_count = len(members)

            if member_count == 0:
                raise ValidationError("Group has no members to split the expense.")

            if split_type == 'equal':
                split_amount = amount / member_count
                due_date = datetime.now() + relativedelta(months=1)

                with transaction.atomic():  # Ensures all settlements are created or none
                    for member in members:
                        Settlement.objects.create(
                        amount=split_amount,
                        payment_status="Pending",
                        due_date=due_date,
                        user=member,
                        group=group
                    )
                print(f"Successfully split amount {amount} equally among {member_count} members.")
                return True

            else:
                raise ValidationError("Unsupported split type. Only 'equal' is supported.")

        except ObjectDoesNotExist:
            print(f"Error: Group with ID {group_id} does not exist.")
            return False
        except ValidationError as ve:
            print(f"Validation Error: {ve}")
            return False
        except Exception as e:
            print(f"Unexpected Error: {e}")
            return False

    def post(self, request, group_id):
        user = request.user
        print("Request Data:", request.data)

        # Ensure the user is a member of the group
        group = get_object_or_404(Group, group_id=group_id, members=user)
        print("Group Found:", group)

        # Validate and deserialize request data
        serializer = ExpenseSerializer(data=request.data)
        print("Serializer Initialized:", serializer)

        if serializer.is_valid():
            print("Serializer Validated Data:", serializer.validated_data)
            amount = serializer.validated_data['amount']
            split_type = serializer.validated_data['split_type']
            # Save the expense with additional fields
            serializer.save(created_by=user, group_id=group)
            print("Added Expense Successfully")

            print("Added Expense Successfully")

            # Call the expense_splitter function
            success = self.expense_splitter(amount, split_type, group_id)

            if success:
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            else:
                return Response(
                    {"error": "Failed to split the expense. Check the logs for details."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
        # Return errors if serializer is invalid
        print("Serializer Errors:", serializer.errors)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


def logout_view(request):
    if request.method == 'POST':
        logout(request)
        return redirect('login')
    



class UserGroupsAPIView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        
           # Get user_id from query params
        username = request.headers.get('X-Username')
        if not username:
            return Response({'error': 'Authentication required to fetch groups.'}, status=status.HTTP_401_UNAUTHORIZED)

        # Fetch groups where the user is a member
        groups = Group.objects.filter(members__username=username)

        if not groups.exists():
            return Response({'message': 'You are not a member of any group.', 'groups': []}, status=status.HTTP_200_OK)

        # Serialize and return the list of groups
        serializer = GroupSerializer(groups, many=True)
        return Response({'groups': serializer.data}, status=status.HTTP_200_OK)


    

@csrf_exempt  # Allow POST requests without CSRF token for API (use cautiously in production)
def home_view(request):
    if request.method == 'POST':
        # Handle group creation
        group_name = request.POST.get('group_name')
        creted_by = request.user
        if group_name:
            new_group = Group.objects.create(name=group_name,created_by=creted_by)
            new_group.members.add(request.user)
            return redirect('home')  # Redirect to the home page after creating the group

    # Render the home page (groups are fetched via the API separately)
    return render(request, 'home.html', {'user': request.user})



class GroupDetailsAPIView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request, group_id):
        username = request.headers.get('X-Username')  # Get the username from the header
        # Check if username matches the authenticated user
        if username != request.user.username:
            return Response({'error': 'Invalid username for the authenticated user.'}, status=status.HTTP_403_FORBIDDEN)

        # Fetch the group by ID
        group = get_object_or_404(Group, group_id=group_id)
        # Ensure the user is a member of the group
        if not group.members.filter(username=username).exists():
            return JsonResponse({'error': 'You are not a member of this group'}, status=403)

        # Serialize group details
        group_serializer = GroupSerializer(group)
        group_data = group_serializer.data
        group_data['members'] = [{'username': member.username} for member in group.members.all()]
        # Fetch and serialize expenses
        expenses = Expense.objects.filter(group_id=group_id)
        expense_serializer = ExpenseSerializer(expenses, many=True)
        # Get users from the same college as the current user
        current_user_college = request.user.college
        available_members = CustomUser.objects.filter(college=current_user_college).exclude(id=request.user.id)
        available_members_data = [{'username': member.username} for member in available_members]

        return Response({
            'group': group_data,
            'expenses': expense_serializer.data,
            'available_members': available_members_data,
        }, status=status.HTTP_200_OK)

        return JsonResponse({'error': 'Method not allowed'}, status=405)

@login_required
def group_details_template(request, group_id):
    return render(request, 'group_details.html', {'group_id': group_id})

class AddMemberAPIView(APIView):
    """
    API endpoint to add a member to a group.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, group_id):
        # Debug the incoming request
        print(f"Request data: {request.data}")
        
        # Fetch the group by ID
        group = get_object_or_404(Group, group_id=group_id)

        # Ensure the user is the creator of the group
        if group.created_by != request.user:
            return Response({'error': 'Only the group creator can add members'}, status=status.HTTP_403_FORBIDDEN)

        # Get the username from the request data
        username = request.data.get('username')
        if not username:
            return Response({'error': 'Username is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Find the user by username
            user_to_add = CustomUser.objects.get(username=username)

            # Ensure the user is not already a member
            if user_to_add in group.members.all():
                return Response({'error': 'User is already a member of the group'}, status=status.HTTP_400_BAD_REQUEST)

            # Add the user to the group
            group.members.add(user_to_add)
            return Response({'message': 'Member added successfully'}, status=status.HTTP_200_OK)

        except CustomUser.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
def verify_code(request):
    if request.method == 'POST':
        email = request.POST['email']
        code = request.POST['code']

        # Get the user by email
        user = CustomUser.objects.filter(email=email).first()
        print(user)
        if user:
            # Check if the verification code is correct and the code is not expired
            if user.verification_code == code:
                # Check if the verification code has expired (let's say it expires in 1 hour)
                expiration_time = user.verification_code_created_at + timedelta(hours=1)
                if now() > expiration_time:
                    messages.error(request, 'Verification code has expired. Please request a new code.')
                    user.delete()
                    return redirect('signup')  # Redirect to signup to generate a new code

                # If the code is valid and not expired, verify the user
                user.is_verified = True
                user.verification_code = None  # Clear the code
                user.verification_code_created_at = None  # Clear the timestamp
                user.save()

                messages.success(request, 'Verification successful. You are now verified.')
                return redirect('home')  # Redirect to the home page or dashboard
            else:
                messages.error(request, 'Invalid verification code. Please try again.')
        else:
            messages.error(request, 'User with this email does not exist.')

    return render(request, 'verify_code.html')

def resend_code(request):
    if request.method == 'POST':
        # Get the email entered by the user
        email = request.POST.get('email')

        # Look for the user in the database by email
        user = CustomUser.objects.filter(email=email).first()

        if user:
            # Check if the user has a verification code already
            # Generate a new verification code
            existing_codes = CustomUser.objects.values_list('verification_code', flat=True)
            verification_code = generate_verification_code(existing_codes)

            # Save the new verification code and timestamp to the user
            user.verification_code = verification_code
            user.verification_code_created_at = now()  # Save the current timestamp

            # Send the verification code to the user's email
            send_verification_email(user, verification_code)

            # Provide feedback to the user
            messages.success(request, 'A new verification code has been sent to your email.')
            return redirect('verify_code')  # Redirect back to the verification page
        else:
            messages.error(request, 'No user found with this email.')

    return render(request, 'resend_code.html')

# class SettlementAPIView(APIView):
    """
    API endpoint to settle expenses between members.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request,username):
        try:
            user = username
            # Filter settlements for the logged-in user
            settlements = Settlement.objects.filter(user__username=username)

            if not settlements.exists():
                return Response({"message": "No settlements found for the user."}, status=200)

            # Serialize the settlement data
            
            serializer = SettlementSerializer(settlements, many=True)
            print("serializer data:",serializer.data)
            group_values = [item['group'] for item in serializer.data]

            groups = Group.objects.filter(group_id__in=group_values)  # Fetch groups with the IDs
            group_name_map = {group.group_id: group.name for group in groups}  # Map group_id to name
        
            # Add group name to the serializer data
            updated_data = []
            for item in serializer.data:
                group_id = item['group']
                group_name = group_name_map.get(group_id, 'Unknown')  # Get group name or default to 'Unknown'
                item['group_name'] = group_name  # Add group_name to each item
                updated_data.append(item)

            return render(request, 'settlement.html', {'settlements': serializer.data, 'username': username})

        except Exception as e:
            return  messages.error(request, e)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_payment_status(request, settlement_id):
    settlement = get_object_or_404(Settlement, id=settlement_id, user=request.user)
    data = request.data.get('payment_status')

    if data not in [Settlement.PAYMENT_STATUS_PENDING, Settlement.PAYMENT_STATUS_COMPLETED]:
        return Response({'error': 'Invalid payment status'}, status=status.HTTP_400_BAD_REQUEST)

    settlement.payment_status = data
    settlement.save()
    return Response({'message': 'Payment status updated successfully', 'payment_status': settlement.payment_status}, status=status.HTTP_200_OK)

@login_required
def settlements_view(request, username):
    settlements = Settlement.objects.filter(user=request.user)
    serializer = SettlementSerializer(settlements, many=True)
    group_values = [item['group'] for item in serializer.data]

    groups = Group.objects.filter(group_id__in=group_values)  # Fetch groups with the IDs
    group_name_map = {group.group_id: group.name for group in groups}  # Map group_id to name
        
            # Add group name to the serializer data
    updated_data = []
    for item in serializer.data:
        group_id = item['group']
        group_name = group_name_map.get(group_id, 'Unknown')  # Get group name or default to 'Unknown'
        item['group_name'] = group_name  # Add group_name to each item
        updated_data.append(item)

    return render(request, 'settlement.html', {'settlements': serializer.data})

class SettlementsAPIView(APIView):
    """
    API View to fetch settlements for an authenticated user.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request,username):
        username = request.headers.get('X-Username')

        if not username:
            return Response({'error': 'Username is required'}, status=status.HTTP_400_BAD_REQUEST)

        # Fetch settlements for the user
        settlements = Settlement.objects.filter(user__username=username)
        serializer = SettlementSerializer(settlements, many=True)
        group_values = [item['group'] for item in serializer.data]

        groups = Group.objects.filter(group_id__in=group_values)  # Fetch groups with the IDs
        group_name_map = {group.group_id: group.name for group in groups}  # Map group_id to name
        
            # Add group name to the serializer data
        updated_data = []
        for item in serializer.data:
            group_id = item['group']
            group_name = group_name_map.get(group_id, 'Unknown')  # Get group name or default to 'Unknown'
            item['group_name'] = group_name  # Add group_name to each item
            updated_data.append(item)


        return Response({'settlements': serializer.data}, status=status.HTTP_200_OK)

  # Exempt entire view from CSRF

class UpdatePaymentStatusAPIView(APIView):
    """
    API View to update the payment status of a settlement.
    """
    permission_classes = [IsAuthenticated]  # Ensures user is authenticated

    def post(self, request, settlementId):
        try:
            # Fetch the settlement belonging to the authenticated user
            settlement = get_object_or_404(Settlement, id=settlementId, user=request.user)
            data = request.data  # Django REST Framework automatically parses JSON
            
            # Validate the payment status
            if data.get('payment_status') not in ['Pending', 'Completed']:
                return Response({'error': "Invalid Payment Status"}, status=status.HTTP_400_BAD_REQUEST)

            # Update and save
            settlement.payment_status = data['payment_status']
            settlement.save()

            return Response({'message': "Payment status updated successfully!"}, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    