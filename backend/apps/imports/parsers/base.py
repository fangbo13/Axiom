from dataclasses import dataclass, field
from typing import List, Dict, Any


@dataclass
class ParseResult:
    columns: List[str] = field(default_factory=list)
    rows: List[Dict[str, Any]] = field(default_factory=list)
    header_row: int = 0  # 0-based index of detected header row
    header_confidence: float = 0.0
    is_multiline_header: bool = False
    merged_cells_info: List[Dict] = field(default_factory=list)
    detected_currencies: List[str] = field(default_factory=list)
    errors: List[str] = field(default_factory=list)


class BaseParser:
    """Abstract base class for file parsers."""

    def parse(self, file_obj, file_name: str, options: dict) -> ParseResult:
        raise NotImplementedError

    @classmethod
    def can_handle(cls, file_name: str) -> bool:
        raise NotImplementedError
