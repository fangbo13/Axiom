import csv
import io
from .base import BaseParser, ParseResult


class CsvParser(BaseParser):
    delimiter = ','

    @classmethod
    def can_handle(cls, file_name: str) -> bool:
        return file_name.lower().endswith('.csv')

    def parse(self, file_obj, file_name: str, options: dict) -> ParseResult:
        result = ParseResult()
        encoding = options.get('encoding')
        header_row_hint = options.get('header_row_hint')

        if encoding is None:
            raw = file_obj.read()
            for enc in ('utf-8-sig', 'gbk', 'utf-8', 'gb18030'):
                try:
                    content = raw.decode(enc)
                    encoding = enc
                    break
                except (UnicodeDecodeError, LookupError):
                    continue
            if encoding is None:
                result.errors.append('无法识别文件编码')
                return result
        else:
            content = file_obj.read().decode(encoding)

        try:
            lines = content.splitlines()
            if header_row_hint is not None and 0 <= header_row_hint < len(lines):
                # Use specified header row, skip preceding lines
                header_line = lines[header_row_hint]
                data_lines = lines[header_row_hint + 1:]
                content = header_line + '\n' + '\n'.join(data_lines)
                result.header_row = header_row_hint
                result.header_confidence = 1.0

            reader = csv.DictReader(io.StringIO(content), delimiter=self.delimiter)
            result.columns = reader.fieldnames or []
            result.rows = list(reader)
            if header_row_hint is None:
                result.header_row = 0
                result.header_confidence = 1.0
        except Exception as e:
            result.errors.append(f'CSV解析失败: {str(e)}')

        return result


class TsvParser(CsvParser):
    delimiter = '\t'

    @classmethod
    def can_handle(cls, file_name: str) -> bool:
        return file_name.lower().endswith(('.tsv', '.txt'))
