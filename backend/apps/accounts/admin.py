from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['id', 'email', 'username', 'firm_name', 'is_admin', 'date_joined', 'is_active']
    list_filter = ['is_admin', 'is_active', 'date_joined']
    search_fields = ['email', 'username', 'firm_name']
    ordering = ['-date_joined']
    fieldsets = BaseUserAdmin.fieldsets + (
        ('额外信息', {'fields': ('firm_name', 'phone', 'is_admin')}),
    )
