from django.db import models
from django.contrib.auth.models import AbstractUser
from django.conf import settings
from datetime import datetime
from django.core.validators import MinValueValidator, MaxValueValidator
from django import forms

class CustomUser(AbstractUser):
    college = models.CharField(max_length=255)
    semester = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(8)])
    default_payment_methods = models.CharField(max_length=255, blank=True)
    jwt_token = models.CharField(max_length=1024, blank=True, null=True)
    verification_code_created_at = models.DateTimeField(blank=True, null=True)
    verification_code = models.CharField(max_length=6, blank=True, null=True)  # To store the verification code
    is_verified = models.BooleanField(default=False)

class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    def __str__(self):
        return self.name

class Expense(models.Model):
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    category = models.ForeignKey(Category, on_delete=models.CASCADE)
    split_type = models.CharField(max_length=50, choices=[("equal", "Equal")])
    date = models.DateField(default=datetime.now)
    receipt_image = models.ImageField(upload_to="receipts/", blank=True, null=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='%(class)s_created_groups',
        to_field='username'  # Specify using 'username' as the reference field
    )
    group_id = models.ForeignKey('Group', on_delete=models.CASCADE)


class Group(models.Model):
    group_id = models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')
    name = models.CharField(max_length=100)
    members = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='%(class)s_groups')  # Custom reverse accessor for members
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='%(class)s_created_groups',
        to_field='username'  # Specify using 'username' as the reference field
    )

    def __str__(self):
        return self.name

class Settlement(models.Model):
    id = models.AutoField(primary_key=True)
    PAYMENT_STATUS_PENDING = 'Pending'
    PAYMENT_STATUS_COMPLETED = 'Completed'
    PAYMENT_STATUS_CHOICES = [
        (PAYMENT_STATUS_PENDING, 'Pending'),
        (PAYMENT_STATUS_COMPLETED, 'Completed')
    ]
    payment_status = models.CharField(max_length=50, choices=PAYMENT_STATUS_CHOICES, default=PAYMENT_STATUS_PENDING)
    settlement_method = models.CharField(max_length=50, blank=True)
    due_date = models.DateField()
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    group = models.ForeignKey(Group, on_delete=models.CASCADE)
    amount = models.DecimalField(decimal_places=2,max_digits=10)
    
