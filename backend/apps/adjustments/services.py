from decimal import Decimal
from django.db import transaction
from django.db.models import Sum
from apps.ledger.models import Account
from apps.imports.models import ImportBatch, UnauditedTB
from apps.trial_balance.models import TrialBalanceSnapshot
from .models import AdjustmentLine


@transaction.atomic
def recalculate_trial_balance(project_id: int):
    """
    Recalculate the trial balance for a project by aggregating
    the active unaudited TB and posted adjusting entries per account.
    """
    # 1. Get active unaudited TB rows
    active_batch = ImportBatch.objects.filter(
        project_id=project_id, is_active=True, import_type='tb'
    ).first()

    tb_map = {}
    if active_batch:
        for row in active_batch.tb_rows.all():
            tb_map[row.account_code] = {
                'opening_debit': row.opening_debit,
                'opening_credit': row.opening_credit,
                'period_debit': row.period_debit,
                'period_credit': row.period_credit,
            }

    # 2. Aggregate posted adjustment lines per account
    adjustment_sums = AdjustmentLine.objects.filter(
        entry__project_id=project_id,
        entry__status='posted'
    ).values('account').annotate(
        total_debit=Sum('debit'),
        total_credit=Sum('credit')
    )
    adjustment_map = {
        item['account']: {
            'debit': item['total_debit'] or Decimal('0'),
            'credit': item['total_credit'] or Decimal('0'),
        }
        for item in adjustment_sums
    }

    # 3. Get all accounts for the project
    accounts = Account.objects.filter(project_id=project_id)

    total_debit = Decimal('0')
    total_credit = Decimal('0')

    for account in accounts:
        tb_data = tb_map.get(account.code, {})
        opening_debit = tb_data.get('opening_debit', Decimal('0'))
        opening_credit = tb_data.get('opening_credit', Decimal('0'))
        period_debit = tb_data.get('period_debit', Decimal('0'))
        period_credit = tb_data.get('period_credit', Decimal('0'))

        adj_debit = adjustment_map.get(account.id, {}).get('debit', Decimal('0'))
        adj_credit = adjustment_map.get(account.id, {}).get('credit', Decimal('0'))

        adjusted_debit = opening_debit + period_debit + adj_debit
        adjusted_credit = opening_credit + period_credit + adj_credit

        total_debit += adjusted_debit
        total_credit += adjusted_credit

        TrialBalanceSnapshot.objects.update_or_create(
            project_id=project_id,
            account=account,
            defaults={
                'opening_debit': opening_debit,
                'opening_credit': opening_credit,
                'period_movement_debit': period_debit,
                'period_movement_credit': period_credit,
                'adjusted_debit': adjusted_debit,
                'adjusted_credit': adjusted_credit,
            }
        )

    # 4. Verify balance
    if total_debit != total_credit:
        raise ValueError(
            f'试算平衡不平衡: 借方合计 {total_debit} != 贷方合计 {total_credit}'
        )

    return {
        'total_debit': float(total_debit),
        'total_credit': float(total_credit),
        'accounts_updated': accounts.count(),
    }
