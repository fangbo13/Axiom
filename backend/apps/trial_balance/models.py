from django.db import models
from common.models import TimestampedModel


class TrialBalanceSnapshot(TimestampedModel):
    """Live trial balance reflecting imported data and adjustments."""
    project = models.ForeignKey(
        'projects.Project',
        on_delete=models.CASCADE,
        related_name='trial_balance',
        verbose_name='项目'
    )
    account = models.ForeignKey(
        'ledger.Account',
        on_delete=models.CASCADE,
        related_name='trial_balance_snapshots',
        verbose_name='科目'
    )
    opening_debit = models.DecimalField(max_digits=18, decimal_places=2, default=0, verbose_name='期初借方')
    opening_credit = models.DecimalField(max_digits=18, decimal_places=2, default=0, verbose_name='期初贷方')
    period_movement_debit = models.DecimalField(max_digits=18, decimal_places=2, default=0, verbose_name='本期借方发生额')
    period_movement_credit = models.DecimalField(max_digits=18, decimal_places=2, default=0, verbose_name='本期贷方发生额')
    adjusted_debit = models.DecimalField(max_digits=18, decimal_places=2, default=0, verbose_name='调整后借方')
    adjusted_credit = models.DecimalField(max_digits=18, decimal_places=2, default=0, verbose_name='调整后贷方')

    class Meta:
        db_table = 'trial_balance_snapshot'
        verbose_name = '试算平衡表'
        verbose_name_plural = '试算平衡表'
        unique_together = ['project', 'account']
        ordering = ['account__code']

    def __str__(self):
        return f"{self.account.code} | 借:{self.adjusted_debit} 贷:{self.adjusted_credit}"
