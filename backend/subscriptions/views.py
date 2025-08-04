from rest_framework import generics, permissions
from .models import Plan, Subscription
from .serializers import PlanSerializer, SubscriptionSerializer
from accounts.permissions import IsTenantAdminOrReadOnly, IsSystemAdmin


class PlanListView(generics.ListCreateAPIView):
    """
    List and create plans (Admin only for create).
    """
    queryset = Plan.objects.filter(is_active=True)
    serializer_class = PlanSerializer
    
    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAuthenticated(), IsSystemAdmin()]
        return [permissions.IsAuthenticated()]


class PlanDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update and delete plan (Admin only for update/delete).
    """
    queryset = Plan.objects.all()
    serializer_class = PlanSerializer
    
    def get_permissions(self):
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            return [permissions.IsAuthenticated(), IsSystemAdmin()]
        return [permissions.IsAuthenticated()]


class SubscriptionListView(generics.ListCreateAPIView):
    """
    List and create subscriptions.
    """
    serializer_class = SubscriptionSerializer
    permission_classes = [permissions.IsAuthenticated, IsTenantAdminOrReadOnly]
    
    def get_queryset(self):
        user = self.request.user
        if user.is_admin:
            return Subscription.objects.all()
        elif user.tenant:
            return Subscription.objects.filter(tenant=user.tenant)
        return Subscription.objects.none()


class SubscriptionDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update and delete subscription.
    """
    serializer_class = SubscriptionSerializer
    permission_classes = [permissions.IsAuthenticated, IsTenantAdminOrReadOnly]
    
    def get_queryset(self):
        user = self.request.user
        if user.is_admin:
            return Subscription.objects.all()
        elif user.tenant:
            return Subscription.objects.filter(tenant=user.tenant)
        return Subscription.objects.none() 