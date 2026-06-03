from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AccountViewSet, LedgerEntryViewSet, LedgerUploadViewSet

router = DefaultRouter()
router.register(r'accounts', AccountViewSet, basename='account')
router.register(r'entries', LedgerEntryViewSet, basename='ledgerentry')
router.register(r'', LedgerUploadViewSet, basename='ledgerupload')

urlpatterns = [
    path('', include(router.urls)),
]
