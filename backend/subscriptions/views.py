from rest_framework import generics, permissions, views
from rest_framework.response import Response
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


class UsageView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        tenant = request.user.tenant
        if not tenant:
            return Response({
                'error': 'No tenant associated'
            }, status=400)
        subscription = tenant.active_subscription
        usage = subscription.current_usage if subscription else {'users': tenant.user_count, 'storage_gb': 0, 'api_calls': 0}
        limits = {
            'max_users': subscription.plan.max_users if subscription else 0,
            'max_storage_gb': subscription.plan.max_storage_gb if subscription else 0,
            'max_api_calls': subscription.plan.max_api_calls if subscription else 0,
        }
        return Response({
            'usage': usage,
            'limits': limits
        }) 