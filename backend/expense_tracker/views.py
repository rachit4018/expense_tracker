from django.shortcuts import render
from django.http import HttpResponse,HttpResponseRedirect
from django.views.generic import ListView, CreateView, UpdateView, DeleteView
from .models import Category, Expense, Group, Settlement
from rest_framework.permissions import AllowAny
from django.urls import reverse_lazy
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import login, logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.hashers import check_password
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
from .serializers import ExpenseSerializer, GroupSerializer,SettlementSerializer,CategorySerializer,SignupSerializer
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
from django.core.exceptions import ValidationError, ObjectDoesNotExist
from django.db import DatabaseError
from .custom_auth import CustomAuthentication
from .middleware import JWTAuthMiddleware, CSRFExemptMiddleware
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
User = CustomUser  # Assuming CustomUser is your user model
class BaseAPIView(APIView):
    """
    Base API View to handle common functionality.
    """
    authentication_classes = [CustomAuthentication]  # Use custom JWT authentication
    permission_classes = [IsAuthenticated]  # Ensure user is authenticated

@api_view(['POST'])
@permission_classes([AllowAny])
def signup_view(request):
    data = request.data

    # Required fields for this frontend
    required_fields = ['username', 'email', 'password1', 'password2', 'college', 'semester', 'default_payment_methods']
    missing_fields = [field for field in required_fields if not data.get(field)]
    if missing_fields:
        return Response(
            {'error': f'Missing fields: {", ".join(missing_fields)}'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Password match validation
    if data['password1'] != data['password2']:
        return Response(
            {'error': 'Passwords do not match.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Check if username or email already exists
    if User.objects.filter(username=data['username']).exists():
        return Response(
            {'error': 'A user with that username already exists.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    if User.objects.filter(email=data['email']).exists():
        return Response(
            {'error': 'A user with that email already exists.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Generate unique verification code
    existing_codes = User.objects.values_list('verification_code', flat=True)
    verification_code = generate_verification_code(existing_codes)
    data['verification_code'] = verification_code

    # Use serializer to create the user
    serializer = SignupSerializer(data=data)
    if serializer.is_valid():
        user = serializer.save()  # Save user to DB

        # Send verification email
        send_verification_email(user, verification_code)

        return Response(
            {'message': 'Sign up successful! Please check your email for the verification code.'},
            status=status.HTTP_201_CREATED
        )

    # Return serializer errors
    return Response(
        {'details': serializer.errors},
        status=status.HTTP_400_BAD_REQUEST
    )
@csrf_exempt  # Allow POST requests without CSRF token for API (use cautiously in production)
@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """
    Login using email and password with detailed error messages.
    """
    data = request.data
    email = data.get('email')
    password = data.get('password')

    # Check if email and password are provided
    if not email:
        return Response({'error': 'Email is required.'}, status=status.HTTP_400_BAD_REQUEST)
    if not password:
        return Response({'error': 'Password is required.'}, status=status.HTTP_400_BAD_REQUEST)

    # Check if user exists
    try:
        user = CustomUser.objects.get(email=email)
    except CustomUser.DoesNotExist:
        return Response({'error': 'No account found with this email.'}, status=status.HTTP_401_UNAUTHORIZED)

    # Check password
    if not check_password(password, user.password):
        return Response({'error': 'Incorrect password.'}, status=status.HTTP_401_UNAUTHORIZED)

    # Check if user is verified
    if not getattr(user, 'is_verified', False):
        return Response({'error': 'Account not verified. Please check your email.'}, status=status.HTTP_401_UNAUTHORIZED)

    # Generate JWT token
    payload = {
        'user_id': user.id,
        'email': user.email,
        'exp': datetime.utcnow() + timedelta(hours=1),
    }
    token = jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')

    # Prepare response
    user_data = {
        'username': user.username,
        'email': user.email,
        'college': getattr(user, 'college', ''),
        'semester': getattr(user, 'semester', ''),
        'default_payment_methods': getattr(user, 'default_payment_methods', ''),
        'token': token,
    }

    return Response(user_data, status=status.HTTP_200_OK)

class AddExpenseView(BaseAPIView):
    def get (self, request, group_id):
        group = get_object_or_404(Group, group_id=group_id, members=request.user)
        categories = Category.objects.all()
        print(categories)
        category_serializer = CategorySerializer(categories,many=True)
        print(category_serializer.data)
        return Response(
            {"group": {
                "group_id": group.group_id,
                "name": group.name
            },
            "categories": category_serializer.data,
            "username": request.user.username},
            status=status.HTTP_200_OK
        )


class AddExpenseAPIView(BaseAPIView):
    """
    API View to handle adding an expense to a specific group.
    """  # Only authenticated users can access this view
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    def expense_splitter(self, amount, split_type, group_id, due_date):
        """
        Splits the expense equally among group members.
        """
        try:
            # Fetch the group
            group = Group.objects.prefetch_related('members').get(group_id=group_id)
            members = group.members.all()
            member_count = len(members)

            if member_count == 0:
                raise ValidationError("Group has no members to split the expense.")

            if split_type == 'equal':
                split_amount = amount / member_count

                with transaction.atomic():  # Ensures all settlements are created or none
                    for member in members:
                        Settlement.objects.create(
                            amount=split_amount,
                            payment_status="Pending",
                            due_date=due_date,
                            user=member,
                            group_id=group_id,
                            settlement_date = datetime.now(),
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
        """
        Handles the POST request to add an expense.
        """
        user = request.user
        print("Request Data:", request.data)
        due_date = request.data.get('date', datetime.now()+relativedelta(months=1))
        print("Due Date:", due_date)
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
            expense = serializer.save(created_by=user, group_id=group)
            print("Added Expense Successfully")

            # Call the expense_splitter function
            success = self.expense_splitter(amount, split_type, group_id,due_date)

            if success:
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            else:
                return Response(
                    {"error": "Failed to split the expense. Check the logs for details."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        # Return errors if serializer is invalid
        print("Serializer Errors:", serializer.errors)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


def logout_view(request):
    if request.method == 'POST':
        logout(request)
        return redirect('login')
    
@method_decorator(csrf_exempt, name='dispatch')
class UserGroupsAPIView(BaseAPIView):

    def get(self, request):  # Debugging: Print request headers
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



class GroupDetailsAPIView(BaseAPIView):

    def get(self, request, group_id):
        # Get the username from the header
        username = request.headers.get('X-Username')
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

        # Get users from the same college as the current user, excluding the current user and existing group members
        current_user_college = request.user.college
        available_members = CustomUser.objects.filter(college=current_user_college).exclude(
            id=request.user.id  # Exclude the current user
        ).exclude(
            id__in=group.members.values_list('id', flat=True)  # Exclude existing group members
        )

        # Serialize available members
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

class AddMemberAPIView(BaseAPIView):
    """
    API endpoint to add a member to a group.
    """

    def post(self, request, group_id):
        # Debug the incoming request
        print(f"Request data: {request.data}")
        print(f"Authenticated user: {request.user.username}")

        # Fetch the group by ID
        group = get_object_or_404(Group, group_id=group_id)

        # Ensure the user is the creator of the group
        if group.created_by != request.user:
            return Response(
                {'success': False, 'error': 'Only the group creator can add members'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Get the username from the request data
        username = request.data.get('username')
        if not username:
            return Response(
                {'success': False, 'error': 'Username is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Find the user by username
            user_to_add = CustomUser.objects.get(username=username)

            # Ensure the user is not already a member
            if user_to_add in group.members.all():
                return Response(
                    {'success': False, 'error': 'User is already a member of the group'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Add the user to the group
            group.members.add(user_to_add)
            return Response(
                {'success': True, 'message': 'Member added successfully'},
                status=status.HTTP_200_OK
            )

        except CustomUser.DoesNotExist:
            return Response(
                {'success': False, 'error': 'User not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        except Exception as e:
            return Response(
                {'success': False, 'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@csrf_exempt
@api_view(['POST'])  # Allow POST requests without CSRF token for API (use cautiously in production)
@permission_classes([AllowAny])
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

@permission_classes([AllowAny])
class ResendCodeAPIView(APIView):
    """
    API endpoint to resend a verification code to the user's email.
    """

    def post(self, request):
        # Get the email entered by the user
        email = request.data.get('email')

        if not email:
            return Response(
                {"error": "Email is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

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
            user.save()

            # Send the verification code to the user's email
            send_verification_email(user, verification_code)

            # Provide feedback to the user
            return Response(
                {"message": "A new verification code has been sent to your email."},
                status=status.HTTP_200_OK
            )
        else:
            return Response(
                {"error": "No user found with this email."},
                status=status.HTTP_404_NOT_FOUND
            )




class SettlementsView(APIView): # Only authenticated users can access this view

    def get(self, request, username):
        
        # Fetch settlements for the authenticated user
        try:
        # Fetch settlements for the current user
            settlements = Settlement.objects.filter(user=request.user)
            
            # Serialize the settlements
            serializer = SettlementSerializer(settlements, many=True)

            # Extract group IDs from the serializer data
            group_values = [item['group'] for item in serializer.data]

            # Fetch groups with the IDs
            groups = Group.objects.filter(group_id__in=group_values)
            group_name_map = {group.group_id: group.name for group in groups}  # Map group_id to name

            # Add group name to the serializer data
            updated_data = []
            for item in serializer.data:
                try:
                    group_id = item['group']
                    group_name = group_name_map.get(group_id, 'Unknown')  # Get group name or default to 'Unknown'
                    item['group_name'] = group_name  # Add group_name to each item
                    updated_data.append(item)
                except KeyError as e:
                    # Handle missing 'group' key in the serializer data
                    return Response(
                        {"error": f"Invalid settlement data: missing key {str(e)}"},
                        status=status.HTTP_400_BAD_REQUEST
                    )

            # Return the updated data as a JSON response
            return Response({"settlements": updated_data}, status=status.HTTP_200_OK)

        except ObjectDoesNotExist:
            # Handle case where no settlements or groups are found
            return Response(
                {"error": "No settlements or groups found for the user."},
                status=status.HTTP_404_NOT_FOUND
            )

        except DatabaseError as e:
            # Handle database errors
            return Response(
                {"error": f"Database error: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        except ValidationError as e:
            # Handle serialization errors
            return Response(
                {"error": f"Serialization error: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        except Exception as e:
            # Handle any other unexpected errors
            return Response(
                {"error": f"An unexpected error occurred: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class SettlementsAPIView(BaseAPIView):
    """
    API View to fetch settlements for an authenticated user.
    """
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

class UpdatePaymentStatusAPIView(BaseAPIView):
    """
    API View to update the payment status of a settlement.
    """  # Ensures user is authenticated

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


class CreateGroupAPI(BaseAPIView):

    def post(self, request):
        try:
            print("Authenticated User:", request.user)  # Debugging: Check the authenticated user
            print(request.data)  # Debugging: Log the request data
            # Add the creator to the request data
            username = request.headers.get("X-Username")
            if not username:
                return Response(
                    {"error": "X-Username header is required."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            try:
                user_to_add = CustomUser.objects.get(username=username)
            except ObjectDoesNotExist:
                return Response(
                    {"error": f"User with username '{username}' does not exist."},
                    status=status.HTTP_404_NOT_FOUND
                )

            # request.data["created_by"] = username
            print("Request Data:", request.data)  # Debugging: Log the request data


            # check if the group with the same name already exists
            group_name = request.data.get('name')
            if Group.objects.filter(name=group_name, created_by=user_to_add).exists():
                return Response(
                    {"error": "A group with this name already exists."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Create the group form with the request data
            # Validate the form
            form = GroupForm(request.data)
            if form.is_valid():
                try:
                    # Save the group
                    group = form.save()

                    # Add the user to the group
                    group.members.add(user_to_add)

                    return Response(
                        {'message': 'Group created successfully.'},
                        status=status.HTTP_201_CREATED
                    )
                except DatabaseError as e:
                    # Handle database errors during group creation
                    return Response(
                        {"error": f"Database error: {str(e)}"},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR
                    )
            else:
                print("Form Errors:", form.errors)  # Debugging: Log form errors
                return Response(
                    {"error": "Invalid group data.", "details": form.errors},
                    status=status.HTTP_400_BAD_REQUEST
                )

        except ValidationError as e:
            # Handle validation errors
            return Response(
                {"error": f"Validation error: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        except Exception as e:
            # Handle any other unexpected errors
            return Response(
                {"error": f"An unexpected error occurred: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
