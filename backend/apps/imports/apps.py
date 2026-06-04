from django.apps import AppConfig


class ImportsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.imports'
    verbose_name = '数据导入'

    def ready(self):
        # 预留第三方财务系统解析插件注册位置
        # from .parsers.plugin_registry import PluginRegistry
        # from .parsers.kingdee_parser import KingdeeK3Parser  # 金蝶K3
        # from .parsers.yonyou_parser import YonyouU8Parser    # 用友U8
        # PluginRegistry.register('kingdee_k3', KingdeeK3Parser)
        # PluginRegistry.register('yonyou_u8', YonyouU8Parser)
        pass
