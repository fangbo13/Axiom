from rest_framework import viewsets
from common.permissions import IsProjectMember
from apps.projects.models import Project
from .models import NoteDraft
from .serializers import NoteDraftSerializer


class NoteDraftViewSet(viewsets.ModelViewSet):
    serializer_class = NoteDraftSerializer
    permission_classes = [IsProjectMember]

    def get_queryset(self):
        project_id = self.kwargs.get('project_id')
        return NoteDraft.objects.filter(project_id=project_id).prefetch_related('linked_workpapers')

    def perform_create(self, serializer):
        project_id = self.kwargs.get('project_id')
        project = Project.objects.get(id=project_id)
        serializer.save(project=project)
