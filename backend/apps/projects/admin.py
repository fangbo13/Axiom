from django.contrib import admin
from .models import Project


class ProjectAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'client_name', 'fiscal_year_end', 'status', 'created_by', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['name', 'client_name']
    filter_horizontal = ['members']
    date_hierarchy = 'created_at'


admin.site.register(Project, ProjectAdmin)
