from django.contrib import admin
from .models import Invoice, InvoiceItem, Payment, BillingSettings


class InvoiceItemInline(admin.TabularInline):
    model = InvoiceItem
    extra = 1


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ('invoice_number', 'tenant', 'status', 'total_amount', 'currency', 'due_date', 'is_paid')
    list_filter = ('status', 'currency', 'issue_date', 'due_date')
    search_fields = ('invoice_number', 'tenant__name')
    readonly_fields = ('stripe_invoice_id', 'stripe_payment_intent_id')
    inlines = [InvoiceItemInline]
    
    fieldsets = (
        (None, {
            'fields': ('tenant', 'subscription', 'invoice_number', 'status')
        }),
        ('Amounts', {
            'fields': ('subtotal', 'tax_amount', 'total_amount', 'currency')
        }),
        ('Dates', {
            'fields': ('issue_date', 'due_date', 'paid_date')
        }),
        ('Billing Period', {
            'fields': ('billing_period_start', 'billing_period_end')
        }),
        ('Payment', {
            'fields': ('stripe_invoice_id', 'stripe_payment_intent_id')
        }),
        ('Metadata', {
            'fields': ('metadata',)
        }),
    )


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('external_payment_id', 'invoice', 'amount', 'currency', 'status', 'payment_method', 'processed_at')
    list_filter = ('status', 'payment_method', 'currency', 'processed_at')
    search_fields = ('external_payment_id', 'external_transaction_id', 'invoice__invoice_number')
    readonly_fields = ('external_payment_id', 'external_transaction_id')


@admin.register(BillingSettings)
class BillingSettingsAdmin(admin.ModelAdmin):
    list_display = ('tenant', 'tax_rate', 'auto_billing', 'grace_period_days', 'default_payment_method')
    list_filter = ('auto_billing', 'default_payment_method')
    search_fields = ('tenant__name',) 