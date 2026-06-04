import re
from dataclasses import dataclass
from typing import List, Any


@dataclass
class DetectionResult:
    row: int = 0
    confidence: float = 0.0
    is_multiline: bool = False


class HeaderDetector:
    KEYWORDS = [
        '科目', '代码', '编码', '编号', '期初', '期末', '年初', '年末',
        '借方', '贷方', '余额', '方向', '币种', '货币', '金额',
        '发生额', '摘要', '凭证', '日期', '行号', '分录号',
        'account', 'code', 'name', 'opening', 'closing', 'debit',
        'credit', 'balance', 'direction', 'currency', 'amount',
        'date', 'voucher', 'abstract', 'exchange', 'rate',
    ]

    def detect(self, rows: List[List[Any]], max_scan: int = 30, hint: int = None) -> DetectionResult:
        if hint is not None and 0 <= hint < len(rows):
            return DetectionResult(row=hint, confidence=1.0, is_multiline=False)

        best_row, best_score = 0, 0.0
        max_cols = max((len(r) for r in rows), default=0)

        for i in range(min(max_scan, len(rows))):
            row = rows[i]
            non_empty = [c for c in row if c is not None and str(c).strip()]
            if len(non_empty) < 3:
                continue

            keyword_score = self._keyword_score(non_empty)
            text_ratio = self._text_ratio(non_empty)
            col_count_score = min(len(non_empty) / max(max_cols, 1), 1.0)
            data_score = self._data_consistency_score(rows, i)

            score = 0.4 * keyword_score + 0.2 * text_ratio + 0.2 * col_count_score + 0.2 * data_score

            if score > best_score:
                best_score = score
                best_row = i

        # Multi-line header detection
        is_multiline = False
        next_row = best_row + 1
        if next_row < len(rows) and best_score > 0.5:
            next_non_empty = [c for c in rows[next_row] if c is not None and str(c).strip()]
            next_text_ratio = self._text_ratio(next_non_empty)
            if next_text_ratio > 0.7 and len(next_non_empty) >= len([c for c in rows[best_row] if c is not None and str(c).strip()]) * 0.8:
                is_multiline = True

        return DetectionResult(row=best_row, confidence=round(best_score, 2), is_multiline=is_multiline)

    def _keyword_score(self, cells: List[Any]) -> float:
        if not cells:
            return 0.0
        matched = 0
        for cell in cells:
            text = str(cell).lower()
            for kw in self.KEYWORDS:
                if kw in text:
                    matched += 1
                    break
        return min(matched / max(len(self.KEYWORDS) * 0.3, 1), 1.0)

    def _text_ratio(self, cells: List[Any]) -> float:
        if not cells:
            return 0.0
        numeric_count = 0
        for cell in cells:
            if self._is_numeric(cell):
                numeric_count += 1
        return 1 - (numeric_count / len(cells))

    def _data_consistency_score(self, rows: List[List[Any]], header_idx: int) -> float:
        scores = []
        for j in range(1, 4):
            data_idx = header_idx + j
            if data_idx >= len(rows):
                break
            row = rows[data_idx]
            non_empty = [c for c in row if c is not None and str(c).strip()]
            if not non_empty:
                continue
            numeric_count = sum(1 for c in non_empty if self._is_numeric(c))
            scores.append(numeric_count / len(non_empty))
        if not scores:
            return 0.0
        return sum(scores) / len(scores)

    @staticmethod
    def _is_numeric(value: Any) -> bool:
        if value is None:
            return False
        text = str(value).strip()
        # Handle parentheses notation for negative numbers
        if text.startswith('(') and text.endswith(')'):
            text = text[1:-1]
        text = text.replace(',', '').replace('，', '')
        if text == '':
            return False
        # Check for pure numbers, decimals, negative numbers
        return bool(re.match(r'^-?\d+(\.\d+)?$', text))
