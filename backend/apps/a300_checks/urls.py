from django.urls import path
from .views import A300CheckListView, A300CheckDetailView

urlpatterns = [
    path('checks/', A300CheckListView.as_view(), name='a300_checks_list'),
    path('checks/<str:rule>/', A300CheckDetailView.as_view(), name='a300_checks_detail'),
]
