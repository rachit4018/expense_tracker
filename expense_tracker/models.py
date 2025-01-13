from django.db import models
from django.contrib.auth.models import AbstractUser
from django.conf import settings
from datetime import datetime

class CustomUser(AbstractUser):
    college = models.CharField(max_length=255)
    semester = models.IntegerField(default=1)
    default_payment_methods = models.CharField(max_length=255, blank=True)

class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)

class Expense(models.Model):
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    category = models.ForeignKey(Category, on_delete=models.CASCADE)
    split_type = models.CharField(max_length=50, choices=[("equal", "Equal"), ("percentage", "Percentage")])
    date = models.DateField(default=datetime.now)
    receipt_image = models.ImageField(upload_to="receipts/", blank=True, null=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)

class Group(models.Model):
    name = models.CharField(max_length=100)
    members = models.ManyToManyField(settings.AUTH_USER_MODEL)

class Settlement(models.Model):
    payment_status = models.CharField(max_length=50, choices=[("pending", "Pending"), ("completed", "Completed")])
    settlement_method = models.CharField(max_length=50, blank=True)
    due_date = models.DateField()
    group = models.ForeignKey(Group, on_delete=models.CASCADE)
