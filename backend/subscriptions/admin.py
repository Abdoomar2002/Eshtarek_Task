from django.contrib import admin
from .models import Plan, Subscription, PlanChange


@admin.register(Plan)
class PlanAdmin(admin.ModelAdmin):
    list_display = ('name', 'price', 'currency', 'billing_cycle', 'max_users', 'is_active', 'is_popular')
    list_filter = ('is_active', 'is_popular', 'billing_cycle', 'currency')
    search_fields = ('name', 'description')
    prepopulated_fields = {'slug': ('name',)}
    
    fieldsets = (
        (None, {
            'fields': ('name', 'slug', 'description', 'is_active', 'is_popular', 'sort_order')
        }),
        ('Pricing', {
            'fields': ('price', 'currency', 'billing_cycle')
        }),
        ('Limits', {
            'fields': ('max_users', 'max_storage_gb', 'max_api_calls')
        }),
        ('Features', {
            'fields': ('features',)
        }),
        ('Metadata', {
            'fields': ('metadata',)
        }),
    )


@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = ('tenant', 'plan', 'status', 'current_period_end', 'is_active')
    list_filter = ('status', 'plan', 'tenant', 'created_at')
    search_fields = ('tenant__name', 'plan__name')
    readonly_fields = ('stripe_subscription_id', 'stripe_customer_id')
    
    fieldsets = (
        (None, {
            'fields': ('tenant', 'plan', 'status')
        }),
        ('Billing Period', {
            'fields': ('current_period_start', 'current_period_end')
        }),
        ('Trial', {
            'fields': ('trial_start', 'trial_end')
        }),
        ('Cancellation', {
            'fields': ('cancelled_at', 'cancel_at_period_end')
        }),
        ('Payment', {
            'fields': ('stripe_subscription_id', 'stripe_customer_id')
        }),
        ('Usage', {
            'fields': ('current_usage',)
        }),
        ('Metadata', {
            'fields': ('metadata',)
        }),
    )


@admin.register(PlanChange)
class PlanChangeAdmin(admin.ModelAdmin):
    list_display = ('subscription', 'old_plan', 'new_plan', 'changed_by', 'effective_date')
    list_filter = ('effective_date', 'old_plan', 'new_plan')
    search_fields = ('subscription__tenant__name', 'reason')
    readonly_fields = ('created_at',) 