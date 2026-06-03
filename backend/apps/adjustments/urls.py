from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AdjustingEntryViewSet

router = DefaultRouter()
router.register(r'', AdjustingEntryViewSet, basename='adjustingentry')

urlpatterns = [
    path('', include(router.urls)),
]
