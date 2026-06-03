from decimal import Decimal
from django.db import transaction
from django.db.models import Sum
from apps.ledger.models import Account, LedgerEntry
from apps.trial_balance.models import TrialBalanceSnapshot
from .models import AdjustingEntry, AdjustmentLine


@transaction.atomic
def recalculate_trial_balance(project_id: int):
    """
    Recalculate the trial balance for a project by aggregating
    ledger entries and posted adjusting entries per account.
    """
    # 1. Aggregate ledger entries per account
    ledger_sums = LedgerEntry.objects.filter(project_id=project_id).values('account').annotate(
        total_debit=Sum('debit'),
        total_credit=Sum('credit')
    )
    ledger_map = {
        item['account']: {
            'debit': item['total_debit'] or Decimal('0'),
            'credit': item['total_credit'] or Decimal('0'),
        }
        for item in ledger_sums
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
        ledger_debit = ledger_map.get(account.id, {}).get('debit', Decimal('0'))
        ledger_credit = ledger_map.get(account.id, {}).get('credit', Decimal('0'))
        adj_debit = adjustment_map.get(account.id, {}).get('debit', Decimal('0'))
        adj_credit = adjustment_map.get(account.id, {}).get('credit', Decimal('0'))

        adjusted_debit = ledger_debit + adj_debit
        adjusted_credit = ledger_credit + adj_credit

        total_debit += adjusted_debit
        total_credit += adjusted_credit

        TrialBalanceSnapshot.objects.update_or_create(
            project_id=project_id,
            account=account,
            defaults={
                'period_movement_debit': ledger_debit,
                'period_movement_credit': ledger_credit,
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
