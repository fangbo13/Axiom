import random
from decimal import Decimal, InvalidOperation


def get_sample_rows(raw_rows: list[dict], count: int = 100, random_samples: int = 10):
    """Get first N rows plus random samples from middle/end."""
    first_n = raw_rows[:count]
    remaining = raw_rows[count:]
    samples = []
    if remaining and random_samples > 0:
        samples = random.sample(remaining, min(random_samples, len(remaining)))
    return first_n, samples


def apply_mapping(raw_rows: list[dict], column_mapping: dict, import_type: str):
    """
    Transform raw rows into structured data using confirmed column mapping.
    Returns {
        'rows': [...],
        'errors': [{'row': int, 'error': str}],
    }
    """
    rows = []
    errors = []

    for idx, raw in enumerate(raw_rows):
        row_num = idx + 2
        mapped = {}

        for std_key, source_col in column_mapping.items():
            mapped[std_key] = raw.get(source_col, '')

        if import_type == 'tb':
            account_code = str(mapped.get('account_code', '') or '').strip()
            account_name = str(mapped.get('account_name', '') or '').strip()

            if not account_code:
                errors.append({'row': row_num, 'error': '科目代码为空'})
                continue

            try:
                opening_debit = _to_decimal(mapped.get('opening_debit'))
                opening_credit = _to_decimal(mapped.get('opening_credit'))
                period_debit = _to_decimal(mapped.get('period_debit'))
                period_credit = _to_decimal(mapped.get('period_credit'))
                closing_debit = _to_decimal(mapped.get('closing_debit'))
                closing_credit = _to_decimal(mapped.get('closing_credit'))
            except (InvalidOperation, ValueError):
                errors.append({'row': row_num, 'error': '金额格式错误'})
                continue

            direction = str(mapped.get('direction', '') or '').strip()
            if direction in ['借', '借方', 'debit', 'dr']:
                direction = 'debit'
            elif direction in ['贷', '贷方', 'credit', 'cr']:
                direction = 'credit'
            else:
                direction = ''

            # 多币种字段
            currency = str(mapped.get('currency', '') or '').strip()
            foreign_opening_debit = _to_decimal(mapped.get('foreign_opening_debit'))
            foreign_opening_credit = _to_decimal(mapped.get('foreign_opening_credit'))
            foreign_period_debit = _to_decimal(mapped.get('foreign_period_debit'))
            foreign_period_credit = _to_decimal(mapped.get('foreign_period_credit'))
            foreign_closing_debit = _to_decimal(mapped.get('foreign_closing_debit'))
            foreign_closing_credit = _to_decimal(mapped.get('foreign_closing_credit'))
            exchange_rate = _to_decimal(mapped.get('exchange_rate'), default=Decimal('1'))

            rows.append({
                'account_code': account_code,
                'account_name': account_name,
                'opening_debit': opening_debit,
                'opening_credit': opening_credit,
                'period_debit': period_debit,
                'period_credit': period_credit,
                'closing_debit': closing_debit,
                'closing_credit': closing_credit,
                'direction': direction,
                'currency': currency,
                'foreign_opening_debit': foreign_opening_debit,
                'foreign_opening_credit': foreign_opening_credit,
                'foreign_period_debit': foreign_period_debit,
                'foreign_period_credit': foreign_period_credit,
                'foreign_closing_debit': foreign_closing_debit,
                'foreign_closing_credit': foreign_closing_credit,
                'exchange_rate': exchange_rate,
            })
        else:
            # JE type
            account_code = str(mapped.get('account_code', '') or '').strip()
            if not account_code:
                errors.append({'row': row_num, 'error': '科目代码为空'})
                continue

            try:
                debit = _to_decimal(mapped.get('debit'))
                credit = _to_decimal(mapped.get('credit'))
            except (InvalidOperation, ValueError):
                errors.append({'row': row_num, 'error': '金额格式错误'})
                continue

            voucher_date = mapped.get('voucher_date', '') or ''
            voucher_no = str(mapped.get('voucher_no', '') or '').strip()
            line_no = _to_int(mapped.get('line_no'), default=1)
            abstract = str(mapped.get('abstract', '') or '').strip()
            account_name = str(mapped.get('account_name', '') or '').strip()

            # 多币种与辅助核算
            currency = str(mapped.get('currency', '') or '').strip()
            foreign_debit = _to_decimal(mapped.get('foreign_debit'))
            foreign_credit = _to_decimal(mapped.get('foreign_credit'))
            exchange_rate = _to_decimal(mapped.get('exchange_rate'), default=Decimal('1'))

            aux_fields = {}
            for aux_key in ['department', 'customer', 'supplier']:
                if aux_key in mapped:
                    val = str(mapped.get(aux_key, '') or '').strip()
                    if val:
                        aux_fields[aux_key] = val

            rows.append({
                'voucher_date': voucher_date,
                'voucher_no': voucher_no,
                'line_no': line_no,
                'abstract': abstract,
                'account_code': account_code,
                'account_name': account_name,
                'debit': debit,
                'credit': credit,
                'currency': currency,
                'foreign_debit': foreign_debit,
                'foreign_credit': foreign_credit,
                'exchange_rate': exchange_rate,
                'aux_fields': aux_fields,
            })

    return {'rows': rows, 'errors': errors}


def _to_decimal(value, default=Decimal('0')):
    if value is None or value == '':
        return default
    val = str(value).strip()
    # Handle parentheses notation for negative numbers: (1,000.00) => -1000.00
    is_negative = val.startswith('(') and val.endswith(')')
    if is_negative:
        val = val[1:-1]
    val = val.replace(',', '').replace('，', '')
    if val == '' or val == '-':
        return default
    if is_negative:
        val = '-' + val
    return Decimal(val or '0')


def _to_int(value, default=0):
    if value is None or value == '':
        return default
    try:
        return int(str(value).strip())
    except (ValueError, TypeError):
        return default
