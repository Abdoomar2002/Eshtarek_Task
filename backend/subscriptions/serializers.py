from rest_framework import serializers
from .models import Plan, Subscription, PlanChange


class PlanSerializer(serializers.ModelSerializer):
    """
    Serializer for Plan model.
    """
    class Meta:
        model = Plan
        fields = [
            'id', 'name', 'slug', 'description', 'price', 'currency',
            'billing_cycle', 'max_users', 'max_storage_gb', 'max_api_calls',
            'features', 'is_active', 'is_popular', 'sort_order',
            'metadata', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class SubscriptionSerializer(serializers.ModelSerializer):
    """
    Serializer for Subscription model.
    """
    plan_details = PlanSerializer(source='plan', read_only=True)
    tenant_name = serializers.CharField(source='tenant.name', read_only=True)
    
    class Meta:
        model = Subscription
        fields = [
            'id', 'tenant', 'tenant_name', 'plan', 'plan_details', 'status',
            'current_period_start', 'current_period_end', 'trial_start',
            'trial_end', 'cancelled_at', 'cancel_at_period_end',
            'stripe_subscription_id', 'stripe_customer_id', 'current_usage',
            'metadata', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class PlanChangeSerializer(serializers.ModelSerializer):
    """
    Serializer for PlanChange model.
    """
    old_plan_name = serializers.CharField(source='old_plan.name', read_only=True)
    new_plan_name = serializers.CharField(source='new_plan.name', read_only=True)
    
    class Meta:
        model = PlanChange
        fields = [
            'id', 'subscription', 'old_plan', 'old_plan_name',
            'new_plan', 'new_plan_name', 'changed_by', 'effective_date',
            'reason', 'created_at'
        ]
        read_only_fields = ['id', 'created_at'] 