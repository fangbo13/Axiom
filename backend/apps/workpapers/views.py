from rest_framework import viewsets
from common.permissions import IsProjectMember
from .models import Workpaper
from .serializers import WorkpaperSerializer


class WorkpaperViewSet(viewsets.ModelViewSet):
    serializer_class = WorkpaperSerializer
    permission_classes = [IsProjectMember]

    def get_queryset(self):
        project_id = self.kwargs.get('project_id')
        return Workpaper.objects.filter(project_id=project_id).select_related('assigned_to')

    def perform_create(self, serializer):
        from apps.projects.models import Project
        project_id = self.kwargs.get('project_id')
        project = Project.objects.get(id=project_id)
        serializer.save(project=project)
