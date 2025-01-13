from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser, Category, Expense, Group, Settlement

# CustomUser admin configuration
class CustomUserAdmin(UserAdmin):
    model = CustomUser
    list_display = ('username', 'email', 'college', 'semester', 'default_payment_methods', 'is_staff')
    list_filter = ('is_staff', 'is_active', 'semester')
    search_fields = ('username', 'email', 'college')
    ordering = ('username',)

# Category admin configuration
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('id', 'name')
    search_fields = ('name',)
    ordering = ('name',)

# Expense admin configuration
class ExpenseAdmin(admin.ModelAdmin):
    list_display = ('id', 'amount', 'category', 'split_type', 'date', 'created_by', 'receipt_image')
    list_filter = ('category', 'split_type', 'date', 'created_by')
    search_fields = ('amount', 'category__name', 'created_by__username')
    ordering = ('date',)

# Group admin configuration
class GroupAdmin(admin.ModelAdmin):
    list_display = ('group_id', 'name')
    search_fields = ('name',)
    filter_horizontal = ('members',)  # For selecting multiple members easily
    ordering = ('name',)

# Settlement admin configuration
class SettlementAdmin(admin.ModelAdmin):
    list_display = ('id', 'payment_status', 'settlement_method', 'due_date', 'group')
    list_filter = ('payment_status', 'settlement_method', 'group')
    search_fields = ('settlement_method', 'group__name')
    ordering = ('due_date',)

# Register models in admin
admin.site.register(CustomUser, CustomUserAdmin)
admin.site.register(Category, CategoryAdmin)
admin.site.register(Expense, ExpenseAdmin)
admin.site.register(Group, GroupAdmin)
admin.site.register(Settlement, SettlementAdmin)
