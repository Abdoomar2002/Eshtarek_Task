from rest_framework import serializers
from .models import Tenant, Domain, TenantInvitation


class TenantSerializer(serializers.ModelSerializer):
    """
    Serializer for Tenant model.
    """
    user_count = serializers.ReadOnlyField()
    
    class Meta:
        model = Tenant
        fields = [
            'id', 'name', 'slug', 'description', 'is_active', 'created_at',
            'updated_at', 'contact_email', 'contact_phone', 'address',
            'city', 'state', 'country', 'postal_code', 'settings',
            'metadata', 'user_count'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class DomainSerializer(serializers.ModelSerializer):
    """
    Serializer for Domain model.
    """
    class Meta:
        model = Domain
        fields = [
            'id', 'tenant', 'domain', 'is_primary', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class TenantInvitationSerializer(serializers.ModelSerializer):
    """
    Serializer for TenantInvitation model.
    """
    class Meta:
        model = TenantInvitation
        fields = [
            'id', 'tenant', 'email', 'role', 'invited_by', 'status',
            'token', 'expires_at', 'accepted_at', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'token', 'created_at', 'updated_at'] 