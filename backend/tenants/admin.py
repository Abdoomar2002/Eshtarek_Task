from django.contrib import admin
from .models import Tenant, Domain, TenantInvitation


class DomainInline(admin.TabularInline):
    model = Domain
    extra = 1


class TenantInvitationInline(admin.TabularInline):
    model = TenantInvitation
    extra = 0
    readonly_fields = ('token', 'expires_at', 'accepted_at')


@admin.register(Tenant)
class TenantAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'is_active', 'created_at', 'user_count')
    list_filter = ('is_active', 'created_at')
    search_fields = ('name', 'description', 'contact_email')
    prepopulated_fields = {'slug': ('name',)}
    inlines = [DomainInline, TenantInvitationInline]
    
    fieldsets = (
        (None, {
            'fields': ('name', 'slug', 'description', 'is_active')
        }),
        ('Contact Information', {
            'fields': ('contact_email', 'contact_phone')
        }),
        ('Address', {
            'fields': ('address', 'city', 'state', 'country', 'postal_code')
        }),
        ('Settings', {
            'fields': ('settings', 'metadata')
        }),
    )


@admin.register(Domain)
class DomainAdmin(admin.ModelAdmin):
    list_display = ('domain', 'tenant', 'is_primary', 'is_active')
    list_filter = ('is_primary', 'is_active', 'tenant')
    search_fields = ('domain', 'tenant__name')


@admin.register(TenantInvitation)
class TenantInvitationAdmin(admin.ModelAdmin):
    list_display = ('email', 'tenant', 'role', 'status', 'invited_by', 'expires_at')
    list_filter = ('status', 'role', 'tenant')
    search_fields = ('email', 'tenant__name')
    readonly_fields = ('token', 'expires_at', 'accepted_at') 