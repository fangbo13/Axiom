from django.urls import path
from .views import ExportZipView

urlpatterns = [
    path('zip/', ExportZipView.as_view(), name='export_zip'),
]
