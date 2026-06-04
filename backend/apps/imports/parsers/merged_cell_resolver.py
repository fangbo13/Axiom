from typing import List, Dict, Any


class MergedCellResolver:

    @staticmethod
    def resolve(ws, rows_2d: List[List[Any]]) -> List[Dict]:
        """
        Fill merged cell values into rows_2d.
        Returns list of merged cell info dicts for audit tracing.
        """
        merged_info = []
        if not ws.merged_cells.ranges:
            return merged_info

        for merged_range in ws.merged_cells.ranges:
            min_row, min_col, max_row, max_col = merged_range.bounds
            # openpyxl uses 1-based indexing
            top_left_value = rows_2d[min_row - 1][min_col - 1] if min_row <= len(rows_2d) and min_col <= len(rows_2d[min_row - 1]) else None

            merged_info.append({
                'range': str(merged_range),
                'min_row': min_row,
                'min_col': min_col,
                'max_row': max_row,
                'max_col': max_col,
                'value': top_left_value,
            })

            for r in range(min_row, max_row + 1):
                for c in range(min_col, max_col + 1):
                    row_idx = r - 1
                    col_idx = c - 1
                    if row_idx < len(rows_2d):
                        while len(rows_2d[row_idx]) <= col_idx:
                            rows_2d[row_idx].append(None)
                        if rows_2d[row_idx][col_idx] is None:
                            rows_2d[row_idx][col_idx] = top_left_value

        return merged_info
