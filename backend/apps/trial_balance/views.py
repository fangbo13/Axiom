from django.db.models import Sum
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from common.permissions import IsProjectMember
from .models import TrialBalanceSnapshot
from .serializers import TrialBalanceSnapshotSerializer


class TrialBalanceViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = TrialBalanceSnapshotSerializer
    permission_classes = [IsProjectMember]

    def get_queryset(self):
        project_id = self.kwargs.get('project_id')
        return TrialBalanceSnapshot.objects.filter(project_id=project_id).select_related('account')

    @action(detail=False, methods=['get'])
    def summary(self, request, project_id=None):
        """Return aggregated totals for the trial balance."""
        qs = self.get_queryset()
        aggregates = qs.aggregate(
            total_opening_debit=Sum('opening_debit'),
            total_opening_credit=Sum('opening_credit'),
            total_movement_debit=Sum('period_movement_debit'),
            total_movement_credit=Sum('period_movement_credit'),
            total_adjusted_debit=Sum('adjusted_debit'),
            total_adjusted_credit=Sum('adjusted_credit'),
        )
        return Response(aggregates)
