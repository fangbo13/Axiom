from rest_framework import serializers
from .models import Workpaper
from apps.accounts.serializers import UserSerializer


class WorkpaperSerializer(serializers.ModelSerializer):
    assigned_to = UserSerializer(read_only=True)
    assigned_to_id = serializers.PrimaryKeyRelatedField(
        source='assigned_to',
        read_only=True
    )

    class Meta:
        model = Workpaper
        fields = [
            'id', 'project', 'wp_number', 'title', 'status',
            'assigned_to', 'assigned_to_id', 'due_date', 'content', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
