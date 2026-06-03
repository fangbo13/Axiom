from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('apps.accounts.urls')),
    path('api/projects/', include('apps.projects.urls')),
    path('api/projects/<int:project_id>/ledger/', include('apps.ledger.urls')),
    path('api/projects/<int:project_id>/workpapers/', include('apps.workpapers.urls')),
    path('api/projects/<int:project_id>/adjustments/', include('apps.adjustments.urls')),
    path('api/projects/<int:project_id>/trial-balance/', include('apps.trial_balance.urls')),
    path('api/projects/<int:project_id>/a300/', include('apps.a300_checks.urls')),
    path('api/projects/<int:project_id>/notes/', include('apps.notes.urls')),
    path('api/projects/<int:project_id>/export/', include('apps.exports.urls')),
    path('api/projects/<int:project_id>/imports/', include('apps.imports.urls')),
    path('api/admin/', include('apps.accounts.admin_urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
