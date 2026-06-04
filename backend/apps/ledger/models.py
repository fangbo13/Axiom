from django.db import models
from common.models import TimestampedModel


class Account(models.Model):
    CATEGORY_CHOICES = [
        ('asset', '资产'),
        ('liability', '负债'),
        ('equity', '所有者权益'),
        ('revenue', '收入'),
        ('expense', '费用'),
    ]

    project = models.ForeignKey(
        'projects.Project',
        on_delete=models.CASCADE,
        related_name='accounts',
        verbose_name='项目'
    )
    code = models.CharField(max_length=50, verbose_name='科目代码')
    name = models.CharField(max_length=255, verbose_name='科目名称')
    category = models.CharField(
        max_length=20,
        choices=CATEGORY_CHOICES,
        default='asset',
        verbose_name='科目类别'
    )
    parent = models.ForeignKey(
        'self',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='children',
        verbose_name='上级科目'
    )

    class Meta:
        db_table = 'ledger_account'
        verbose_name = '会计科目'
        verbose_name_plural = '会计科目'
        unique_together = ['project', 'code']
        ordering = ['code']

    def __str__(self):
        return f"{self.code} - {self.name}"


class Currency(TimestampedModel):
    project = models.ForeignKey(
        'projects.Project',
        on_delete=models.CASCADE,
        related_name='currencies',
        verbose_name='项目'
    )
    code = models.CharField(max_length=10, verbose_name='币种代码')
    name = models.CharField(max_length=50, verbose_name='币种名称')
    is_base = models.BooleanField(default=False, verbose_name='是否本位币')
    exchange_rate = models.DecimalField(max_digits=18, decimal_places=6, default=1, verbose_name='汇率')

    class Meta:
        db_table = 'ledger_currency'
        verbose_name = '币种'
        verbose_name_plural = '币种'
        unique_together = ['project', 'code']
        ordering = ['code']

    def __str__(self):
        return f"{self.code} - {self.name}"


class LedgerEntry(TimestampedModel):
    project = models.ForeignKey(
        'projects.Project',
        on_delete=models.CASCADE,
        related_name='ledger_entries',
        verbose_name='项目'
    )
    account = models.ForeignKey(
        Account,
        on_delete=models.CASCADE,
        related_name='entries',
        verbose_name='科目'
    )
    period = models.CharField(max_length=20, verbose_name='期间')
    debit = models.DecimalField(max_digits=18, decimal_places=2, default=0, verbose_name='借方金额')
    credit = models.DecimalField(max_digits=18, decimal_places=2, default=0, verbose_name='贷方金额')
    description = models.TextField(blank=True, verbose_name='摘要')
    source_file = models.CharField(max_length=255, blank=True, verbose_name='来源文件')

    class Meta:
        db_table = 'ledger_entry'
        verbose_name = '账簿分录'
        verbose_name_plural = '账簿分录'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.account.code} | {self.period} | 借:{self.debit} 贷:{self.credit}"
