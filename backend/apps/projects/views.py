from django.db.models import Q, Count
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from common.permissions import IsProjectMember
from .models import Project
from .serializers import ProjectSerializer, ProjectOverviewSerializer


class ProjectViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectSerializer
    permission_classes = [IsProjectMember]

    def get_queryset(self):
        user = self.request.user
        return Project.objects.filter(
            Q(created_by=user) | Q(members=user)
        ).distinct().prefetch_related('members', 'created_by')

    def perform_create(self, serializer):
        project = serializer.save(created_by=self.request.user)
        project.members.add(self.request.user)

    @action(detail=True, methods=['post'])
    def switch(self, request, pk=None):
        """Endpoint to confirm project access and return project details."""
        project = self.get_object()
        serializer = self.get_serializer(project)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def overview(self, request, pk=None):
        """Return dashboard overview for the project."""
        project = self.get_object()
        serializer = ProjectOverviewSerializer(project)
        return Response(serializer.data)
