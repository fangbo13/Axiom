import os
from django.conf import settings
from django.db import transaction
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from common.permissions import IsProjectMember
from apps.projects.models import Project
from apps.adjustments.services import recalculate_trial_balance
from .models import ImportBatch, UnauditedTB, UnauditedJE, ImportErrorRow
from .serializers import (
    ImportBatchSerializer, ImportBatchListSerializer,
    UnauditedTBSerializer, UnauditedJESerializer,
    ImportErrorRowSerializer, PreviewResponseSerializer,
    ValidationResponseSerializer, ImportCommitSerializer,
    ColumnMappingSerializer,
)
from .parsers import parse_file_to_raw_rows, guess_column_mapping, get_sample_rows, apply_mapping
from .validators import ImportValidator
from .services import get_next_version, activate_batch, commit_batch


class ImportPipelineViewSet(viewsets.ViewSet):
    permission_classes = [IsProjectMember]
    parser_classes = [MultiPartParser, FormParser]

    @action(detail=False, methods=['post'])
    def upload(self, request, project_id=None):
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({'detail': '未提供文件'}, status=status.HTTP_400_BAD_REQUEST)

        import_type = request.data.get('import_type', 'tb')
        overwrite_mode = request.data.get('overwrite_mode', 'append')
        period = request.data.get('period', '')

        ext = file_obj.name.split('.')[-1].lower()
        if ext not in ['csv', 'xlsx', 'xls']:
            return Response({'detail': '只支持 CSV 或 Excel 文件'}, status=status.HTTP_400_BAD_REQUEST)

        project = Project.objects.get(id=project_id)
        version = get_next_version(project, period)

        batch = ImportBatch.objects.create(
            project=project,
            uploaded_by=request.user,
            file_name=file_obj.name,
            import_type=import_type,
            status='uploaded',
            overwrite_mode=overwrite_mode,
            period=period,
            version=version,
        )

        # Save file to disk for later re-reading
        batch_dir = os.path.join(settings.MEDIA_ROOT, 'imports', f'project_{project_id}', f'batch_{batch.id}')
        os.makedirs(batch_dir, exist_ok=True)
        file_path = os.path.join(batch_dir, file_obj.name)
        with open(file_path, 'wb+') as dest:
            for chunk in file_obj.chunks():
                dest.write(chunk)

        # Parse preview
        with open(file_path, 'rb') as f:
            result = parse_file_to_raw_rows(f, file_obj.name)

        if result['errors']:
            batch.status = 'failed'
            batch.save()
            return Response({'detail': '文件解析失败', 'errors': result['errors']}, status=status.HTTP_400_BAD_REQUEST)

        columns = result['columns']
        raw_rows = result['rows']
        guessed_mapping = guess_column_mapping(columns, import_type)
        first_rows, sample_rows = get_sample_rows(raw_rows)

        batch.total_rows = len(raw_rows)
        batch.metadata = {
            'file_path': file_path,
            'columns': columns,
            'guessed_mapping': guessed_mapping,
            'sample_row_indices': [i + len(first_rows) + 2 for i in range(len(sample_rows))],
        }
        batch.save()

        return Response({
            'batch_id': batch.id,
            'file_name': batch.file_name,
            'import_type': batch.import_type,
            'detected_columns': columns,
            'guessed_mapping': guessed_mapping,
            'total_rows': batch.total_rows,
            'first_rows': first_rows,
            'sample_rows': sample_rows,
        })

    @action(detail=False, methods=['post'])
    def column_map(self, request, project_id=None):
        batch_id = request.data.get('batch_id')
        column_mapping = request.data.get('column_mapping', {})

        try:
            batch = ImportBatch.objects.get(id=batch_id, project_id=project_id)
        except ImportBatch.DoesNotExist:
            return Response({'detail': '批次不存在'}, status=status.HTTP_404_NOT_FOUND)

        batch.metadata['column_mapping'] = column_mapping
        batch.status = 'preview'
        batch.save()

        return Response({'batch_id': batch.id, 'status': batch.status, 'column_mapping': column_mapping})

    @action(detail=False, methods=['post'])
    def validate(self, request, project_id=None):
        batch_id = request.data.get('batch_id')
        column_mapping = request.data.get('column_mapping')

        try:
            batch = ImportBatch.objects.get(id=batch_id, project_id=project_id)
        except ImportBatch.DoesNotExist:
            return Response({'detail': '批次不存在'}, status=status.HTTP_404_NOT_FOUND)

        file_path = batch.metadata.get('file_path')
        if not file_path or not os.path.exists(file_path):
            return Response({'detail': '文件已丢失，请重新上传'}, status=status.HTTP_400_BAD_REQUEST)

        # Use provided mapping or fallback to stored one
        mapping = column_mapping or batch.metadata.get('column_mapping') or batch.metadata.get('guessed_mapping')

        with open(file_path, 'rb') as f:
            result = parse_file_to_raw_rows(f, batch.file_name)

        parsed = apply_mapping(result['rows'], mapping, batch.import_type)

        # Run validation
        validator = ImportValidator(batch.import_type, parsed['rows'], mapping)
        checks, validation_errors = validator.validate()

        # Store validation errors
        ImportErrorRow.objects.filter(import_batch=batch).delete()
        for err in validation_errors:
            ImportErrorRow.objects.create(
                import_batch=batch,
                row_number=err.get('row_number') or 0,
                raw_data=err.get('raw_data', {}),
                error_type=err['error_type'],
                error_message=err['error_message'],
            )

        batch.status = 'validated'
        batch.parsed_rows = len(parsed['rows'])
        batch.error_rows_count = len(validation_errors)
        batch.validation_summary = {
            'checks': checks,
            'total_debit': str(sum(r.get('debit', 0) for r in parsed['rows'])),
            'total_credit': str(sum(r.get('credit', 0) for r in parsed['rows'])),
        }
        if batch.import_type == 'tb':
            batch.validation_summary['total_opening_debit'] = str(sum(r.get('opening_debit', 0) for r in parsed['rows']))
            batch.validation_summary['total_opening_credit'] = str(sum(r.get('opening_credit', 0) for r in parsed['rows']))
            batch.validation_summary['total_closing_debit'] = str(sum(r.get('closing_debit', 0) for r in parsed['rows']))
            batch.validation_summary['total_closing_credit'] = str(sum(r.get('closing_credit', 0) for r in parsed['rows']))
        batch.save()

        return Response({
            'batch_id': batch.id,
            'is_valid': len(validation_errors) == 0,
            'summary': {
                'total_rows': batch.total_rows,
                'parsed_rows': batch.parsed_rows,
                'error_rows': batch.error_rows_count,
            },
            'checks': checks,
            'errors': validation_errors,
        })

    @action(detail=False, methods=['post'])
    def commit(self, request, project_id=None):
        serializer = ImportCommitSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        batch_id = serializer.validated_data['batch_id']
        set_active = serializer.validated_data.get('set_active', True)

        try:
            batch = ImportBatch.objects.get(id=batch_id, project_id=project_id)
        except ImportBatch.DoesNotExist:
            return Response({'detail': '批次不存在'}, status=status.HTTP_404_NOT_FOUND)

        if batch.status != 'validated':
            return Response({'detail': '批次尚未校验或校验失败'}, status=status.HTTP_400_BAD_REQUEST)

        # Check unresolved errors
        unresolved = batch.import_errors.filter(is_resolved=False).count()
        if unresolved > 0:
            return Response({
                'detail': f'存在 {unresolved} 条未修正的错误，请先修正或确认忽略',
                'unresolved_errors': unresolved,
            }, status=status.HTTP_400_BAD_REQUEST)

        file_path = batch.metadata.get('file_path')
        mapping = batch.metadata.get('column_mapping') or batch.metadata.get('guessed_mapping')

        with open(file_path, 'rb') as f:
            result = parse_file_to_raw_rows(f, batch.file_name)

        parsed = apply_mapping(result['rows'], mapping, batch.import_type)

        # Handle overwrite mode
        if batch.overwrite_mode == 'replace':
            ImportBatch.objects.filter(
                project_id=project_id, period=batch.period
            ).exclude(id=batch.id).update(is_active=False)

        commit_batch(batch, parsed['rows'])

        if set_active:
            activate_batch(batch)
            recalculate_trial_balance(project_id)

        return Response({
            'batch_id': batch.id,
            'status': batch.status,
            'records_created': batch.parsed_rows,
            'is_active': batch.is_active,
            'trial_balance_recalculated': set_active,
        })


class ImportBatchViewSet(viewsets.ModelViewSet):
    permission_classes = [IsProjectMember]

    def get_queryset(self):
        return ImportBatch.objects.filter(project_id=self.kwargs['project_id'])

    def get_serializer_class(self):
        if self.action == 'list':
            return ImportBatchListSerializer
        return ImportBatchSerializer

    def perform_create(self, serializer):
        project = Project.objects.get(id=self.kwargs['project_id'])
        serializer.save(project=project, uploaded_by=self.request.user)

    @action(detail=True, methods=['post'])
    def set_active(self, request, project_id=None, pk=None):
        batch = self.get_object()
        activate_batch(batch)
        recalculate_trial_balance(project_id)
        return Response({'detail': '已设为当前激活版本', 'batch_id': batch.id})

    @action(detail=True, methods=['get'])
    def error_rows(self, request, project_id=None, pk=None):
        batch = self.get_object()
        rows = batch.import_errors.all()
        serializer = ImportErrorRowSerializer(rows, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def fix_error(self, request, project_id=None, pk=None):
        batch = self.get_object()
        row_id = request.data.get('row_id')
        resolved_data = request.data.get('resolved_data', {})

        try:
            error_row = ImportErrorRow.objects.get(id=row_id, import_batch=batch)
        except ImportErrorRow.DoesNotExist:
            return Response({'detail': '错误行不存在'}, status=status.HTTP_404_NOT_FOUND)

        error_row.resolved_data = resolved_data
        error_row.is_resolved = True
        error_row.save()

        return Response({'detail': '已修正', 'row_id': error_row.id})


class UnauditedTBViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = UnauditedTBSerializer
    permission_classes = [IsProjectMember]

    def get_queryset(self):
        return UnauditedTB.objects.filter(
            project_id=self.kwargs['project_id']
        ).select_related('import_batch')

    @action(detail=False, methods=['get'])
    def current(self, request, project_id=None):
        rows = UnauditedTB.objects.filter(
            project_id=project_id,
            import_batch__is_active=True,
        ).select_related('import_batch')
        serializer = self.get_serializer(rows, many=True)
        return Response(serializer.data)


class UnauditedJEViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = UnauditedJESerializer
    permission_classes = [IsProjectMember]

    def get_queryset(self):
        return UnauditedJE.objects.filter(
            project_id=self.kwargs['project_id']
        ).select_related('import_batch')

    @action(detail=False, methods=['get'])
    def current(self, request, project_id=None):
        rows = UnauditedJE.objects.filter(
            project_id=project_id,
            import_batch__is_active=True,
        ).select_related('import_batch')
        serializer = self.get_serializer(rows, many=True)
        return Response(serializer.data)
