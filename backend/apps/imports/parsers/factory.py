from .base import BaseParser
from .csv_parser import CsvParser, TsvParser
from .xlsx_parser import XlsxParser
from .plugin_registry import PluginRegistry


class ParserFactory:
    _builtins = {
        'csv': CsvParser,
        'tsv': TsvParser,
        'txt': TsvParser,
        'xlsx': XlsxParser,
        'xls': XlsxParser,
    }

    @classmethod
    def get_parser(cls, file_name: str) -> BaseParser:
        ext = file_name.split('.')[-1].lower()
        if ext in cls._builtins:
            return cls._builtins[ext]()

        # Try plugins
        plugin_parser = PluginRegistry.get(file_name)
        if plugin_parser:
            return plugin_parser()

        raise ValueError(f'不支持的文件格式: {ext}')
