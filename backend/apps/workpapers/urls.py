from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import WorkpaperViewSet

router = DefaultRouter()
router.register(r'', WorkpaperViewSet, basename='workpaper')

urlpatterns = [
    path('', include(router.urls)),
]
