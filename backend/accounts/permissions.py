from rest_framework import permissions


class IsTenantAdminOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow tenant admins or system admins to modify objects.
    """
    
    def has_permission(self, request, view):
        # Allow read operations for authenticated users
        if request.method in permissions.SAFE_METHODS:
            return request.user.is_authenticated
        
        # Allow write operations for system admins
        if request.user.is_admin:
            return True
        
        # Allow write operations for tenant admins
        if request.user.is_tenant_administrator:
            return True
        
        return False
    
    def has_object_permission(self, request, view, obj):
        # Allow read operations for authenticated users
        if request.method in permissions.SAFE_METHODS:
            return request.user.is_authenticated
        
        # Allow write operations for system admins
        if request.user.is_admin:
            return True
        
        # Allow write operations for tenant admins on their tenant's objects
        if request.user.is_tenant_administrator:
            # Check if the object belongs to the user's tenant
            if hasattr(obj, 'tenant'):
                return obj.tenant == request.user.tenant
            elif hasattr(obj, 'user') and hasattr(obj.user, 'tenant'):
                return obj.user.tenant == request.user.tenant
        
        return False


class IsOwnerOrTenantAdmin(permissions.BasePermission):
    """
    Custom permission to only allow owners of an object or tenant admins to access it.
    """
    
    def has_object_permission(self, request, view, obj):
        # Allow system admins
        if request.user.is_admin:
            return True
        
        # Allow tenant admins on their tenant's objects
        if request.user.is_tenant_administrator:
            if hasattr(obj, 'tenant'):
                return obj.tenant == request.user.tenant
            elif hasattr(obj, 'user') and hasattr(obj.user, 'tenant'):
                return obj.user.tenant == request.user.tenant
        
        # Allow object owners
        if hasattr(obj, 'user'):
            return obj.user == request.user
        elif hasattr(obj, 'id'):
            return obj.id == request.user.id
        
        return False


class IsSystemAdmin(permissions.BasePermission):
    """
    Custom permission to only allow system admins.
    """
    
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_admin
    
    def has_object_permission(self, request, view, obj):
        return request.user.is_authenticated and request.user.is_admin


class IsTenantAdmin(permissions.BasePermission):
    """
    Custom permission to only allow tenant admins or system admins.
    """
    
    def has_permission(self, request, view):
        return (request.user.is_authenticated and 
                (request.user.is_admin or request.user.is_tenant_administrator))
    
    def has_object_permission(self, request, view, obj):
        return (request.user.is_authenticated and 
                (request.user.is_admin or request.user.is_tenant_administrator))


class IsTenantMember(permissions.BasePermission):
    """
    Custom permission to only allow members of the same tenant.
    """
    
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.tenant is not None
    
    def has_object_permission(self, request, view, obj):
        if not request.user.is_authenticated:
            return False
        
        # System admins can access everything
        if request.user.is_admin:
            return True
        
        # Check if object belongs to user's tenant
        if hasattr(obj, 'tenant'):
            return obj.tenant == request.user.tenant
        elif hasattr(obj, 'user') and hasattr(obj.user, 'tenant'):
            return obj.user.tenant == request.user.tenant
        
        return False 