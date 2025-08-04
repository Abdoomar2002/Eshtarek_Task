from rest_framework import generics, permissions
from .models import Tenant
from .serializers import TenantSerializer
from accounts.permissions import IsSystemAdmin


class TenantListView(generics.ListCreateAPIView):
    """
    List and create tenants (Admin only).
    """
    queryset = Tenant.objects.all()
    serializer_class = TenantSerializer
    permission_classes = [permissions.IsAuthenticated, IsSystemAdmin]


class TenantDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update and delete tenant (Admin only).
    """
    queryset = Tenant.objects.all()
    serializer_class = TenantSerializer
    permission_classes = [permissions.IsAuthenticated, IsSystemAdmin] 