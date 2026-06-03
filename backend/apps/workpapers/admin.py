from django.contrib import admin
from .models import Workpaper


class WorkpaperAdmin(admin.ModelAdmin):
    list_display = ['wp_number', 'title', 'project', 'status', 'assigned_to', 'due_date']
    list_filter = ['status', 'project']
    search_fields = ['wp_number', 'title']


admin.site.register(Workpaper, WorkpaperAdmin)
