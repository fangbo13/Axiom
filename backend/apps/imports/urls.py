from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ImportPipelineViewSet, ImportBatchViewSet, UnauditedTBViewSet, UnauditedJEViewSet

router = DefaultRouter()
router.register(r'batches', ImportBatchViewSet, basename='importbatch')
router.register(r'unaudited-tb', UnauditedTBViewSet, basename='unauditedtb')
router.register(r'unaudited-je', UnauditedJEViewSet, basename='unauditedje')
router.register(r'', ImportPipelineViewSet, basename='importpipeline')

urlpatterns = [
    path('', include(router.urls)),
]
