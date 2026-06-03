from django.http import HttpResponse
from rest_framework.views import APIView
from common.permissions import IsProjectMember
from apps.projects.models import Project
from .generators import generate_export_zip


class ExportZipView(APIView):
    permission_classes = [IsProjectMember]

    def get(self, request, project_id=None):
        project = Project.objects.get(id=project_id)
        zip_buffer = generate_export_zip(project)

        response = HttpResponse(zip_buffer, content_type='application/zip')
        response['Content-Disposition'] = (
            f'attachment; filename="axiom_export_{project_id}.zip"'
        )
        return response
