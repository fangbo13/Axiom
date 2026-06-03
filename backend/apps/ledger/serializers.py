from rest_framework import serializers
from .models import Account, LedgerEntry


class AccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = Account
        fields = ['id', 'code', 'name', 'category', 'parent', 'project']
        read_only_fields = ['id']


class LedgerEntrySerializer(serializers.ModelSerializer):
    account = AccountSerializer(read_only=True)
    account_id = serializers.PrimaryKeyRelatedField(
        queryset=Account.objects.all(),
        source='account',
        write_only=True
    )

    class Meta:
        model = LedgerEntry
        fields = [
            'id', 'project', 'account', 'account_id', 'period',
            'debit', 'credit', 'description', 'source_file', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class LedgerUploadSerializer(serializers.Serializer):
    file = serializers.FileField()
