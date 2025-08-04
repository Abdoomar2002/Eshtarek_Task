from django.http import Http404
from django.conf import settings
from django.utils.deprecation import MiddlewareMixin
from .models import Tenant, Domain


class TenantMiddleware(MiddlewareMixin):
    """
    Middleware for identifying and setting the current tenant.
    """
    
    def process_request(self, request):
        """
        Process the request to identify the tenant.
        """
        # Skip tenant identification for certain paths
        if self._should_skip_tenant_identification(request.path):
            request.tenant = None
            return None
        
        # Try to identify tenant from domain
        tenant = self._get_tenant_from_domain(request)
        
        # If no tenant found from domain, try from subdomain
        if not tenant:
            tenant = self._get_tenant_from_subdomain(request)
        
        # If still no tenant, try from header
        if not tenant:
            tenant = self._get_tenant_from_header(request)
        
        # Set tenant on request
        request.tenant = tenant
        
        # Add tenant to request for easy access
        if tenant:
            request.tenant_id = tenant.id
            request.tenant_name = tenant.name
        else:
            request.tenant_id = None
            request.tenant_name = None
    
    def _should_skip_tenant_identification(self, path):
        """
        Check if tenant identification should be skipped for this path.
        """
        skip_paths = [
            '/admin/',
            '/api/docs/',
            '/api/redoc/',
            '/static/',
            '/media/',
            '/health/',
        ]
        
        return any(path.startswith(skip_path) for skip_path in skip_paths)
    
    def _get_tenant_from_domain(self, request):
        """
        Get tenant from domain name.
        """
        host = request.get_host().split(':')[0]
        
        try:
            domain = Domain.objects.get(
                domain=host,
                is_active=True
            )
            return domain.tenant
        except Domain.DoesNotExist:
            return None
    
    def _get_tenant_from_subdomain(self, request):
        """
        Get tenant from subdomain.
        """
        host = request.get_host().split(':')[0]
        
        # Check if it's a subdomain (e.g., tenant1.example.com)
        if '.' in host:
            subdomain = host.split('.')[0]
            
            # Skip common subdomains
            if subdomain in ['www', 'api', 'admin', 'static', 'media']:
                return None
            
            try:
                tenant = Tenant.objects.get(
                    slug=subdomain,
                    is_active=True
                )
                return tenant
            except Tenant.DoesNotExist:
                return None
        
        return None
    
    def _get_tenant_from_header(self, request):
        """
        Get tenant from custom header.
        """
        tenant_header = getattr(settings, 'TENANT_HEADER', 'X-Tenant')
        tenant_id = request.headers.get(tenant_header)
        
        if tenant_id:
            try:
                tenant = Tenant.objects.get(
                    id=tenant_id,
                    is_active=True
                )
                return tenant
            except (Tenant.DoesNotExist, ValueError):
                return None
        
        return None
    
    def process_response(self, request, response):
        """
        Process the response to add tenant information.
        """
        # Add tenant information to response headers for debugging
        if hasattr(request, 'tenant') and request.tenant:
            response['X-Tenant-ID'] = str(request.tenant.id)
            response['X-Tenant-Name'] = request.tenant.name
        
        return response


class TenantDatabaseMiddleware(MiddlewareMixin):
    """
    Middleware for setting the database connection based on tenant.
    """
    
    def process_request(self, request):
        """
        Set the database connection for the current tenant.
        """
        if hasattr(request, 'tenant') and request.tenant:
            # In a real multi-tenant setup, you might want to use different databases
            # For now, we'll use the same database but with tenant filtering
            request.tenant_db = 'default'
        else:
            request.tenant_db = 'default'
    
    def process_response(self, request, response):
        """
        Clean up after processing the request.
        """
        if hasattr(request, 'tenant_db'):
            delattr(request, 'tenant_db')
        
        return response 