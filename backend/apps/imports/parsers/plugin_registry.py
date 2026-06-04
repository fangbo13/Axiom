from typing import Optional, Type
from .base import BaseParser


class PluginRegistry:
    _plugins: dict = {}

    @classmethod
    def register(cls, name: str, parser_class: Type[BaseParser]):
        cls._plugins[name] = parser_class

    @classmethod
    def get(cls, file_name: str) -> Optional[Type[BaseParser]]:
        for parser_cls in cls._plugins.values():
            if hasattr(parser_cls, 'can_handle') and parser_cls.can_handle(file_name):
                return parser_cls
        return None

    @classmethod
    def list_plugins(cls) -> dict:
        return dict(cls._plugins)
