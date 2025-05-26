from rest_framework import serializers
from .models import Category, Expense, Group, Settlement
from datetime import datetime, timedelta
from django.utils.timezone import now
from .models import CustomUser
from .views import generate_verification_code       
class SignupSerializer(serializers.ModelSerializer):
    password1 = serializers.CharField(write_only=True)
    password2 = serializers.CharField(write_only=True)

    class Meta:
        model = CustomUser
        fields = ['username', 'email', 'password1', 'password2', 'college', 'semester', 'default_payment_methods']

    def validate_email(self, value):
        if CustomUser.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email is already registered.")
        return value

    def validate(self, data):
        if data['password1'] != data['password2']:
            raise serializers.ValidationError("Passwords do not match.")
        return data

    def create(self, validated_data):
        validated_data.pop('password2')
        password = validated_data.pop('password1')
        user = CustomUser(**validated_data)
        user.set_password(password)

        # Generate verification code
        existing_codes = CustomUser.objects.values_list('verification_code', flat=True)
        verification_code = generate_verification_code(existing_codes)

        user.verification_code = verification_code
        user.verification_code_created_at = now()
        user.is_verified = False
        user.save()

        return user


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'


class ExpenseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Expense
        fields = '__all__'

    def create(self, validated_data):
        # Use validated data to create the expense
        validated_data["date"] = now().strftime("%Y-%m-%d") 
        return Expense.objects.create(**validated_data)


class GroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = Group
        fields = '__all__'


class SettlementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Settlement
        fields = '__all__'
