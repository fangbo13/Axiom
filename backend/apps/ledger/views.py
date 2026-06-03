from django.db import transaction
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from common.permissions import IsProjectMember
from apps.projects.models import Project
from .models import Account, LedgerEntry
from .serializers import AccountSerializer, LedgerEntrySerializer, LedgerUploadSerializer
from .parsers import parse_ledger_file


class AccountViewSet(viewsets.ModelViewSet):
    serializer_class = AccountSerializer
    permission_classes = [IsProjectMember]

    def get_queryset(self):
        project_id = self.kwargs.get('project_id')
        return Account.objects.filter(project_id=project_id)

    def perform_create(self, serializer):
        project_id = self.kwargs.get('project_id')
        project = Project.objects.get(id=project_id)
        serializer.save(project=project)


class LedgerEntryViewSet(viewsets.ModelViewSet):
    serializer_class = LedgerEntrySerializer
    permission_classes = [IsProjectMember]

    def get_queryset(self):
        project_id = self.kwargs.get('project_id')
        return LedgerEntry.objects.filter(project_id=project_id).select_related('account')

    def perform_create(self, serializer):
        project_id = self.kwargs.get('project_id')
        project = Project.objects.get(id=project_id)
        serializer.save(project=project)


class LedgerUploadViewSet(viewsets.ViewSet):
    permission_classes = [IsProjectMember]
    parser_classes = [MultiPartParser, FormParser]

    @action(detail=False, methods=['post'])
    def upload(self, request, project_id=None):
        serializer = LedgerUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        file_obj = serializer.validated_data['file']
        project = Project.objects.get(id=project_id)

        result = parse_ledger_file(file_obj, file_obj.name)
        if result['errors'] and not result['rows']:
            return Response(
                {'detail': '文件解析失败', 'errors': result['errors']},
                status=status.HTTP_400_BAD_REQUEST
            )

        accounts_created = 0
        entries_created = 0

        with transaction.atomic():
            for row in result['rows']:
                account, created = Account.objects.get_or_create(
                    project=project,
                    code=row['account_code'],
                    defaults={'name': row['account_name'], 'category': 'asset'}
                )
                if created:
                    accounts_created += 1
                else:
                    # Update name if changed
                    if account.name != row['account_name']:
                        account.name = row['account_name']
                        account.save()

                LedgerEntry.objects.create(
                    project=project,
                    account=account,
                    period=row['period'],
                    debit=row['debit'],
                    credit=row['credit'],
                    description=row['description'],
                    source_file=file_obj.name,
                )
                entries_created += 1

        return Response({
            'summary': result['summary'],
            'accounts_created': accounts_created,
            'entries_created': entries_created,
            'errors': result['errors'],
        }, status=status.HTTP_201_CREATED)
