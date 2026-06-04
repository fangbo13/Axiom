from django.db import models
from rest_framework import serializers
from .models import Project
from apps.accounts.serializers import UserSerializer


class ProjectSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    member_count = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = [
            'id', 'name', 'client_name', 'fiscal_year_end',
            'created_by', 'members', 'member_count', 'status', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']

    def get_member_count(self, obj):
        return obj.members.count()

    def create(self, validated_data):
        members = validated_data.pop('members', [])
        project = Project.objects.create(**validated_data)
        project.members.set(members)
        # Ensure creator is always a member
        if project.created_by not in project.members.all():
            project.members.add(project.created_by)
        return project


class ProjectOverviewSerializer(serializers.ModelSerializer):
    """Serializer for dashboard overview data."""
    workpaper_total = serializers.SerializerMethodField()
    workpaper_by_status = serializers.SerializerMethodField()
    ledger_entry_count = serializers.SerializerMethodField()
    open_adjustments = serializers.SerializerMethodField()
    imported_tb_count = serializers.SerializerMethodField()
    imported_je_count = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = [
            'id', 'name', 'client_name', 'fiscal_year_end', 'status',
            'workpaper_total', 'workpaper_by_status', 'ledger_entry_count', 'open_adjustments',
            'imported_tb_count', 'imported_je_count',
        ]

    def get_workpaper_total(self, obj):
        return obj.workpapers.count() if hasattr(obj, 'workpapers') else 0

    def get_workpaper_by_status(self, obj):
        if not hasattr(obj, 'workpapers'):
            return {}
        from apps.workpapers.models import Workpaper
        qs = obj.workpapers.values('status').annotate(count=models.Count('status'))
        return {item['status']: item['count'] for item in qs}

    def get_ledger_entry_count(self, obj):
        return obj.ledger_entries.count() if hasattr(obj, 'ledger_entries') else 0

    def get_open_adjustments(self, obj):
        if not hasattr(obj, 'adjusting_entries'):
            return 0
        return obj.adjusting_entries.exclude(status='posted').count()

    def get_imported_tb_count(self, obj):
        if hasattr(obj, 'import_batches'):
            return obj.import_batches.filter(import_type='tb', status='committed').count()
        return 0

    def get_imported_je_count(self, obj):
        if hasattr(obj, 'import_batches'):
            return obj.import_batches.filter(import_type='je', status='committed').count()
        return 0
