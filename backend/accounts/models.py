from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from django.core.validators import EmailValidator
from django.utils.translation import gettext_lazy as _


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'admin')

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(email, password, **extra_fields)


class User(AbstractUser):
    """
    Custom User model with tenant support and role-based permissions.
    """
    objects = UserManager()
    
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('tenant_admin', 'Tenant Admin'),
        ('user', 'User'),
    ]
    
    email = models.EmailField(
        _('email address'),
        unique=True,
        validators=[EmailValidator()],
        help_text=_('Required. Enter a valid email address.')
    )
    
    tenant = models.ForeignKey(
        'tenants.Tenant',
        on_delete=models.CASCADE,
        related_name='users',
        null=True,
        blank=True,
        help_text=_('Tenant this user belongs to.')
    )
    
    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default='user',
        help_text=_('User role within the system.')
    )
    
    is_tenant_admin = models.BooleanField(
        default=False,
        help_text=_('Designates whether this user is a tenant administrator.')
    )
    
    phone_number = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        help_text=_('User phone number.')
    )
    
    avatar = models.ImageField(
        upload_to='avatars/',
        blank=True,
        null=True,
        help_text=_('User profile picture.')
    )
    
    date_of_birth = models.DateField(
        blank=True,
        null=True,
        help_text=_('User date of birth.')
    )
    
    # Override username to use email
    username = models.CharField(
        max_length=150,
        unique=True,
        blank=True,
        null=True,
        help_text=_('Optional. 150 characters or fewer.')
    )
    
    # Make email the primary identifier
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']
    
    class Meta:
        verbose_name = _('user')
        verbose_name_plural = _('users')
        db_table = 'auth_user'
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['tenant']),
            models.Index(fields=['role']),
        ]
    
    def __str__(self):
        return self.email
    
    def get_full_name(self):
        """Return the first_name plus the last_name, with a space in between."""
        full_name = '%s %s' % (self.first_name, self.last_name)
        return full_name.strip()
    
    def get_short_name(self):
        """Return the short name for the user."""
        return self.first_name
    
    @property
    def is_admin(self):
        """Check if user is a system admin."""
        return self.role == 'admin'
    
    @property
    def is_tenant_administrator(self):
        """Check if user is a tenant administrator."""
        return self.role == 'tenant_admin' or self.is_tenant_admin
    
    def save(self, *args, **kwargs):
        # Set username to email if not provided
        if not self.username:
            self.username = self.email
        super().save(*args, **kwargs)


class UserProfile(models.Model):
    """
    Extended user profile information.
    """
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='profile'
    )
    
    bio = models.TextField(
        max_length=500,
        blank=True,
        help_text=_('User biography.')
    )
    
    website = models.URLField(
        blank=True,
        help_text=_('User website URL.')
    )
    
    location = models.CharField(
        max_length=100,
        blank=True,
        help_text=_('User location.')
    )
    
    company = models.CharField(
        max_length=100,
        blank=True,
        help_text=_('User company.')
    )
    
    job_title = models.CharField(
        max_length=100,
        blank=True,
        help_text=_('User job title.')
    )
    
    preferences = models.JSONField(
        default=dict,
        blank=True,
        help_text=_('User preferences stored as JSON.')
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'accounts_user_profile'
    
    def __str__(self):
        return f"{self.user.email} Profile" 