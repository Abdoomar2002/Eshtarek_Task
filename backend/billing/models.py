from django.db import models
from django.utils.translation import gettext_lazy as _
from django.core.validators import MinValueValidator
from django.utils import timezone
from decimal import Decimal


class Invoice(models.Model):
    """
    Invoice model for billing.
    """
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('open', 'Open'),
        ('paid', 'Paid'),
        ('uncollectible', 'Uncollectible'),
        ('void', 'Void'),
    ]
    
    tenant = models.ForeignKey(
        'tenants.Tenant',
        on_delete=models.CASCADE,
        related_name='invoices',
        help_text=_('Tenant this invoice belongs to.')
    )
    
    subscription = models.ForeignKey(
        'subscriptions.Subscription',
        on_delete=models.CASCADE,
        related_name='invoices',
        help_text=_('Subscription this invoice is for.')
    )
    
    invoice_number = models.CharField(
        max_length=50,
        unique=True,
        help_text=_('Unique invoice number.')
    )
    
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='draft',
        help_text=_('Status of the invoice.')
    )
    
    # Amounts
    subtotal = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))],
        help_text=_('Subtotal amount.')
    )
    
    tax_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('0.00'),
        help_text=_('Tax amount.')
    )
    
    total_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))],
        help_text=_('Total amount including tax.')
    )
    
    currency = models.CharField(
        max_length=3,
        default='USD',
        help_text=_('Currency code for the invoice.')
    )
    
    # Dates
    issue_date = models.DateTimeField(
        help_text=_('When the invoice was issued.')
    )
    
    due_date = models.DateTimeField(
        help_text=_('When the invoice is due.')
    )
    
    paid_date = models.DateTimeField(
        null=True,
        blank=True,
        help_text=_('When the invoice was paid.')
    )
    
    # Billing period
    billing_period_start = models.DateTimeField(
        help_text=_('Start of the billing period.')
    )
    
    billing_period_end = models.DateTimeField(
        help_text=_('End of the billing period.')
    )
    
    # Payment information
    stripe_invoice_id = models.CharField(
        max_length=100,
        blank=True,
        help_text=_('Stripe invoice ID.')
    )
    
    stripe_payment_intent_id = models.CharField(
        max_length=100,
        blank=True,
        help_text=_('Stripe payment intent ID.')
    )
    
    # Metadata
    metadata = models.JSONField(
        default=dict,
        blank=True,
        help_text=_('Additional metadata for the invoice.')
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'billing_invoice'
        verbose_name = _('invoice')
        verbose_name_plural = _('invoices')
        ordering = ['-issue_date']
        indexes = [
            models.Index(fields=['tenant']),
            models.Index(fields=['subscription']),
            models.Index(fields=['status']),
            models.Index(fields=['invoice_number']),
            models.Index(fields=['due_date']),
        ]
    
    def __str__(self):
        return f"Invoice {self.invoice_number} - {self.tenant.name}"
    
    def save(self, *args, **kwargs):
        # Calculate total amount if not set
        if not self.total_amount:
            self.total_amount = self.subtotal + self.tax_amount
        super().save(*args, **kwargs)
    
    @property
    def is_paid(self):
        """Check if the invoice is paid."""
        return self.status == 'paid'
    
    @property
    def is_overdue(self):
        """Check if the invoice is overdue."""
        return (self.status == 'open' and 
                self.due_date < timezone.now())
    
    @property
    def days_overdue(self):
        """Get the number of days the invoice is overdue."""
        if not self.is_overdue:
            return 0
        delta = timezone.now() - self.due_date
        return delta.days
    
    def mark_as_paid(self, paid_date=None):
        """Mark the invoice as paid."""
        self.status = 'paid'
        self.paid_date = paid_date or timezone.now()
        self.save()


class InvoiceItem(models.Model):
    """
    Individual items on an invoice.
    """
    invoice = models.ForeignKey(
        Invoice,
        on_delete=models.CASCADE,
        related_name='items',
        help_text=_('Invoice this item belongs to.')
    )
    
    description = models.CharField(
        max_length=255,
        help_text=_('Description of the item.')
    )
    
    quantity = models.PositiveIntegerField(
        default=1,
        help_text=_('Quantity of the item.')
    )
    
    unit_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))],
        help_text=_('Unit price of the item.')
    )
    
    total_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))],
        help_text=_('Total price for this item.')
    )
    
    # Metadata
    metadata = models.JSONField(
        default=dict,
        blank=True,
        help_text=_('Additional metadata for the item.')
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'billing_invoice_item'
        verbose_name = _('invoice item')
        verbose_name_plural = _('invoice items')
    
    def __str__(self):
        return f"{self.description} - {self.invoice.invoice_number}"
    
    def save(self, *args, **kwargs):
        # Calculate total price if not set
        if not self.total_price:
            self.total_price = self.quantity * self.unit_price
        super().save(*args, **kwargs)


class Payment(models.Model):
    """
    Payment model for tracking payments.
    """
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('succeeded', 'Succeeded'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
        ('refunded', 'Refunded'),
    ]
    
    PAYMENT_METHOD_CHOICES = [
        ('card', 'Credit Card'),
        ('bank_transfer', 'Bank Transfer'),
        ('paypal', 'PayPal'),
        ('stripe', 'Stripe'),
        ('manual', 'Manual'),
    ]
    
    invoice = models.ForeignKey(
        Invoice,
        on_delete=models.CASCADE,
        related_name='payments',
        help_text=_('Invoice this payment is for.')
    )
    
    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))],
        help_text=_('Amount of the payment.')
    )
    
    currency = models.CharField(
        max_length=3,
        default='USD',
        help_text=_('Currency code for the payment.')
    )
    
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        help_text=_('Status of the payment.')
    )
    
    payment_method = models.CharField(
        max_length=20,
        choices=PAYMENT_METHOD_CHOICES,
        default='stripe',
        help_text=_('Method used for payment.')
    )
    
    # Payment processing
    processed_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text=_('When the payment was processed.')
    )
    
    # External payment provider information
    external_payment_id = models.CharField(
        max_length=100,
        blank=True,
        help_text=_('External payment provider ID.')
    )
    
    external_transaction_id = models.CharField(
        max_length=100,
        blank=True,
        help_text=_('External transaction ID.')
    )
    
    # Error information
    error_message = models.TextField(
        blank=True,
        help_text=_('Error message if payment failed.')
    )
    
    # Metadata
    metadata = models.JSONField(
        default=dict,
        blank=True,
        help_text=_('Additional metadata for the payment.')
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'billing_payment'
        verbose_name = _('payment')
        verbose_name_plural = _('payments')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['invoice']),
            models.Index(fields=['status']),
            models.Index(fields=['payment_method']),
            models.Index(fields=['external_payment_id']),
        ]
    
    def __str__(self):
        return f"Payment {self.external_payment_id} - {self.amount} {self.currency}"
    
    @property
    def is_successful(self):
        """Check if the payment was successful."""
        return self.status == 'succeeded'
    
    @property
    def is_failed(self):
        """Check if the payment failed."""
        return self.status in ['failed', 'cancelled']
    
    def mark_as_successful(self, processed_at=None):
        """Mark the payment as successful."""
        self.status = 'succeeded'
        self.processed_at = processed_at or timezone.now()
        self.save()
        
        # Mark invoice as paid
        self.invoice.mark_as_paid()
    
    def mark_as_failed(self, error_message=''):
        """Mark the payment as failed."""
        self.status = 'failed'
        self.error_message = error_message
        self.save()


class BillingSettings(models.Model):
    """
    Billing settings for tenants.
    """
    tenant = models.OneToOneField(
        'tenants.Tenant',
        on_delete=models.CASCADE,
        related_name='billing_settings',
        help_text=_('Tenant these settings belong to.')
    )
    
    # Tax settings
    tax_rate = models.DecimalField(
        max_digits=5,
        decimal_places=4,
        default=Decimal('0.0000'),
        help_text=_('Tax rate as a decimal (e.g., 0.0825 for 8.25%).')
    )
    
    tax_number = models.CharField(
        max_length=50,
        blank=True,
        help_text=_('Tax identification number.')
    )
    
    # Billing settings
    auto_billing = models.BooleanField(
        default=True,
        help_text=_('Whether to automatically bill the tenant.')
    )
    
    grace_period_days = models.PositiveIntegerField(
        default=7,
        help_text=_('Number of days grace period before suspending service.')
    )
    
    # Payment method settings
    default_payment_method = models.CharField(
        max_length=20,
        choices=[
            ('card', 'Credit Card'),
            ('bank_transfer', 'Bank Transfer'),
            ('paypal', 'PayPal'),
        ],
        default='card',
        help_text=_('Default payment method.')
    )
    
    # Notification settings
    send_invoice_emails = models.BooleanField(
        default=True,
        help_text=_('Whether to send invoice emails.')
    )
    
    send_payment_reminders = models.BooleanField(
        default=True,
        help_text=_('Whether to send payment reminders.')
    )
    
    # Metadata
    metadata = models.JSONField(
        default=dict,
        blank=True,
        help_text=_('Additional metadata for billing settings.')
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'billing_billing_settings'
        verbose_name = _('billing settings')
        verbose_name_plural = _('billing settings')
    
    def __str__(self):
        return f"Billing Settings - {self.tenant.name}" 