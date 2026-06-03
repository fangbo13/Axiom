from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import NoteDraftViewSet

router = DefaultRouter()
router.register(r'', NoteDraftViewSet, basename='notedraft')

urlpatterns = [
    path('', include(router.urls)),
]
