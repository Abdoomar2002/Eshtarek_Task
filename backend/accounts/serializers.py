from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import User, UserProfile

User = get_user_model()


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for user profile."""
    
    class Meta:
        model = UserProfile
        fields = ['bio', 'website', 'location', 'company', 'job_title', 'preferences']


class UserSerializer(serializers.ModelSerializer):
    """Serializer for user model."""
    profile = UserProfileSerializer(read_only=True)
    tenant_name = serializers.CharField(source='tenant.name', read_only=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'role', 'is_tenant_admin',
            'phone_number', 'avatar', 'date_of_birth', 'tenant', 'tenant_name',
            'profile', 'is_active', 'date_joined', 'last_login'
        ]
        read_only_fields = ['id', 'date_joined', 'last_login']


class UserRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for user registration.
    Accepts either tenant JSON object or a simple tenant_name string for convenience.
    """
    password = serializers.CharField(write_only=True, min_length=8)
    # Accept either password_confirm or password2 from clients
    password_confirm = serializers.CharField(write_only=True, required=False, allow_blank=True)
    password2 = serializers.CharField(write_only=True, required=False, allow_blank=True)
    tenant = serializers.JSONField(required=False)
    tenant_name = serializers.CharField(write_only=True, required=False, allow_blank=True)
    
    class Meta:
        model = User
        fields = [
            'email', 'first_name', 'last_name', 'password', 'password_confirm', 'password2',
            'phone_number', 'tenant', 'tenant_name'
        ]
        extra_kwargs = {
            'first_name': {'required': False, 'allow_blank': True},
            'last_name': {'required': False, 'allow_blank': True},
        }
    
    def validate(self, attrs):
        password = attrs.get('password')
        # Support both password_confirm and password2 as confirmation
        password_confirm = attrs.get('password_confirm') or attrs.get('password2')
        if password_confirm and password != password_confirm:
            raise serializers.ValidationError("Passwords don't match")
        # If confirm not provided, accept password as-is
        return attrs
    
    def create(self, validated_data):
        # Pop optional confirmation fields if present (avoid KeyError)
        validated_data.pop('password_confirm', None)
        validated_data.pop('password2', None)

        # Determine tenant assignment
        tenant_instance = validated_data.pop('tenant', None)
        tenant_name = validated_data.pop('tenant_name', '').strip() if 'tenant_name' in validated_data else ''

        # If tenant was provided as a JSON object (not an instance), ignore it here since
        # the view already handles tenant creation. Only instances are accepted at this point.

        # Elevate role when registering with a tenant
        if tenant_instance or tenant_name:
            validated_data.setdefault('role', 'tenant_admin')
            validated_data.setdefault('is_tenant_admin', True)

        # Create user with tenant if instance provided
        if tenant_instance is not None:
            user = User.objects.create_user(tenant=tenant_instance, **validated_data)
        else:
            user = User.objects.create_user(**validated_data)
        
        # Create profile
        UserProfile.objects.create(user=user)
        
        return user


class UserUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating user information."""
    profile = UserProfileSerializer(partial=True)
    
    class Meta:
        model = User
        fields = [
            'first_name', 'last_name', 'phone_number', 'avatar', 
            'date_of_birth', 'profile'
        ]
    
    def update(self, instance, validated_data):
        profile_data = validated_data.pop('profile', {})
        
        # Update user
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Update profile
        if profile_data and hasattr(instance, 'profile'):
            for attr, value in profile_data.items():
                setattr(instance.profile, attr, value)
            instance.profile.save()
        
        return instance


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer for changing password."""
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, min_length=8)
    new_password_confirm = serializers.CharField(required=True)
    
    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError("New passwords don't match")
        return attrs
    
    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Old password is incorrect")
        return value


class PasswordResetRequestSerializer(serializers.Serializer):
    """Serializer for password reset request."""
    email = serializers.EmailField()


class PasswordResetConfirmSerializer(serializers.Serializer):
    """Serializer for password reset confirmation."""
    token = serializers.CharField()
    new_password = serializers.CharField(min_length=8)
    new_password_confirm = serializers.CharField()
    
    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError("Passwords don't match")
        return attrs 