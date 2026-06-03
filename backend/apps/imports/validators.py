from decimal import Decimal


class ImportValidator:
    def __init__(self, import_type: str, rows: list[dict], column_mapping: dict = None):
        self.import_type = import_type
        self.rows = rows
        self.column_mapping = column_mapping or {}
        self.errors = []
        self.checks = {}

    def validate(self):
        if self.import_type == 'tb':
            self._validate_tb()
        else:
            self._validate_je()
        return self.checks, self.errors

    def _validate_tb(self):
        # 1. Auto-balance: sum(closing_debit) == sum(closing_credit)
        total_closing_debit = Decimal('0')
        total_closing_credit = Decimal('0')
        for row in self.rows:
            total_closing_debit += row.get('closing_debit', Decimal('0'))
            total_closing_credit += row.get('closing_credit', Decimal('0'))

        auto_balance = total_closing_debit == total_closing_credit
        self.checks['auto_balance'] = {
            'passed': auto_balance,
            'message': f'期末借方合计 {total_closing_debit} vs 期末贷方合计 {total_closing_credit}'
        }
        if not auto_balance:
            self.errors.append({
                'row_number': None,
                'error_type': 'balance',
                'error_message': f'期末借方合计({total_closing_debit}) != 期末贷方合计({total_closing_credit})',
                'raw_data': {},
            })

        # 2. Account code format & duplicates
        seen_codes = set()
        for idx, row in enumerate(self.rows):
            row_num = idx + 2
            code = row.get('account_code', '')
            if not code:
                self.errors.append({
                    'row_number': row_num,
                    'error_type': 'format',
                    'error_message': '科目代码为空',
                    'raw_data': row,
                })
                continue

            # Simple numeric-ish check
            cleaned = str(code).replace('.', '')
            if not cleaned.isdigit():
                self.errors.append({
                    'row_number': row_num,
                    'error_type': 'format',
                    'error_message': f'科目编码 "{code}" 包含非数字字符',
                    'raw_data': row,
                })

            if code in seen_codes:
                self.errors.append({
                    'row_number': row_num,
                    'error_type': 'duplicate',
                    'error_message': f'科目编码 "{code}" 重复',
                    'raw_data': row,
                })
            seen_codes.add(code)

        self.checks['account_code_format'] = {
            'passed': all(e['error_type'] != 'format' for e in self.errors),
            'message': '科目编码格式检查'
        }
        self.checks['duplicate_accounts'] = {
            'passed': all(e['error_type'] != 'duplicate' for e in self.errors),
            'message': '重复科目检查'
        }

        # 3. Period consistency: opening + movement = closing per row
        consistency_errors = []
        for idx, row in enumerate(self.rows):
            row_num = idx + 2
            opening = row.get('opening_debit', Decimal('0')) - row.get('opening_credit', Decimal('0'))
            movement = row.get('period_debit', Decimal('0')) - row.get('period_credit', Decimal('0'))
            closing = row.get('closing_debit', Decimal('0')) - row.get('closing_credit', Decimal('0'))
            if opening + movement != closing:
                consistency_errors.append({
                    'row_number': row_num,
                    'error_type': 'consistency',
                    'error_message': f'期间不一致: 期初({opening}) + 发生({movement}) != 期末({closing})',
                    'raw_data': row,
                })

        self.checks['period_consistency'] = {
            'passed': len(consistency_errors) == 0,
            'message': f'期间一致性检查: {len(consistency_errors)} 行异常'
        }
        self.errors.extend(consistency_errors)

    def _validate_je(self):
        # 1. Auto-balance: sum(debit) == sum(credit)
        total_debit = Decimal('0')
        total_credit = Decimal('0')
        for row in self.rows:
            total_debit += row.get('debit', Decimal('0'))
            total_credit += row.get('credit', Decimal('0'))

        auto_balance = total_debit == total_credit
        self.checks['auto_balance'] = {
            'passed': auto_balance,
            'message': f'借方合计 {total_debit} vs 贷方合计 {total_credit}'
        }
        if not auto_balance:
            self.errors.append({
                'row_number': None,
                'error_type': 'balance',
                'error_message': f'借方合计({total_debit}) != 贷方合计({total_credit})',
                'raw_data': {},
            })

        # 2. Account code format
        for idx, row in enumerate(self.rows):
            row_num = idx + 2
            code = row.get('account_code', '')
            if not code:
                self.errors.append({
                    'row_number': row_num,
                    'error_type': 'format',
                    'error_message': '科目代码为空',
                    'raw_data': row,
                })
                continue
            cleaned = str(code).replace('.', '')
            if not cleaned.isdigit():
                self.errors.append({
                    'row_number': row_num,
                    'error_type': 'format',
                    'error_message': f'科目编码 "{code}" 包含非数字字符',
                    'raw_data': row,
                })

        self.checks['account_code_format'] = {
            'passed': all(e['error_type'] != 'format' for e in self.errors),
            'message': '科目编码格式检查'
        }

        # 3. Voucher uniqueness (warn only for MVP)
        seen_vouchers = set()
        dup_errors = []
        for idx, row in enumerate(self.rows):
            row_num = idx + 2
            key = (row.get('voucher_no'), row.get('line_no'))
            if key in seen_vouchers and key[0]:
                dup_errors.append({
                    'row_number': row_num,
                    'error_type': 'duplicate',
                    'error_message': f'凭证号+行号重复: {key}',
                    'raw_data': row,
                })
            seen_vouchers.add(key)

        self.checks['voucher_uniqueness'] = {
            'passed': len(dup_errors) == 0,
            'message': f'凭证唯一性检查: {len(dup_errors)} 行异常'
        }
        self.errors.extend(dup_errors)
