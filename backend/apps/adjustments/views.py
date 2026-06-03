from django.db import transaction
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from common.permissions import IsProjectMember
from apps.projects.models import Project
from .models import AdjustingEntry
from .serializers import AdjustingEntrySerializer
from .services import recalculate_trial_balance


class AdjustingEntryViewSet(viewsets.ModelViewSet):
    serializer_class = AdjustingEntrySerializer
    permission_classes = [IsProjectMember]

    def get_queryset(self):
        project_id = self.kwargs.get('project_id')
        return AdjustingEntry.objects.filter(project_id=project_id).prefetch_related('lines__account')

    def perform_create(self, serializer):
        project_id = self.kwargs.get('project_id')
        project = Project.objects.get(id=project_id)
        serializer.save(project=project, prepared_by=self.request.user)

    @action(detail=True, methods=['post'])
    def post_entry(self, request, project_id=None, pk=None):
        """Post (approve) an adjusting entry and recalculate trial balance."""
        entry = self.get_object()

        if entry.status == 'posted':
            return Response(
                {'detail': '该分录已经过账'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate entry balances
        total_debit = sum(line.debit for line in entry.lines.all())
        total_credit = sum(line.credit for line in entry.lines.all())
        if total_debit != total_credit:
            return Response(
                {'detail': f'分录不平衡: 借方 {total_debit} != 贷方 {total_credit}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        with transaction.atomic():
            entry.status = 'posted'
            entry.reviewed_by = request.user
            entry.save()
            try:
                result = recalculate_trial_balance(project_id)
            except ValueError as e:
                raise  # Transaction will roll back

        return Response({
            'detail': '分录已过账，试算平衡已更新',
            'trial_balance': result,
        })

    @action(detail=True, methods=['post'])
    def approve(self, request, project_id=None, pk=None):
        entry = self.get_object()
        if entry.status != 'proposed':
            return Response(
                {'detail': '只有待提议状态的分录可以批准'},
                status=status.HTTP_400_BAD_REQUEST
            )
        entry.status = 'approved'
        entry.reviewed_by = request.user
        entry.save()
        return Response({'detail': '分录已批准'})
