from rest_framework.views import APIView
from rest_framework.response import Response
from common.permissions import IsProjectMember
from .services import A300ValidationEngine


class A300CheckListView(APIView):
    permission_classes = [IsProjectMember]

    def get(self, request, project_id=None):
        """Run all A300 validation checks for the project."""
        results = A300ValidationEngine.run_all(project_id)
        all_passed = all(r['passed'] for r in results)
        return Response({
            'project_id': project_id,
            'all_passed': all_passed,
            'checks': results,
        })


class A300CheckDetailView(APIView):
    permission_classes = [IsProjectMember]

    def get(self, request, project_id=None, rule=None):
        """Run a specific A300 validation rule."""
        validator = getattr(A300ValidationEngine, f'validate_{rule}', None)
        if not validator:
            return Response(
                {'detail': f'未找到校验规则: {rule}'},
                status=404
            )
        result = validator(project_id)
        result['rule'] = rule
        result['rule_name'] = A300ValidationEngine.RULES.get(rule, rule)
        return Response(result)
