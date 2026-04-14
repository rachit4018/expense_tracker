from django.db import models
from django.contrib.auth.models import AbstractUser
from django.conf import settings
from datetime import datetime
from django.core.validators import MinValueValidator, MaxValueValidator
from django import forms
import string
import random
from django.utils import timezone 

class CustomUser(AbstractUser):
    college = models.CharField(max_length=255)
    semester = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(8)])
    default_payment_methods = models.CharField(max_length=255, blank=True)
    jwt_token = models.CharField(max_length=1024, blank=True, null=True)
    verification_code_created_at = models.DateTimeField(blank=True, null=True)
    verification_code = models.CharField(max_length=6, blank=True, null=True)  # To store the verification code
    is_verified = models.BooleanField(default=False)

class Category(models.Model):
    CATEGORY_CHOICES = [
        ("Food", "Food"),
        ("Travel", "Travel"),
        ("Rent", "Rent"),
        ("Groceries", "Groceries"),
        ("Utilities", "Utilities"),
        ("Entertainment", "Entertainment"),
        ("Medical", "Medical"),
        ("Education", "Education"),
        ("Shopping", "Shopping"),
        ("Others", "Others"),
    ]

    name = models.CharField(
        max_length=100,
        unique=True,
        choices=CATEGORY_CHOICES
    )

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



def generate_group_code():
    """Generates a unique 8-character alphanumeric code e.g. AB12CD34"""
    chars = string.ascii_uppercase + string.digits
    while True:
        code = ''.join(random.choices(chars, k=8))
        if not Group.objects.filter(code=code).exists():
            return code


# REPLACE WITH this
class Group(models.Model):
    group_id    = models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')
    name        = models.CharField(max_length=100)

    # NEW: unique join code
    code        = models.CharField(max_length=8, unique=True, blank=True)

    # NEW: admin is the group creator
    admin       = models.ForeignKey(
                    settings.AUTH_USER_MODEL,
                    on_delete=models.CASCADE,
                    related_name='administered_groups',
                    null=True,
                    blank=True
                  )

    # CHANGED: now uses GroupMembership through model
    members     = models.ManyToManyField(
                    settings.AUTH_USER_MODEL,
                    related_name='group_groups',
                    through='GroupMembership'
                  )

    created_by  = models.ForeignKey(
                    settings.AUTH_USER_MODEL,
                    on_delete=models.CASCADE,
                    related_name='group_created_groups',
                    to_field='username'
                  )

    # NEW: track when group was created
    created_at  = models.DateTimeField(auto_now_add=True, null=True)

    def save(self, *args, **kwargs):
        # Auto-generate code on first save
        if not self.code:
            self.code = generate_group_code()
        super().save(*args, **kwargs)

    def regenerate_code(self):
        """Admin calls this to invalidate old invites"""
        self.code = generate_group_code()
        self.save()

    def __str__(self):
        return f"{self.name} ({self.code})"
    

class GroupMembership(models.Model):
    """
    Tracks each user's membership in a group.
    is_active=False means the member was removed by admin.
    """
    class JoinMethod(models.TextChoices):
        CODE    = 'code',    'Joined via Code'
        INVITED = 'invited', 'Invited by Admin'
        CREATOR = 'creator', 'Group Creator'

    user        = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    group       = models.ForeignKey(Group, on_delete=models.CASCADE)
    joined_at   = models.DateTimeField(auto_now_add=True)
    join_method = models.CharField(
                    max_length=20,
                    choices=JoinMethod.choices,
                    default=JoinMethod.CODE
                  )
    is_active   = models.BooleanField(default=True)

    class Meta:
        unique_together = ('user', 'group')

    def __str__(self):
        return f"{self.user.username} in {self.group.name}"

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
    settlement_date = models.DateField(default=datetime.now)

class PasswordResetToken(models.Model):
    token_id = models.AutoField(primary_key=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    token = models.CharField(max_length=100, unique=True)
    expiry = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)