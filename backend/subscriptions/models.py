from django.db import models
from django.utils.translation import gettext_lazy as _
from django.core.validators import MinValueValidator
from django.utils import timezone
from decimal import Decimal


class Plan(models.Model):
    """
    Subscription plan model.
    """
    name = models.CharField(
        max_length=100,
        unique=True,
        help_text=_('Name of the subscription plan.')
    )
    
    slug = models.SlugField(
        max_length=100,
        unique=True,
        help_text=_('URL-friendly identifier for the plan.')
    )
    
    description = models.TextField(
        blank=True,
        help_text=_('Description of the plan.')
    )
    
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))],
        help_text=_('Monthly price of the plan.')
    )
    
    currency = models.CharField(
        max_length=3,
        default='USD',
        help_text=_('Currency code for the plan price.')
    )
    
    billing_cycle = models.CharField(
        max_length=20,
        choices=[
            ('monthly', 'Monthly'),
            ('yearly', 'Yearly'),
            ('quarterly', 'Quarterly'),
        ],
        default='monthly',
        help_text=_('Billing cycle for the plan.')
    )
    
    # Usage limits
    max_users = models.PositiveIntegerField(
        default=1,
        help_text=_('Maximum number of users allowed.')
    )
    
    max_storage_gb = models.PositiveIntegerField(
        default=1,
        help_text=_('Maximum storage in GB.')
    )
    
    max_api_calls = models.PositiveIntegerField(
        default=1000,
        help_text=_('Maximum API calls per month.')
    )
    
    # Features
    features = models.JSONField(
        default=list,
        blank=True,
        help_text=_('List of features included in this plan.')
    )
    
    # Plan settings
    is_active = models.BooleanField(
        default=True,
        help_text=_('Whether the plan is available for subscription.')
    )
    
    is_popular = models.BooleanField(
        default=False,
        help_text=_('Whether to highlight this plan as popular.')
    )
    
    sort_order = models.PositiveIntegerField(
        default=0,
        help_text=_('Order for displaying plans.')
    )
    
    # Metadata
    metadata = models.JSONField(
        default=dict,
        blank=True,
        help_text=_('Additional metadata for the plan.')
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'subscriptions_plan'
        verbose_name = _('plan')
        verbose_name_plural = _('plans')
        ordering = ['sort_order', 'price']
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['slug']),
            models.Index(fields=['is_active']),
            models.Index(fields=['price']),
        ]
    
    def __str__(self):
        return self.name
    
    def save(self, *args, **kwargs):
        # Generate slug from name if not provided
        if not self.slug:
            self.slug = self.name.lower().replace(' ', '-')
        super().save(*args, **kwargs)
    
    @property
    def yearly_price(self):
        """Get the yearly price for this plan."""
        if self.billing_cycle == 'yearly':
            return self.price
        elif self.billing_cycle == 'monthly':
            return self.price * 12
        elif self.billing_cycle == 'quarterly':
            return self.price * 4
        return self.price
    
    @property
    def monthly_price(self):
        """Get the monthly price for this plan."""
        if self.billing_cycle == 'monthly':
            return self.price
        elif self.billing_cycle == 'yearly':
            return self.price / 12
        elif self.billing_cycle == 'quarterly':
            return self.price / 3
        return self.price


class Subscription(models.Model):
    """
    Subscription model for tenant subscriptions.
    """
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('cancelled', 'Cancelled'),
        ('past_due', 'Past Due'),
        ('unpaid', 'Unpaid'),
        ('trial', 'Trial'),
    ]
    
    tenant = models.ForeignKey(
        'tenants.Tenant',
        on_delete=models.CASCADE,
        related_name='subscriptions',
        help_text=_('Tenant this subscription belongs to.')
    )
    
    plan = models.ForeignKey(
        Plan,
        on_delete=models.PROTECT,
        related_name='subscriptions',
        help_text=_('Plan for this subscription.')
    )
    
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='inactive',
        help_text=_('Status of the subscription.')
    )
    
    # Billing information
    current_period_start = models.DateTimeField(
        help_text=_('Start of the current billing period.')
    )
    
    current_period_end = models.DateTimeField(
        help_text=_('End of the current billing period.')
    )
    
    # Trial information
    trial_start = models.DateTimeField(
        null=True,
        blank=True,
        help_text=_('Start of the trial period.')
    )
    
    trial_end = models.DateTimeField(
        null=True,
        blank=True,
        help_text=_('End of the trial period.')
    )
    
    # Cancellation information
    cancelled_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text=_('When the subscription was cancelled.')
    )
    
    cancel_at_period_end = models.BooleanField(
        default=False,
        help_text=_('Whether to cancel at the end of the current period.')
    )
    
    # Payment information
    stripe_subscription_id = models.CharField(
        max_length=100,
        blank=True,
        help_text=_('Stripe subscription ID.')
    )
    
    stripe_customer_id = models.CharField(
        max_length=100,
        blank=True,
        help_text=_('Stripe customer ID.')
    )
    
    # Usage tracking
    current_usage = models.JSONField(
        default=dict,
        blank=True,
        help_text=_('Current usage statistics.')
    )
    
    # Metadata
    metadata = models.JSONField(
        default=dict,
        blank=True,
        help_text=_('Additional metadata for the subscription.')
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'subscriptions_subscription'
        verbose_name = _('subscription')
        verbose_name_plural = _('subscriptions')
        indexes = [
            models.Index(fields=['tenant']),
            models.Index(fields=['plan']),
            models.Index(fields=['status']),
            models.Index(fields=['current_period_end']),
        ]
    
    def __str__(self):
        return f"{self.tenant.name} - {self.plan.name}"
    
    @property
    def is_active(self):
        """Check if the subscription is currently active."""
        return self.status in ['active', 'trial']
    
    @property
    def is_trial(self):
        """Check if the subscription is in trial period."""
        if not self.trial_end:
            return False
        return timezone.now() < self.trial_end
    
    @property
    def days_until_renewal(self):
        """Get the number of days until the next renewal."""
        if not self.current_period_end:
            return None
        delta = self.current_period_end - timezone.now()
        return max(0, delta.days)
    
    @property
    def usage_percentage(self):
        """Get the usage percentage for the current plan limits."""
        if not self.current_usage:
            return 0
        
        usage = self.current_usage.get('users', 0)
        limit = self.plan.max_users
        
        if limit == 0:
            return 0
        
        return min(100, (usage / limit) * 100)
    
    def cancel(self, at_period_end=True):
        """Cancel the subscription."""
        if at_period_end:
            self.cancel_at_period_end = True
            self.status = 'active'  # Keep active until period ends
        else:
            self.status = 'cancelled'
            self.cancelled_at = timezone.now()
        
        self.save()
    
    def reactivate(self):
        """Reactivate a cancelled subscription."""
        if self.status == 'cancelled':
            self.status = 'active'
            self.cancelled_at = None
            self.cancel_at_period_end = False
            self.save()


class PlanChange(models.Model):
    """
    Model to track plan changes.
    """
    subscription = models.ForeignKey(
        Subscription,
        on_delete=models.CASCADE,
        related_name='plan_changes',
        help_text=_('Subscription that was changed.')
    )
    
    old_plan = models.ForeignKey(
        Plan,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='old_plan_changes',
        help_text=_('Previous plan.')
    )
    
    new_plan = models.ForeignKey(
        Plan,
        on_delete=models.PROTECT,
        related_name='new_plan_changes',
        help_text=_('New plan.')
    )
    
    changed_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='plan_changes',
        help_text=_('User who made the change.')
    )
    
    effective_date = models.DateTimeField(
        help_text=_('When the change takes effect.')
    )
    
    reason = models.TextField(
        blank=True,
        help_text=_('Reason for the plan change.')
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'subscriptions_plan_change'
        verbose_name = _('plan change')
        verbose_name_plural = _('plan changes')
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.subscription.tenant.name}: {self.old_plan} → {self.new_plan}" 