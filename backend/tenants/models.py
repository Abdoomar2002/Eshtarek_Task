from django.db import models
from django.utils.translation import gettext_lazy as _
from django.core.validators import URLValidator
from django.utils import timezone


class Tenant(models.Model):
    """
    Tenant model for multi-tenant architecture.
    """
    name = models.CharField(
        max_length=100,
        unique=True,
        help_text=_('Unique name for the tenant.')
    )
    
    slug = models.SlugField(
        max_length=100,
        unique=True,
        help_text=_('URL-friendly identifier for the tenant.')
    )
    
    description = models.TextField(
        blank=True,
        help_text=_('Description of the tenant.')
    )
    
    is_active = models.BooleanField(
        default=True,
        help_text=_('Whether the tenant is active.')
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Contact information
    contact_email = models.EmailField(
        blank=True,
        help_text=_('Primary contact email for the tenant.')
    )
    
    contact_phone = models.CharField(
        max_length=20,
        blank=True,
        help_text=_('Primary contact phone for the tenant.')
    )
    
    # Address information
    address = models.TextField(
        blank=True,
        help_text=_('Physical address of the tenant.')
    )
    
    city = models.CharField(
        max_length=100,
        blank=True,
        help_text=_('City of the tenant.')
    )
    
    state = models.CharField(
        max_length=100,
        blank=True,
        help_text=_('State/province of the tenant.')
    )
    
    country = models.CharField(
        max_length=100,
        blank=True,
        help_text=_('Country of the tenant.')
    )
    
    postal_code = models.CharField(
        max_length=20,
        blank=True,
        help_text=_('Postal code of the tenant.')
    )
    
    # Settings
    settings = models.JSONField(
        default=dict,
        blank=True,
        help_text=_('Tenant-specific settings stored as JSON.')
    )
    
    # Metadata
    metadata = models.JSONField(
        default=dict,
        blank=True,
        help_text=_('Additional metadata for the tenant.')
    )
    
    class Meta:
        db_table = 'tenants_tenant'
        verbose_name = _('tenant')
        verbose_name_plural = _('tenants')
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['slug']),
            models.Index(fields=['is_active']),
        ]
    
    def __str__(self):
        return self.name
    
    def save(self, *args, **kwargs):
        # Generate slug from name if not provided
        if not self.slug:
            self.slug = self.name.lower().replace(' ', '-')
        super().save(*args, **kwargs)
    
    @property
    def user_count(self):
        """Get the number of users in this tenant."""
        return self.users.count()
    
    @property
    def active_subscription(self):
        """Get the active subscription for this tenant."""
        return self.subscriptions.filter(is_active=True).first()
    
    @property
    def current_plan(self):
        """Get the current plan for this tenant."""
        subscription = self.active_subscription
        return subscription.plan if subscription else None


class Domain(models.Model):
    """
    Domain model for tenant-specific domains.
    """
    tenant = models.ForeignKey(
        Tenant,
        on_delete=models.CASCADE,
        related_name='domains',
        help_text=_('Tenant this domain belongs to.')
    )
    
    domain = models.CharField(
        max_length=253,
        unique=True,
        validators=[URLValidator(schemes=['http', 'https'])],
        help_text=_('Domain name for the tenant.')
    )
    
    is_primary = models.BooleanField(
        default=False,
        help_text=_('Whether this is the primary domain for the tenant.')
    )
    
    is_active = models.BooleanField(
        default=True,
        help_text=_('Whether this domain is active.')
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'tenants_domain'
        verbose_name = _('domain')
        verbose_name_plural = _('domains')
        indexes = [
            models.Index(fields=['domain']),
            models.Index(fields=['is_primary']),
            models.Index(fields=['is_active']),
        ]
    
    def __str__(self):
        return self.domain
    
    def save(self, *args, **kwargs):
        # Ensure only one primary domain per tenant
        if self.is_primary:
            Domain.objects.filter(
                tenant=self.tenant,
                is_primary=True
            ).exclude(id=self.id).update(is_primary=False)
        super().save(*args, **kwargs)


class TenantInvitation(models.Model):
    """
    Model for tenant invitations.
    """
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('declined', 'Declined'),
        ('expired', 'Expired'),
    ]
    
    tenant = models.ForeignKey(
        Tenant,
        on_delete=models.CASCADE,
        related_name='invitations',
        help_text=_('Tenant this invitation is for.')
    )
    
    email = models.EmailField(
        help_text=_('Email address of the invited user.')
    )
    
    role = models.CharField(
        max_length=20,
        choices=[
            ('user', 'User'),
            ('tenant_admin', 'Tenant Admin'),
        ],
        default='user',
        help_text=_('Role to assign to the invited user.')
    )
    
    invited_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='sent_invitations',
        help_text=_('User who sent the invitation.')
    )
    
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        help_text=_('Status of the invitation.')
    )
    
    token = models.CharField(
        max_length=100,
        unique=True,
        help_text=_('Unique token for the invitation.')
    )
    
    expires_at = models.DateTimeField(
        help_text=_('When the invitation expires.')
    )
    
    accepted_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text=_('When the invitation was accepted.')
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'tenants_tenant_invitation'
        verbose_name = _('tenant invitation')
        verbose_name_plural = _('tenant invitations')
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['status']),
            models.Index(fields=['token']),
            models.Index(fields=['expires_at']),
        ]
    
    def __str__(self):
        return f"Invitation for {self.email} to {self.tenant.name}"
    
    @property
    def is_expired(self):
        """Check if the invitation has expired."""
        return timezone.now() > self.expires_at
    
    def accept(self, user):
        """Accept the invitation for a user."""
        if self.is_expired:
            raise ValueError("Invitation has expired")
        
        if self.status != 'pending':
            raise ValueError("Invitation is not pending")
        
        # Assign user to tenant
        user.tenant = self.tenant
        user.role = self.role
        if self.role == 'tenant_admin':
            user.is_tenant_admin = True
        user.save()
        
        # Update invitation
        self.status = 'accepted'
        self.accepted_at = timezone.now()
        self.save()
    
    def decline(self):
        """Decline the invitation."""
        if self.status != 'pending':
            raise ValueError("Invitation is not pending")
        
        self.status = 'declined'
        self.save() 