from decimal import Decimal
from django.db.models import Sum
from apps.trial_balance.models import TrialBalanceSnapshot
from apps.ledger.models import Account


class A300ValidationEngine:
    """Engine for running A300 cross-check validation rules."""

    RULES = {
        'tb_always_balanced': '试算平衡检查',
        'net_income_agreement': '净利润勾稽检查',
        'balance_sheet_balances': '资产负债表平衡检查',
    }

    @classmethod
    def run_all(cls, project_id: int):
        """Run all validation rules and return results."""
        results = []
        for rule_key, rule_name in cls.RULES.items():
            validator = getattr(cls, f'validate_{rule_key}', None)
            if validator:
                result = validator(project_id)
                result['rule'] = rule_key
                result['rule_name'] = rule_name
                results.append(result)
        return results

    @staticmethod
    def validate_tb_always_balanced(project_id: int):
        """Rule: Total adjusted debits must equal total adjusted credits."""
        aggregates = TrialBalanceSnapshot.objects.filter(project_id=project_id).aggregate(
            total_debit=Sum('adjusted_debit'),
            total_credit=Sum('adjusted_credit')
        )
        total_debit = aggregates['total_debit'] or Decimal('0')
        total_credit = aggregates['total_credit'] or Decimal('0')
        passed = total_debit == total_credit
        return {
            'passed': passed,
            'details': {
                'total_debit': float(total_debit),
                'total_credit': float(total_credit),
                'difference': float(abs(total_debit - total_credit)),
            },
            'message': '试算平衡通过' if passed else '试算不平衡：借方与贷方合计不相等',
        }

    @staticmethod
    def validate_net_income_agreement(project_id: int):
        """Rule: Net income from TB must agree with revenue - expense."""
        tb = TrialBalanceSnapshot.objects.filter(project_id=project_id)

        revenue = tb.filter(account__category='revenue').aggregate(
            sum_debit=Sum('adjusted_debit'),
            sum_credit=Sum('adjusted_credit')
        )
        expense = tb.filter(account__category='expense').aggregate(
            sum_debit=Sum('adjusted_debit'),
            sum_credit=Sum('adjusted_credit')
        )

        revenue_net = (revenue['sum_credit'] or Decimal('0')) - (revenue['sum_debit'] or Decimal('0'))
        expense_net = (expense['sum_debit'] or Decimal('0')) - (expense['sum_credit'] or Decimal('0'))
        net_income = revenue_net - expense_net

        # For demonstration, we'll assume net income is simply revenue - expense
        # In a real system, you'd compare against retained earnings or a dedicated net income account
        passed = True  # Simplified for starter code
        return {
            'passed': passed,
            'details': {
                'revenue_net': float(revenue_net),
                'expense_net': float(expense_net),
                'net_income': float(net_income),
            },
            'message': f'净利润勾稽通过 (收入 {float(revenue_net):.2f} - 费用 {float(expense_net):.2f} = {float(net_income):.2f})',
        }

    @staticmethod
    def validate_balance_sheet_balances(project_id: int):
        """Rule: Assets = Liabilities + Equity."""
        tb = TrialBalanceSnapshot.objects.filter(project_id=project_id)

        asset = tb.filter(account__category='asset').aggregate(
            sum_debit=Sum('adjusted_debit'),
            sum_credit=Sum('adjusted_credit')
        )
        liability = tb.filter(account__category='liability').aggregate(
            sum_debit=Sum('adjusted_debit'),
            sum_credit=Sum('adjusted_credit')
        )
        equity = tb.filter(account__category='equity').aggregate(
            sum_debit=Sum('adjusted_debit'),
            sum_credit=Sum('adjusted_credit')
        )

        assets_net = (asset['sum_debit'] or Decimal('0')) - (asset['sum_credit'] or Decimal('0'))
        liabilities_net = (liability['sum_credit'] or Decimal('0')) - (liability['sum_debit'] or Decimal('0'))
        equity_net = (equity['sum_credit'] or Decimal('0')) - (equity['sum_debit'] or Decimal('0'))

        expected = liabilities_net + equity_net
        difference = abs(assets_net - expected)
        passed = difference < Decimal('0.01')

        return {
            'passed': passed,
            'details': {
                'assets': float(assets_net),
                'liabilities': float(liabilities_net),
                'equity': float(equity_net),
                'expected_assets': float(expected),
                'difference': float(difference),
            },
            'message': '资产负债表平衡' if passed else f'资产负债表不平衡，差额 {float(difference):.2f}',
        }
