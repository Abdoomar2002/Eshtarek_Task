import os
import sys

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'subscription_management.settings')

import django  # noqa: E402
django.setup()

from rest_framework.test import APIClient  # noqa: E402


def main() -> None:
    client = APIClient()

    # Register attempt (as per Postman payload)
    print('--- Register')
    reg_payload = {
        "email": "tenantadmin@techcorp.com",
        "password": "tech123",
        "tenant_name": "TechCorp",
    }
    resp = client.post('/api/auth/register/', reg_payload, format='json')
    print('status:', resp.status_code)
    print('body:', resp.content[:500])

    # Login admin
    print('\n--- Login admin')
    login_payload = {"email": "admin@eshtarek.com", "password": "admin123"}
    resp = client.post('/api/auth/login/', login_payload, format='json')
    print('status:', resp.status_code)
    print('body:', resp.content[:500])


if __name__ == '__main__':
    try:
        main()
    except Exception as exc:  # pragma: no cover
        import traceback
        traceback.print_exc()
        sys.exit(1)

