from django.contrib import admin
from .models import Account, LedgerEntry


class AccountAdmin(admin.ModelAdmin):
    list_display = ['code', 'name', 'category', 'project']
    list_filter = ['category', 'project']
    search_fields = ['code', 'name']


class LedgerEntryAdmin(admin.ModelAdmin):
    list_display = ['account', 'period', 'debit', 'credit', 'project', 'created_at']
    list_filter = ['project', 'period']
    search_fields = ['account__code', 'account__name']


admin.site.register(Account, AccountAdmin)
admin.site.register(LedgerEntry, LedgerEntryAdmin)
