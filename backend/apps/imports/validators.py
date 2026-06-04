from decimal import Decimal
from apps.ledger.models import Account


def _convert_decimals(obj):
    """Recursively convert Decimal values to float for JSON serialization."""
    if isinstance(obj, Decimal):
        return float(obj)
    if isinstance(obj, dict):
        return {k: _convert_decimals(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_convert_decimals(v) for v in obj]
    return obj


class ImportValidator:
    def __init__(self, import_type: str, rows: list[dict], column_mapping: dict = None, project_id: int = None):
        self.import_type = import_type
        self.rows = rows
        self.column_mapping = column_mapping or {}
        self.project_id = project_id
        self.errors = []
        self.warnings = []
        self.checks = {}

    def validate(self):
        if self.import_type == 'tb':
            self._validate_tb()
        else:
            self._validate_je()
        return self.checks, self.errors, self.warnings

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
                'severity': 'error',
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
                    'severity': 'error',
                })
                continue

            cleaned = str(code).strip()
            if not cleaned:
                self.errors.append({
                    'row_number': row_num,
                    'error_type': 'format',
                    'error_message': f'科目编码 "{code}" 为空',
                    'raw_data': row,
                    'severity': 'error',
                })

            if code in seen_codes:
                self.errors.append({
                    'row_number': row_num,
                    'error_type': 'duplicate',
                    'error_message': f'科目编码 "{code}" 重复',
                    'raw_data': row,
                    'severity': 'error',
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
                    'severity': 'warning',
                })

        self.checks['period_consistency'] = {
            'passed': len(consistency_errors) == 0,
            'message': f'期间一致性检查: {len(consistency_errors)} 行异常'
        }
        self.warnings.extend(consistency_errors)

        # 4. Direction inference and conflict detection
        direction_warnings = []
        for idx, row in enumerate(self.rows):
            row_num = idx + 2
            code = row.get('account_code', '')
            # Infer direction
            file_dir = str(row.get('direction', '')).strip().lower()
            if file_dir in ['debit', 'credit', '借', '贷', '借方', '贷方']:
                inferred_dir = 'debit' if file_dir in ['debit', '借', '借方'] else 'credit'
            else:
                closing_net = row.get('closing_debit', Decimal('0')) - row.get('closing_credit', Decimal('0'))
                inferred_dir = 'debit' if closing_net >= 0 else 'credit'

            # Check conflict against account category
            try:
                account = Account.objects.get(project_id=self.project_id, code=code)
                category = account.category
                conflict = False
                if category in ('asset', 'expense') and inferred_dir == 'credit':
                    conflict = True
                elif category in ('liability', 'equity', 'revenue') and inferred_dir == 'debit':
                    conflict = True

                if conflict:
                    direction_warnings.append({
                        'row_number': row_num,
                        'error_type': 'direction_mismatch',
                        'error_message': f'科目 {code}({account.name}) 为{self._category_name(category)}，但余额方向为{self._dir_name(inferred_dir)}，可能存在异常',
                        'raw_data': row,
                        'severity': 'warning',
                    })
            except Account.DoesNotExist:
                pass

        self.checks['direction_check'] = {
            'passed': len(direction_warnings) == 0,
            'message': f'方向异常检查: {len(direction_warnings)} 行警告'
        }
        self.warnings.extend(direction_warnings)

        # 5. Closing balance calculation check
        closing_calc_warnings = []
        for idx, row in enumerate(self.rows):
            row_num = idx + 2
            opening = row.get('opening_debit', Decimal('0')) - row.get('opening_credit', Decimal('0'))
            movement = row.get('period_debit', Decimal('0')) - row.get('period_credit', Decimal('0'))
            expected_closing = opening + movement
            actual_closing = row.get('closing_debit', Decimal('0')) - row.get('closing_credit', Decimal('0'))
            delta = abs(expected_closing - actual_closing)
            if delta > Decimal('0.01'):
                closing_calc_warnings.append({
                    'row_number': row_num,
                    'error_type': 'closing_calculation',
                    'error_message': f'期末计算差异: 期望期末({expected_closing}) vs 实际期末({actual_closing}), 差异={delta}',
                    'raw_data': row,
                    'severity': 'warning',
                })

        self.checks['closing_calculation'] = {
            'passed': len(closing_calc_warnings) == 0,
            'message': f'期末计算校验: {len(closing_calc_warnings)} 行差异'
        }
        self.warnings.extend(closing_calc_warnings)

        # 6. Foreign currency check
        if any(row.get('currency') for row in self.rows):
            fc_warnings = []
            for idx, row in enumerate(self.rows):
                row_num = idx + 2
                currency = row.get('currency', '')
                if not currency:
                    continue
                rate = row.get('exchange_rate', Decimal('1'))
                # Check foreign closing vs functional closing
                foreign_closing = row.get('foreign_closing_debit', Decimal('0')) - row.get('foreign_closing_credit', Decimal('0'))
                functional_closing = row.get('closing_debit', Decimal('0')) - row.get('closing_credit', Decimal('0'))
                if rate and foreign_closing != 0:
                    expected_functional = foreign_closing * rate
                    if abs(expected_functional - functional_closing) > Decimal('0.01'):
                        fc_warnings.append({
                            'row_number': row_num,
                            'error_type': 'foreign_currency',
                            'error_message': f'本位币折算差异: 原币期末({foreign_closing}) * 汇率({rate}) = {expected_functional}, 实际本位币期末={functional_closing}',
                            'raw_data': row,
                            'severity': 'warning',
                        })
            self.checks['foreign_currency'] = {
                'passed': len(fc_warnings) == 0,
                'message': f'外币校验: {len(fc_warnings)} 行差异'
            }
            self.warnings.extend(fc_warnings)

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
                'severity': 'error',
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
                    'severity': 'error',
                })
                continue
            cleaned = str(code).strip()
            if not cleaned:
                self.errors.append({
                    'row_number': row_num,
                    'error_type': 'format',
                    'error_message': f'科目编码 "{code}" 为空',
                    'raw_data': row,
                    'severity': 'error',
                })

        self.checks['account_code_format'] = {
            'passed': all(e['error_type'] != 'format' for e in self.errors),
            'message': '科目编码格式检查'
        }

        # 3. Voucher uniqueness
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
                    'severity': 'error',
                })
            seen_vouchers.add(key)

        self.checks['voucher_uniqueness'] = {
            'passed': len(dup_errors) == 0,
            'message': f'凭证唯一性检查: {len(dup_errors)} 行异常'
        }
        self.errors.extend(dup_errors)

        # 4. Foreign currency check for JE
        if any(row.get('currency') for row in self.rows):
            fc_warnings = []
            for idx, row in enumerate(self.rows):
                row_num = idx + 2
                currency = row.get('currency', '')
                if not currency:
                    continue
                rate = row.get('exchange_rate', Decimal('1'))
                foreign_debit = row.get('foreign_debit', Decimal('0'))
                foreign_credit = row.get('foreign_credit', Decimal('0'))
                debit = row.get('debit', Decimal('0'))
                credit = row.get('credit', Decimal('0'))
                if rate:
                    if foreign_debit and abs(foreign_debit * rate - debit) > Decimal('0.01'):
                        fc_warnings.append({
                            'row_number': row_num,
                            'error_type': 'foreign_currency',
                            'error_message': f'借方本位币折算差异: 原币借方({foreign_debit}) * 汇率({rate}) = {foreign_debit * rate}, 实际借方={debit}',
                            'raw_data': row,
                            'severity': 'warning',
                        })
                    if foreign_credit and abs(foreign_credit * rate - credit) > Decimal('0.01'):
                        fc_warnings.append({
                            'row_number': row_num,
                            'error_type': 'foreign_currency',
                            'error_message': f'贷方本位币折算差异: 原币贷方({foreign_credit}) * 汇率({rate}) = {foreign_credit * rate}, 实际贷方={credit}',
                            'raw_data': row,
                            'severity': 'warning',
                        })
            self.checks['foreign_currency'] = {
                'passed': len(fc_warnings) == 0,
                'message': f'外币校验: {len(fc_warnings)} 行差异'
            }
            self.warnings.extend(fc_warnings)

    @staticmethod
    def _category_name(category):
        mapping = {
            'asset': '资产类',
            'liability': '负债类',
            'equity': '所有者权益类',
            'revenue': '收入类',
            'expense': '费用类',
        }
        return mapping.get(category, category)

    @staticmethod
    def _dir_name(direction):
        return '借方' if direction == 'debit' else '贷方'
