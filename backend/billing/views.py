from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db import transaction
from django.utils import timezone
from datetime import timedelta
import uuid
import random

from .models import Invoice, Payment, BillingSettings
from .serializers import InvoiceSerializer, PaymentSerializer, BillingSettingsSerializer
from subscriptions.models import Subscription
from tenants.models import Tenant


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def process_payment(request):
    """Process a payment for an invoice."""
    invoice_id = request.data.get('invoice_id')
    payment_method = request.data.get('payment_method', 'stripe')
    amount = request.data.get('amount')
    
    try:
        invoice = Invoice.objects.get(id=invoice_id)
        
        # Check if user has permission to pay this invoice
        if not request.user.is_admin and invoice.tenant != request.user.tenant:
            return Response(
                {'error': 'Permission denied'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Simulate payment processing
        payment = Payment.objects.create(
            invoice=invoice,
            amount=amount or invoice.total_amount,
            currency=invoice.currency,
            payment_method=payment_method,
            external_payment_id=f"pi_{uuid.uuid4().hex[:24]}",
            external_transaction_id=f"txn_{uuid.uuid4().hex[:24]}",
        )
        
        # Simulate processing delay
        import time
        time.sleep(0.5)
        
        # 95% success rate for demo
        if random.random() > 0.05:
            payment.mark_as_successful()
            
            return Response({
                'success': True,
                'payment_id': payment.id,
                'transaction_id': payment.external_transaction_id,
                'message': 'Payment processed successfully'
            })
        else:
            payment.mark_as_failed('Payment declined by bank')
            
            return Response({
                'success': False,
                'error': 'Payment declined',
                'message': 'Your payment was declined. Please try again.'
            }, status=status.HTTP_400_BAD_REQUEST)
    
    except Invoice.DoesNotExist:
        return Response(
            {'error': 'Invoice not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': 'Payment processing failed', 'details': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_subscription_invoice(request):
    """Create an invoice for a subscription."""
    subscription_id = request.data.get('subscription_id')
    
    try:
        subscription = Subscription.objects.get(id=subscription_id)
        
        # Check permissions
        if not request.user.is_admin and subscription.tenant != request.user.tenant:
            return Response(
                {'error': 'Permission denied'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        with transaction.atomic():
            # Generate invoice number
            invoice_number = f"INV-{timezone.now().strftime('%Y%m')}-{uuid.uuid4().hex[:8].upper()}"
            
            # Calculate billing period
            now = timezone.now()
            if subscription.billing_cycle == 'monthly':
                period_start = now
                period_end = now + timedelta(days=30)
            elif subscription.billing_cycle == 'yearly':
                period_start = now
                period_end = now + timedelta(days=365)
            else:  # quarterly
                period_start = now
                period_end = now + timedelta(days=90)
            
            # Create invoice
            invoice = Invoice.objects.create(
                tenant=subscription.tenant,
                subscription=subscription,
                invoice_number=invoice_number,
                subtotal=subscription.plan.price,
                total_amount=subscription.plan.price,
                currency=subscription.plan.currency,
                issue_date=now,
                due_date=now + timedelta(days=30),
                billing_period_start=period_start,
                billing_period_end=period_end,
                status='open'
            )
            
            return Response({
                'success': True,
                'invoice': InvoiceSerializer(invoice).data
            })
    
    except Subscription.DoesNotExist:
        return Response(
            {'error': 'Subscription not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': 'Failed to create invoice', 'details': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


class InvoiceListView(generics.ListCreateAPIView):
    """List and create invoices."""
    serializer_class = InvoiceSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        if self.request.user.is_admin:
            return Invoice.objects.all()
        elif self.request.user.tenant:
            return Invoice.objects.filter(tenant=self.request.user.tenant)
        return Invoice.objects.none()
    
    def perform_create(self, serializer):
        if not self.request.user.is_admin and self.request.user.tenant:
            serializer.save(tenant=self.request.user.tenant)
        else:
            serializer.save()


class InvoiceDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, and delete invoice."""
    serializer_class = InvoiceSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        if self.request.user.is_admin:
            return Invoice.objects.all()
        elif self.request.user.tenant:
            return Invoice.objects.filter(tenant=self.request.user.tenant)
        return Invoice.objects.none()


class PaymentListView(generics.ListCreateAPIView):
    """List and create payments."""
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        if self.request.user.is_admin:
            return Payment.objects.all()
        elif self.request.user.tenant:
            return Payment.objects.filter(invoice__tenant=self.request.user.tenant)
        return Payment.objects.none()


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def billing_history(request):
    """Get billing history for the current tenant."""
    if not request.user.tenant:
        return Response(
            {'error': 'No tenant associated'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Get invoices for the tenant
    invoices = Invoice.objects.filter(tenant=request.user.tenant).order_by('-issue_date')
    
    # Get payments for the tenant
    payments = Payment.objects.filter(invoice__tenant=request.user.tenant).order_by('-created_at')
    
    # Calculate summary
    total_invoiced = sum(invoice.total_amount for invoice in invoices)
    total_paid = sum(payment.amount for payment in payments if payment.is_successful)
    outstanding = total_invoiced - total_paid
    
    return Response({
        'summary': {
            'total_invoiced': total_invoiced,
            'total_paid': total_paid,
            'outstanding': outstanding,
            'invoice_count': invoices.count(),
            'payment_count': payments.count()
        },
        'invoices': InvoiceSerializer(invoices[:10], many=True).data,
        'payments': PaymentSerializer(payments[:10], many=True).data
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def billing_analytics(request):
    """Get billing analytics for admin or tenant."""
    if request.user.is_admin:
        # System-wide analytics
        tenants = Tenant.objects.all()
        total_revenue = sum(
            Payment.objects.filter(status='succeeded').values_list('amount', flat=True)
        )
        active_subscriptions = Subscription.objects.filter(status='active').count()
        
        return Response({
            'total_tenants': tenants.count(),
            'total_revenue': total_revenue,
            'active_subscriptions': active_subscriptions,
            'monthly_revenue': total_revenue / 12 if total_revenue > 0 else 0
        })
    elif request.user.tenant:
        # Tenant-specific analytics
        tenant = request.user.tenant
        invoices = Invoice.objects.filter(tenant=tenant)
        payments = Payment.objects.filter(invoice__tenant=tenant)
        
        total_spent = sum(payment.amount for payment in payments if payment.is_successful)
        subscription = tenant.active_subscription
        
        return Response({
            'total_spent': total_spent,
            'invoice_count': invoices.count(),
            'current_plan': subscription.plan.name if subscription else None,
            'plan_price': subscription.plan.price if subscription else 0,
            'next_billing': subscription.current_period_end if subscription else None
        })
    
    return Response(
        {'error': 'No analytics available'}, 
        status=status.HTTP_400_BAD_REQUEST
    ) 