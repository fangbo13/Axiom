from typing import Dict, List


TB_COLUMN_MAP = {
    'account_code': ['account_code', '科目代码', '科目编码', '科目编号', 'code', '科目号', '科目'],
    'account_name': ['account_name', '科目名称', '科目名', 'name', '科目说明', '科目描述'],
    'opening_debit': ['opening_debit', '期初借方', '期初借方余额', '年初借方', '期初借', '期初余额_借方'],
    'opening_credit': ['opening_credit', '期初贷方', '期初贷方余额', '年初贷方', '期初贷', '期初余额_贷方'],
    'period_debit': ['period_debit', '本期借方', '本期借方发生额', '借方发生额', '本期借', '本期发生_借方'],
    'period_credit': ['period_credit', '本期贷方', '本期贷方发生额', '贷方发生额', '本期贷', '本期发生_贷方'],
    'closing_debit': ['closing_debit', '期末借方', '期末借方余额', '年末借方', '期末借', '期末余额_借方'],
    'closing_credit': ['closing_credit', '期末贷方', '期末贷方余额', '年末贷方', '期末贷', '期末余额_贷方'],
    'direction': ['direction', '方向', '余额方向', '借贷方向', 'dr_cr'],
    # 多币种字段
    'currency': ['currency', '币种', '货币', '幣種', 'ccy', 'currency_code', '币别'],
    'foreign_opening_debit': ['foreign_opening_debit', '原币期初借方', '原幣期初借方', '外币期初借方'],
    'foreign_opening_credit': ['foreign_opening_credit', '原币期初贷方', '原幣期初贷方', '外币期初贷方'],
    'foreign_period_debit': ['foreign_period_debit', '原币本期借方', '原幣本期借方', '外币本期借方'],
    'foreign_period_credit': ['foreign_period_credit', '原币本期贷方', '原幣本期贷方', '外币本期贷方'],
    'foreign_closing_debit': ['foreign_closing_debit', '原币期末借方', '原幣期末借方', '外币期末借方'],
    'foreign_closing_credit': ['foreign_closing_credit', '原币期末贷方', '原幣期末贷方', '外币期末贷方'],
    'exchange_rate': ['exchange_rate', '汇率', '匯率', 'rate'],
}

JE_COLUMN_MAP = {
    'voucher_date': ['voucher_date', '凭证日期', '日期', '记账日期', '交易日期'],
    'voucher_no': ['voucher_no', '凭证号', '凭证编号', '记字号', '凭证字号'],
    'line_no': ['line_no', '行号', '分录号', '序号'],
    'abstract': ['abstract', '摘要', '说明', '备注'],
    'account_code': ['account_code', '科目代码', '科目编码', '科目编号', 'code', '科目号'],
    'account_name': ['account_name', '科目名称', '科目名', 'name'],
    'debit': ['debit', '借方', '借方金额', 'debit_amount', '借'],
    'credit': ['credit', '贷方', '贷方金额', 'credit_amount', '贷'],
    # 多币种与辅助核算
    'currency': ['currency', '币种', '货币', '幣種', 'ccy', '币别'],
    'foreign_debit': ['foreign_debit', '原币借方', '原幣借方', '外币借方'],
    'foreign_credit': ['foreign_credit', '原币贷方', '原幣贷方', '外币贷方'],
    'exchange_rate': ['exchange_rate', '汇率', '匯率', 'rate'],
    'department': ['department', '部门', '成本中心', 'dept'],
    'customer': ['customer', '客户', '客商', '客户名称'],
    'supplier': ['supplier', '供应商', '厂商', '供应商名称'],
}


class ColumnMapper:

    @classmethod
    def guess_mapping(cls, columns: List[str], import_type: str) -> Dict[str, str]:
        col_map = TB_COLUMN_MAP if import_type == 'tb' else JE_COLUMN_MAP
        return cls._normalize_columns(columns, col_map)

    @staticmethod
    def _normalize_columns(columns: List[str], column_map: Dict[str, List[str]]) -> Dict[str, str]:
        mapping = {}
        normalized = []
        for c in columns:
            if c is None:
                normalized.append('')
            else:
                normalized.append(str(c).strip().lower().replace(' ', '_').replace('\n', '_').replace('（', '(').replace('）', ')'))

        for std_key, variants in column_map.items():
            for variant in variants:
                norm_variant = variant.strip().lower().replace(' ', '_').replace('\n', '_').replace('（', '(').replace('）', ')')
                for idx, col_norm in enumerate(normalized):
                    if norm_variant in col_norm or col_norm in norm_variant:
                        mapping[std_key] = columns[idx]
                        break
                if std_key in mapping:
                    break
        return mapping

    @classmethod
    def compute_header_signature(cls, columns: List[str]) -> Dict:
        """Compute a fingerprint for a set of column headers."""
        import hashlib
        normalized = [str(c).strip().lower().replace(' ', '') for c in columns if c]
        joined = '|'.join(sorted(normalized))
        return {
            'hash': hashlib.md5(joined.encode()).hexdigest()[:16],
            'column_count': len(columns),
            'keywords': [c for c in normalized if any(kw in c for kw in TB_COLUMN_MAP.keys())],
        }
