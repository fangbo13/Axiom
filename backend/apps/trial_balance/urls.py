from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TrialBalanceViewSet

router = DefaultRouter()
router.register(r'', TrialBalanceViewSet, basename='trialbalance')

urlpatterns = [
    path('', include(router.urls)),
]
