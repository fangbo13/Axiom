from django.conf import settings
from django.db import models
from common.models import TimestampedModel


class ImportBatch(TimestampedModel):
    STATUS_CHOICES = [
        ('uploaded', '已上传'),
        ('preview', '预览中'),
        ('validated', '已校验'),
        ('committed', '已入库'),
        ('failed', '失败'),
    ]
    IMPORT_TYPE_CHOICES = [
        ('tb', '科目余额表'),
        ('je', '序时账'),
    ]
    OVERWRITE_MODE_CHOICES = [
        ('append', '追加'),
        ('replace', '覆盖'),
    ]

    project = models.ForeignKey(
        'projects.Project',
        on_delete=models.CASCADE,
        related_name='import_batches',
        verbose_name='项目'
    )
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        verbose_name='上传人'
    )
    file_name = models.CharField(max_length=255, verbose_name='文件名')
    import_type = models.CharField(max_length=10, choices=IMPORT_TYPE_CHOICES, verbose_name='导入类型')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='uploaded', verbose_name='状态')
    overwrite_mode = models.CharField(max_length=10, choices=OVERWRITE_MODE_CHOICES, default='append', verbose_name='覆盖模式')
    period = models.CharField(max_length=20, blank=True, verbose_name='会计期间')
    version = models.PositiveIntegerField(default=1, verbose_name='版本号')
    is_active = models.BooleanField(default=False, verbose_name='是否激活')
    total_rows = models.PositiveIntegerField(default=0, verbose_name='总行数')
    parsed_rows = models.PositiveIntegerField(default=0, verbose_name='解析行数')
    error_rows_count = models.PositiveIntegerField(default=0, verbose_name='错误行数')
    metadata = models.JSONField(default=dict, blank=True, verbose_name='元数据')
    validation_summary = models.JSONField(default=dict, blank=True, verbose_name='校验摘要')

    class Meta:
        db_table = 'imports_batch'
        ordering = ['-created_at']
        verbose_name = '导入批次'
        verbose_name_plural = '导入批次'
        unique_together = ['project', 'period', 'version']

    def __str__(self):
        return f"{self.file_name} (v{self.version})"


class UnauditedTB(TimestampedModel):
    DIRECTION_CHOICES = [
        ('debit', '借'),
        ('credit', '贷'),
    ]

    project = models.ForeignKey(
        'projects.Project',
        on_delete=models.CASCADE,
        related_name='unaudited_tbs',
        verbose_name='项目'
    )
    import_batch = models.ForeignKey(
        ImportBatch,
        on_delete=models.CASCADE,
        related_name='tb_rows',
        verbose_name='导入批次'
    )
    account_code = models.CharField(max_length=50, db_index=True, verbose_name='科目编码')
    account_name = models.CharField(max_length=255, verbose_name='科目名称')
    opening_debit = models.DecimalField(max_digits=18, decimal_places=2, default=0, verbose_name='期初借方')
    opening_credit = models.DecimalField(max_digits=18, decimal_places=2, default=0, verbose_name='期初贷方')
    period_debit = models.DecimalField(max_digits=18, decimal_places=2, default=0, verbose_name='本期借方')
    period_credit = models.DecimalField(max_digits=18, decimal_places=2, default=0, verbose_name='本期贷方')
    closing_debit = models.DecimalField(max_digits=18, decimal_places=2, default=0, verbose_name='期末借方')
    closing_credit = models.DecimalField(max_digits=18, decimal_places=2, default=0, verbose_name='期末贷方')
    direction = models.CharField(max_length=10, choices=DIRECTION_CHOICES, blank=True, verbose_name='余额方向')

    class Meta:
        db_table = 'imports_unaudited_tb'
        ordering = ['account_code']
        verbose_name = '未审科目余额表'
        verbose_name_plural = '未审科目余额表'
        unique_together = ['import_batch', 'account_code']

    def __str__(self):
        return f"{self.account_code} {self.account_name}"


class UnauditedJE(TimestampedModel):
    project = models.ForeignKey(
        'projects.Project',
        on_delete=models.CASCADE,
        related_name='unaudited_jes',
        verbose_name='项目'
    )
    import_batch = models.ForeignKey(
        ImportBatch,
        on_delete=models.CASCADE,
        related_name='je_rows',
        verbose_name='导入批次'
    )
    voucher_date = models.DateField(null=True, blank=True, verbose_name='凭证日期')
    voucher_no = models.CharField(max_length=50, blank=True, db_index=True, verbose_name='凭证号')
    line_no = models.PositiveIntegerField(default=1, verbose_name='行号')
    abstract = models.TextField(blank=True, verbose_name='摘要')
    account_code = models.CharField(max_length=50, db_index=True, verbose_name='科目编码')
    account_name = models.CharField(max_length=255, blank=True, verbose_name='科目名称')
    debit = models.DecimalField(max_digits=18, decimal_places=2, default=0, verbose_name='借方')
    credit = models.DecimalField(max_digits=18, decimal_places=2, default=0, verbose_name='贷方')
    aux_fields = models.JSONField(default=dict, blank=True, verbose_name='辅助核算')

    class Meta:
        db_table = 'imports_unaudited_je'
        ordering = ['voucher_date', 'voucher_no', 'line_no']
        verbose_name = '未审序时账'
        verbose_name_plural = '未审序时账'

    def __str__(self):
        return f"{self.voucher_no}-{self.line_no} {self.account_code}"


class ImportErrorRow(TimestampedModel):
    ERROR_TYPE_CHOICES = [
        ('format', '格式错误'),
        ('balance', '不平衡'),
        ('duplicate', '重复科目'),
        ('consistency', '期间不一致'),
        ('other', '其他'),
    ]

    import_batch = models.ForeignKey(
        ImportBatch,
        on_delete=models.CASCADE,
        related_name='import_errors',
        verbose_name='导入批次'
    )
    row_number = models.PositiveIntegerField(verbose_name='行号')
    raw_data = models.JSONField(default=dict, verbose_name='原始数据')
    error_type = models.CharField(max_length=20, choices=ERROR_TYPE_CHOICES, verbose_name='错误类型')
    error_message = models.TextField(verbose_name='错误信息')
    is_resolved = models.BooleanField(default=False, verbose_name='已解决')
    resolved_data = models.JSONField(default=dict, blank=True, null=True, verbose_name='修正后数据')

    class Meta:
        db_table = 'imports_error_row'
        ordering = ['row_number']
        verbose_name = '导入错误行'
        verbose_name_plural = '导入错误行'

    def __str__(self):
        return f"第{self.row_number}行 {self.error_type}"
