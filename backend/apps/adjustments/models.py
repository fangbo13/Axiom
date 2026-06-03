from django.db import models
from django.conf import settings
from common.models import TimestampedModel


class AdjustingEntry(TimestampedModel):
    STATUS_CHOICES = [
        ('proposed', '待提议'),
        ('approved', '已批准'),
        ('posted', '已过账'),
        ('rejected', '已驳回'),
    ]

    project = models.ForeignKey(
        'projects.Project',
        on_delete=models.CASCADE,
        related_name='adjusting_entries',
        verbose_name='项目'
    )
    entry_number = models.CharField(max_length=50, verbose_name='分录编号')
    description = models.TextField(verbose_name='说明')
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='proposed',
        verbose_name='状态'
    )
    prepared_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='prepared_entries',
        verbose_name='编制人'
    )
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='reviewed_entries',
        verbose_name='复核人'
    )

    class Meta:
        db_table = 'adjustments_adjustingentry'
        verbose_name = '调整分录'
        verbose_name_plural = '调整分录'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.entry_number} - {self.description[:30]}"


class AdjustmentLine(models.Model):
    entry = models.ForeignKey(
        AdjustingEntry,
        on_delete=models.CASCADE,
        related_name='lines',
        verbose_name='调整分录'
    )
    account = models.ForeignKey(
        'ledger.Account',
        on_delete=models.CASCADE,
        related_name='adjustment_lines',
        verbose_name='科目'
    )
    debit = models.DecimalField(max_digits=18, decimal_places=2, default=0, verbose_name='借方金额')
    credit = models.DecimalField(max_digits=18, decimal_places=2, default=0, verbose_name='贷方金额')

    class Meta:
        db_table = 'adjustments_adjustmentline'
        verbose_name = '调整分录行'
        verbose_name_plural = '调整分录行'

    def __str__(self):
        return f"{self.account.code} 借:{self.debit} 贷:{self.credit}"
