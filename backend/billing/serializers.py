from rest_framework import serializers
from .models import Invoice, InvoiceItem, Payment, BillingSettings


class InvoiceItemSerializer(serializers.ModelSerializer):
    """
    Serializer for InvoiceItem model.
    """
    class Meta:
        model = InvoiceItem
        fields = [
            'id', 'invoice', 'description', 'quantity', 'unit_price',
            'total_price', 'metadata', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class InvoiceSerializer(serializers.ModelSerializer):
    """
    Serializer for Invoice model.
    """
    items = InvoiceItemSerializer(many=True, read_only=True)
    tenant_name = serializers.CharField(source='tenant.name', read_only=True)
    
    class Meta:
        model = Invoice
        fields = [
            'id', 'tenant', 'tenant_name', 'subscription', 'invoice_number',
            'status', 'subtotal', 'tax_amount', 'total_amount', 'currency',
            'issue_date', 'due_date', 'paid_date', 'billing_period_start',
            'billing_period_end', 'stripe_invoice_id', 'stripe_payment_intent_id',
            'metadata', 'created_at', 'updated_at', 'items'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


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


class BillingSettingsSerializer(serializers.ModelSerializer):
    """
    Serializer for BillingSettings model.
    """
    class Meta:
        model = BillingSettings
        fields = [
            'id', 'tenant', 'tax_rate', 'tax_number', 'auto_billing',
            'grace_period_days', 'default_payment_method', 'send_invoice_emails',
            'send_payment_reminders', 'metadata', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at'] 