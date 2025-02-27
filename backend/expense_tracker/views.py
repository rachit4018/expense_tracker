from django.shortcuts import render
from django.http import HttpResponse,HttpResponseRedirect
from django.views.generic import ListView, CreateView, UpdateView, DeleteView
from .models import Category, Expense, Group, Settlement
from rest_framework.permissions import AllowAny
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
from django.middleware.csrf import get_token
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

@api_view(['POST'])
def signup_view(request):
    if request.method == 'POST':
        # Use request.data for JSON input
        form = CustomUserCreationForm(request.data)
        if form.is_valid():
            try:
                # Save the user
                user = form.save(commit=False)  # Don't save yet to add additional fields

                # Generate the verification code (ensure uniqueness)
                existing_codes = CustomUser.objects.values_list('verification_code', flat=True)
                verification_code = generate_verification_code(existing_codes)

                # Save the verification code and timestamp to the user
                user.verification_code = verification_code
                user.verification_code_created_at = now()
                user.is_verified = False  # Mark the user as unverified
                user.save()

                # Send the verification code to the user's email
                send_verification_email(user, verification_code)

                # Return success response
                return Response(
                    {'message': 'Sign up successful! Please check your email for the verification code.'},
                    status=status.HTTP_201_CREATED
                )
            except Exception as e:
                # Handle any unexpected errors during signup
                return Response(
                    {'error': f'An error occurred during signup: {str(e)}'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        else:
            # If form is not valid, return form errors
            errors = form.errors.as_json()
            return Response(
                {'error': 'There was an error with your signup.', 'details': errors},
                status=status.HTTP_400_BAD_REQUEST
            )
    else:
        # Handle non-POST requests (optional)
        return Response(
            {'error': 'Only POST requests are allowed.'},
            status=status.HTTP_405_METHOD_NOT_ALLOWED
        )
@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    if request.method == 'POST':
        print("Request data:", request.data)  # Debugging: Print request data

        # Use request.data for JSON input
        form = CustomAuthenticationForm(data=request.data)
        print("Form errors:", form.errors)  # Debugging: Print form errors

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

                # Log the user in
                login(request, user)

                # Prepare user data to return
                user_data = {
                    'username': user.username,
                    'college': user.college,
                    'semester': user.semester,
                    'default_payment_methods': user.default_payment_methods,
                    'token': token,  # Include the token in the response
                }

                return Response(user_data, status=status.HTTP_200_OK)
            else:
                # Account is not verified
                return Response(
                    {'error': 'Account is not verified. Please verify your email.'},
                    status=status.HTTP_401_UNAUTHORIZED
                )
        else:
            # Invalid username or password
            return Response(
                {'error': 'Invalid username or password.'},
                status=status.HTTP_401_UNAUTHORIZED
            )
    else:
        # Handle non-POST requests (optional)
        return Response(
            {'error': 'Only POST requests are allowed.'},
            status=status.HTTP_405_METHOD_NOT_ALLOWED
        )


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
    print("api called")
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Get username from headers
        username = request.headers.get('X-Username')
        print(username)
        if not username:
            return Response(
                {'error': 'Authentication required to fetch groups.'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        # Fetch groups where the user is a member
        groups = Group.objects.filter(members__username=username)

        if not groups.exists():
            return Response(
                {'message': 'You are not a member of any group.', 'groups': []},
                status=status.HTTP_200_OK
            )

        # Serialize and return the list of groups
        serializer = GroupSerializer(groups, many=True)
        return Response(
            {'groups': serializer.data},
            status=status.HTTP_200_OK
        )


    

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
        # Get the username from the header
        username = request.headers.get('X-Username')
        print(username)
        print(request.user.username)
        # Check if username matches the authenticated user
        if username != request.user.username:
            
            return Response({'error': 'Invalid username for the authenticated user.'}, status=status.HTTP_403_FORBIDDEN)

        # Fetch the group by ID
        group = get_object_or_404(Group, group_id=group_id)

        # Ensure the user is a member of the group
        if not group.members.filter(username=username).exists():
            return Response({'error': 'You are not a member of this group'}, status=status.HTTP_403_FORBIDDEN)

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

        # Return the response
        return Response({
            'group': group_data,
            'expenses': expense_serializer.data,
            'available_members': available_members_data,
        }, status=status.HTTP_200_OK)


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

@api_view(['POST'])
def verify_code(request):
    if request.method == 'POST':
        # Use request.data for JSON input
        email = request.data.get('email')
        code = request.data.get('code')

        if not email or not code:
            return Response(
                {'error': 'Email and verification code are required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get the user by email
        user = CustomUser.objects.filter(email=email).first()

        if user:
            # Check if the verification code is correct
            if user.verification_code == code:
                # Check if the verification code has expired (e.g., expires in 1 hour)
                expiration_time = user.verification_code_created_at + timedelta(hours=1)
                if now() > expiration_time:
                    user.delete()  # Delete the user if the code has expired
                    return Response(
                        {'error': 'Verification code has expired. Please sign up again.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                # If the code is valid and not expired, verify the user
                user.is_verified = True
                user.verification_code = None  # Clear the code
                user.verification_code_created_at = None  # Clear the timestamp
                user.save()

                return Response(
                    {'message': 'Verification successful. You are now verified.'},
                    status=status.HTTP_200_OK
                )
            else:
                return Response(
                    {'error': 'Invalid verification code. Please try again.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            return Response(
                {'error': 'User with this email does not exist.'},
                status=status.HTTP_404_NOT_FOUND
            )
    else:
        return Response(
            {'error': 'Only POST requests are allowed.'},
            status=status.HTTP_405_METHOD_NOT_ALLOWED
        )

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

    def patch(self, request, settlementId):
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

def csrf_token_view(request):
    return JsonResponse({"csrfToken": get_token(request)})