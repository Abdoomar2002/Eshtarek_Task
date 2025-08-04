from rest_framework import generics, permissions, status, serializers
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Invoice, Payment
from .serializers import InvoiceSerializer
from accounts.permissions import IsTenantAdminOrReadOnly


class InvoiceListView(generics.ListAPIView):
    """
    List invoices for the current tenant.
    """
    serializer_class = InvoiceSerializer
    permission_classes = [permissions.IsAuthenticated, IsTenantAdminOrReadOnly]
    
    def get_queryset(self):
        user = self.request.user
        if user.is_admin:
            return Invoice.objects.all()
        elif user.tenant:
            return Invoice.objects.filter(tenant=user.tenant)
        return Invoice.objects.none()


class InvoiceDetailView(generics.RetrieveAPIView):
    """
    Retrieve invoice details.
    """
    serializer_class = InvoiceSerializer
    permission_classes = [permissions.IsAuthenticated, IsTenantAdminOrReadOnly]
    
    def get_queryset(self):
        user = self.request.user
        if user.is_admin:
            return Invoice.objects.all()
        elif user.tenant:
            return Invoice.objects.filter(tenant=user.tenant)
        return Invoice.objects.none()


class PaymentProcessView(APIView):
    """
    Process payment (mock implementation).
    """
    permission_classes = [permissions.IsAuthenticated, IsTenantAdminOrReadOnly]
    
    def post(self, request):
        # Mock payment processing
        payment_data = request.data
        
        # In a real implementation, you would integrate with Stripe here
        # For now, we'll just return a success response
        
        mock_payment = {
            'id': 'mock_payment_123',
            'status': 'succeeded',
            'amount': payment_data.get('amount', 0),
            'currency': payment_data.get('currency', 'usd'),
            'payment_method': payment_data.get('payment_method', 'card'),
            'created': '2024-01-01T00:00:00Z'
        }
        
        return Response({
            'success': True,
            'payment': mock_payment,
            'message': 'Payment processed successfully'
        }, status=status.HTTP_200_OK)


class PaymentSerializer(serializers.ModelSerializer):
    """
    Serializer for Payment model.
    """
    class Meta:
        model = Payment
        fields = [
            'id', 'invoice', 'amount', 'currency', 'status', 'payment_method',
            'processed_at', 'external_payment_id', 'external_transaction_id',
            'error_message', 'metadata', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at'] 