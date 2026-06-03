import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'axiom.settings')
django.setup()

from apps.accounts.models import User

if not User.objects.filter(email='admin@axiom.com').exists():
    User.objects.create_superuser(
        username='admin',
        email='admin@axiom.com',
        password='admin123',
        is_admin=True
    )
    print('Superuser created: admin@axiom.com / admin123')
else:
    print('Superuser already exists')
