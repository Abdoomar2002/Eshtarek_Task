from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi

# Swagger documentation setup
schema_view = get_schema_view(
    openapi.Info(
        title="Multi-Tenant Subscription Management API",
        default_version='v1',
        description="API for managing multi-tenant subscriptions",
        terms_of_service="https://www.eshtarek.com/terms/",
        contact=openapi.Contact(email="support@eshtarek.com"),
        license=openapi.License(name="MIT License"),
    ),
    public=True,
    permission_classes=(permissions.AllowAny,),
)

urlpatterns = [
    # Admin interface
    path('admin/', admin.site.urls),
    
    # API documentation
    path('api/docs/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('api/redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
    
    # API endpoints
    path('api/auth/', include('accounts.urls')),
    path('api/tenants/', include('tenants.urls')),
    path('api/subscriptions/', include('subscriptions.urls')),
    path('api/billing/', include('billing.urls')),
    path('api/users/', include('accounts.user_urls')),
]

# Serve static and media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT) 