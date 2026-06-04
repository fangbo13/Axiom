from .base import ParseResult, BaseParser
from .factory import ParserFactory
from .column_mapper import ColumnMapper
from .header_detector import HeaderDetector
from .plugin_registry import PluginRegistry
from .utils import get_sample_rows, apply_mapping, _to_decimal, _to_int


def parse_file(file_obj, file_name: str, options: dict = None):
    """Convenience function to parse a file using the appropriate parser."""
    parser = ParserFactory.get_parser(file_name)
    return parser.parse(file_obj, file_name, options or {})
