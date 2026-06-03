from rest_framework import serializers
from .models import NoteDraft
from apps.workpapers.serializers import WorkpaperSerializer


class NoteDraftSerializer(serializers.ModelSerializer):
    linked_workpapers = WorkpaperSerializer(many=True, read_only=True)
    linked_workpaper_ids = serializers.PrimaryKeyRelatedField(
        source='linked_workpapers',
        many=True,
        read_only=True
    )

    class Meta:
        model = NoteDraft
        fields = [
            'id', 'project', 'note_number', 'title', 'content',
            'linked_workpapers', 'linked_workpaper_ids', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
