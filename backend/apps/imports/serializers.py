from rest_framework import serializers
from apps.accounts.serializers import UserSerializer
from .models import ImportBatch, UnauditedTB, UnauditedJE, ImportErrorRow, MappingTemplate, ImportLog


class ImportBatchSerializer(serializers.ModelSerializer):
    uploaded_by = UserSerializer(read_only=True)

    class Meta:
        model = ImportBatch
        fields = [
            'id', 'project', 'uploaded_by', 'file_name', 'import_type',
            'status', 'overwrite_mode', 'period', 'version', 'is_active',
            'total_rows', 'parsed_rows', 'error_rows_count', 'warning_rows_count',
            'metadata', 'validation_summary',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['project', 'uploaded_by', 'version', 'status']


class ImportBatchListSerializer(serializers.ModelSerializer):
    uploaded_by = UserSerializer(read_only=True)
    is_balanced = serializers.SerializerMethodField()

    class Meta:
        model = ImportBatch
        fields = [
            'id', 'file_name', 'import_type', 'status', 'period',
            'version', 'is_active', 'total_rows', 'parsed_rows', 'error_rows_count', 'warning_rows_count',
            'uploaded_by', 'created_at', 'is_balanced',
        ]

    def get_is_balanced(self, obj):
        summary = obj.validation_summary or {}
        checks = summary.get('checks', {})
        return all(c.get('passed', False) for c in checks.values())


class UnauditedTBSerializer(serializers.ModelSerializer):
    class Meta:
        model = UnauditedTB
        fields = [
            'id', 'project', 'import_batch', 'account_code', 'account_name',
            'opening_debit', 'opening_credit', 'period_debit', 'period_credit',
            'closing_debit', 'closing_credit', 'direction',
            'currency_code', 'foreign_opening_debit', 'foreign_opening_credit',
            'foreign_period_debit', 'foreign_period_credit',
            'foreign_closing_debit', 'foreign_closing_credit',
            'exchange_rate', 'direction_inferred', 'direction_conflict', 'closing_balance_delta',
            'created_at', 'updated_at',
        ]


class UnauditedJESerializer(serializers.ModelSerializer):
    class Meta:
        model = UnauditedJE
        fields = [
            'id', 'project', 'import_batch', 'voucher_date', 'voucher_no',
            'line_no', 'abstract', 'account_code', 'account_name',
            'debit', 'credit', 'aux_fields',
            'currency_code', 'foreign_debit', 'foreign_credit', 'exchange_rate',
            'created_at', 'updated_at',
        ]


class ImportErrorRowSerializer(serializers.ModelSerializer):
    class Meta:
        model = ImportErrorRow
        fields = [
            'id', 'import_batch', 'row_number', 'raw_data',
            'error_type', 'error_message', 'severity',
            'is_resolved', 'resolved_data',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['import_batch']


class ColumnMappingSerializer(serializers.Serializer):
    column_mapping = serializers.DictField(child=serializers.CharField())


class ImportCommitSerializer(serializers.Serializer):
    batch_id = serializers.IntegerField()
    column_mapping = serializers.DictField(child=serializers.CharField(), required=False)
    set_active = serializers.BooleanField(default=True)


class PreviewResponseSerializer(serializers.Serializer):
    batch_id = serializers.IntegerField()
    file_name = serializers.CharField()
    import_type = serializers.CharField()
    detected_columns = serializers.ListField(child=serializers.CharField())
    guessed_mapping = serializers.DictField(child=serializers.CharField())
    total_rows = serializers.IntegerField()
    first_rows = serializers.ListField(child=serializers.DictField())
    sample_rows = serializers.ListField(child=serializers.DictField())
    detected_header_row = serializers.IntegerField(required=False)
    header_confidence = serializers.FloatField(required=False)
    is_multiline_header = serializers.BooleanField(required=False)
    detected_currencies = serializers.ListField(child=serializers.CharField(), required=False)


class ValidationResponseSerializer(serializers.Serializer):
    batch_id = serializers.IntegerField()
    is_valid = serializers.BooleanField()
    summary = serializers.DictField()
    checks = serializers.DictField()
    errors = serializers.ListField()
    warnings = serializers.ListField(required=False)


class MappingTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = MappingTemplate
        fields = [
            'id', 'project', 'name', 'import_type', 'file_extensions',
            'header_signature', 'column_mapping', 'is_auto_saved',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['project']


class ImportLogSerializer(serializers.ModelSerializer):
    performed_by = UserSerializer(read_only=True)

    class Meta:
        model = ImportLog
        fields = [
            'id', 'project', 'import_batch', 'action', 'performed_by',
            'details', 'created_at',
        ]
