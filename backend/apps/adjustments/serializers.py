from rest_framework import serializers
from .models import AdjustingEntry, AdjustmentLine
from apps.ledger.serializers import AccountSerializer


class AdjustmentLineSerializer(serializers.ModelSerializer):
    account = AccountSerializer(read_only=True)
    account_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = AdjustmentLine
        fields = ['id', 'entry', 'account', 'account_id', 'debit', 'credit']
        read_only_fields = ['id']

    def create(self, validated_data):
        from apps.ledger.models import Account
        account_id = validated_data.pop('account_id')
        account = Account.objects.get(id=account_id)
        validated_data['account'] = account
        return super().create(validated_data)


class AdjustingEntrySerializer(serializers.ModelSerializer):
    lines = AdjustmentLineSerializer(many=True)
    total_debit = serializers.SerializerMethodField()
    total_credit = serializers.SerializerMethodField()

    class Meta:
        model = AdjustingEntry
        fields = [
            'id', 'project', 'entry_number', 'description', 'status',
            'prepared_by', 'reviewed_by', 'lines', 'total_debit', 'total_credit',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'prepared_by']

    def get_total_debit(self, obj):
        return sum(line.debit for line in obj.lines.all())

    def get_total_credit(self, obj):
        return sum(line.credit for line in obj.lines.all())

    def _create_lines(self, entry, lines_data):
        from apps.ledger.models import Account
        for line_data in lines_data:
            account_id = line_data.pop('account_id')
            account = Account.objects.get(id=account_id)
            AdjustmentLine.objects.create(entry=entry, account=account, **line_data)

    def create(self, validated_data):
        lines_data = validated_data.pop('lines', [])
        entry = AdjustingEntry.objects.create(**validated_data)
        self._create_lines(entry, lines_data)
        return entry

    def update(self, instance, validated_data):
        lines_data = validated_data.pop('lines', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if lines_data is not None:
            instance.lines.all().delete()
            self._create_lines(instance, lines_data)
        return instance
