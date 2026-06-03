from django.db import transaction
from apps.ledger.models import Account
from .models import ImportBatch, UnauditedTB, UnauditedJE


def get_next_version(project, period: str) -> int:
    """Get next version number for a project+period pair."""
    last = ImportBatch.objects.filter(project=project, period=period).order_by('-version').first()
    return (last.version + 1) if last else 1


@transaction.atomic
def activate_batch(batch: ImportBatch):
    """Activate a batch and deactivate others for the same project+period."""
    ImportBatch.objects.filter(
        project=batch.project, period=batch.period
    ).exclude(id=batch.id).update(is_active=False)
    batch.is_active = True
    batch.save(update_fields=['is_active'])


@transaction.atomic
def commit_batch(batch: ImportBatch, structured_rows: list[dict]):
    """Persist validated rows to UnauditedTB or UnauditedJE."""
    if batch.import_type == 'tb':
        for row in structured_rows:
            UnauditedTB.objects.create(
                project=batch.project,
                import_batch=batch,
                account_code=row['account_code'],
                account_name=row['account_name'],
                opening_debit=row['opening_debit'],
                opening_credit=row['opening_credit'],
                period_debit=row['period_debit'],
                period_credit=row['period_credit'],
                closing_debit=row['closing_debit'],
                closing_credit=row['closing_credit'],
                direction=row.get('direction', ''),
            )
            # Ensure account exists in chart of accounts
            Account.objects.get_or_create(
                project=batch.project,
                code=row['account_code'],
                defaults={'name': row['account_name'], 'category': 'asset'}
            )
    else:
        for row in structured_rows:
            UnauditedJE.objects.create(
                project=batch.project,
                import_batch=batch,
                voucher_date=row.get('voucher_date') or None,
                voucher_no=row.get('voucher_no', ''),
                line_no=row.get('line_no', 1),
                abstract=row.get('abstract', ''),
                account_code=row['account_code'],
                account_name=row.get('account_name', ''),
                debit=row['debit'],
                credit=row['credit'],
            )
            Account.objects.get_or_create(
                project=batch.project,
                code=row['account_code'],
                defaults={'name': row.get('account_name', ''), 'category': 'asset'}
            )

    batch.parsed_rows = len(structured_rows)
    batch.status = 'committed'
    batch.save(update_fields=['parsed_rows', 'status'])
