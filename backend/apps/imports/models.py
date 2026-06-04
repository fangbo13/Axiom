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
        ('processing', '处理中'),
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
    warning_rows_count = models.PositiveIntegerField(default=0, verbose_name='警告行数')
    metadata = models.JSONField(default=dict, blank=True, verbose_name='元数据')
    validation_summary = models.JSONField(default=dict, blank=True, verbose_name='校验摘要')

    class Meta:
        db_table = 'imports_batch'
        ordering = ['-created_at']
        verbose_name = '导入批次'
        verbose_name_plural = '导入批次'
        unique_together = ['project', 'period', 'import_type', 'version']
        index_together = ['project', 'period', 'import_type', 'is_active']

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
    # 多币种字段
    currency_code = models.CharField(max_length=10, blank=True, verbose_name='币种代码')
    foreign_opening_debit = models.DecimalField(max_digits=18, decimal_places=2, default=0, verbose_name='原币期初借方')
    foreign_opening_credit = models.DecimalField(max_digits=18, decimal_places=2, default=0, verbose_name='原币期初贷方')
    foreign_period_debit = models.DecimalField(max_digits=18, decimal_places=2, default=0, verbose_name='原币本期借方')
    foreign_period_credit = models.DecimalField(max_digits=18, decimal_places=2, default=0, verbose_name='原币本期贷方')
    foreign_closing_debit = models.DecimalField(max_digits=18, decimal_places=2, default=0, verbose_name='原币期末借方')
    foreign_closing_credit = models.DecimalField(max_digits=18, decimal_places=2, default=0, verbose_name='原币期末贷方')
    exchange_rate = models.DecimalField(max_digits=18, decimal_places=6, default=1, verbose_name='汇率')
    direction_inferred = models.CharField(max_length=10, choices=DIRECTION_CHOICES, blank=True, verbose_name='系统推断方向')
    direction_conflict = models.BooleanField(default=False, verbose_name='方向冲突标记')
    closing_balance_delta = models.DecimalField(max_digits=18, decimal_places=2, default=0, verbose_name='期末计算差异')

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
    # 多币种字段
    currency_code = models.CharField(max_length=10, blank=True, verbose_name='币种代码')
    foreign_debit = models.DecimalField(max_digits=18, decimal_places=2, default=0, verbose_name='原币借方')
    foreign_credit = models.DecimalField(max_digits=18, decimal_places=2, default=0, verbose_name='原币贷方')
    exchange_rate = models.DecimalField(max_digits=18, decimal_places=6, default=1, verbose_name='汇率')

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
        ('direction_mismatch', '方向异常'),
        ('closing_calculation', '期末计算差异'),
        ('foreign_currency', '外币校验异常'),
        ('mapping', '映射问题'),
        ('other', '其他'),
    ]
    SEVERITY_CHOICES = [
        ('error', '错误'),
        ('warning', '警告'),
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
    severity = models.CharField(max_length=10, choices=SEVERITY_CHOICES, default='error', verbose_name='严重程度')
    is_resolved = models.BooleanField(default=False, verbose_name='已解决')
    resolved_data = models.JSONField(default=dict, blank=True, null=True, verbose_name='修正后数据')

    class Meta:
        db_table = 'imports_error_row'
        ordering = ['row_number']
        verbose_name = '导入错误行'
        verbose_name_plural = '导入错误行'

    def __str__(self):
        return f"第{self.row_number}行 {self.error_type}"


class MappingTemplate(TimestampedModel):
    project = models.ForeignKey(
        'projects.Project',
        on_delete=models.CASCADE,
        related_name='mapping_templates',
        verbose_name='项目'
    )
    name = models.CharField(max_length=100, verbose_name='模板名称')
    import_type = models.CharField(max_length=10, choices=ImportBatch.IMPORT_TYPE_CHOICES, verbose_name='导入类型')
    file_extensions = models.JSONField(default=list, blank=True, verbose_name='适用文件扩展名')
    header_signature = models.JSONField(default=dict, blank=True, verbose_name='表头特征指纹')
    column_mapping = models.JSONField(default=dict, blank=True, verbose_name='列映射关系')
    is_auto_saved = models.BooleanField(default=False, verbose_name='自动保存')

    class Meta:
        db_table = 'imports_mapping_template'
        ordering = ['-created_at']
        verbose_name = '映射模板'
        verbose_name_plural = '映射模板'

    def __str__(self):
        return self.name


class ImportLog(TimestampedModel):
    ACTION_CHOICES = [
        ('upload', '上传'),
        ('map', '映射'),
        ('validate', '校验'),
        ('commit', '提交'),
        ('delete', '删除'),
        ('activate', '激活'),
        ('remap', '重新映射'),
        ('export_errors', '导出错误'),
    ]

    project = models.ForeignKey(
        'projects.Project',
        on_delete=models.CASCADE,
        related_name='import_logs',
        verbose_name='项目'
    )
    import_batch = models.ForeignKey(
        ImportBatch,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='logs',
        verbose_name='导入批次'
    )
    action = models.CharField(max_length=20, choices=ACTION_CHOICES, verbose_name='操作类型')
    performed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        verbose_name='操作人'
    )
    details = models.JSONField(default=dict, blank=True, verbose_name='详情')

    class Meta:
        db_table = 'imports_log'
        ordering = ['-created_at']
        verbose_name = '导入日志'
        verbose_name_plural = '导入日志'

    def __str__(self):
        return f"{self.action} {self.import_batch or ''}"
