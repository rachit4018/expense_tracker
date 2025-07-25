from rest_framework import serializers
from .models import Category, Expense, Group, Settlement
from datetime import datetime, timedelta
from django.utils.timezone import now

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'


class ExpenseSerializer(serializers.ModelSerializer):
    receipt_image = serializers.ImageField(required=False, allow_null=True)
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
