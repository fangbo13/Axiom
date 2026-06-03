from rest_framework import serializers
from .models import TrialBalanceSnapshot
from apps.ledger.serializers import AccountSerializer


class TrialBalanceSnapshotSerializer(serializers.ModelSerializer):
    account = AccountSerializer(read_only=True)

    class Meta:
        model = TrialBalanceSnapshot
        fields = [
            'id', 'project', 'account',
            'opening_debit', 'opening_credit',
            'period_movement_debit', 'period_movement_credit',
            'adjusted_debit', 'adjusted_credit',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
