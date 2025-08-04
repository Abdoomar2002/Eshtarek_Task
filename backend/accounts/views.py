from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils import timezone

from .serializers import (
    CustomTokenObtainPairSerializer,
    UserRegistrationSerializer,
    UserLoginSerializer,
    UserSerializer,
    UserUpdateSerializer,
    UserProfileSerializer,
    ChangePasswordSerializer,
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer
)
from .permissions import IsTenantAdminOrReadOnly, IsOwnerOrTenantAdmin
from tenants.models import Tenant

User = get_user_model()


class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Custom token obtain pair view with tenant information.
    """
    serializer_class = CustomTokenObtainPairSerializer


class CustomTokenRefreshView(TokenRefreshView):
    """
    Custom token refresh view.
    """
    pass


class UserRegistrationView(APIView):
    """
    User registration view with tenant creation support.
    """
    permission_classes = [permissions.AllowAny]
    
    @transaction.atomic
    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            tenant_name = request.data.get('tenant_name')
            
            # Create tenant if name is provided
            tenant = None
            if tenant_name:
                tenant = Tenant.objects.create(
                    name=tenant_name,
                    is_active=True
                )
            
            # Create user
            user = serializer.save()
            
            # Assign tenant to user
            if tenant:
                user.tenant = tenant
                user.role = 'tenant_admin'
                user.is_tenant_admin = True
                user.save()
            
            # Generate tokens
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'message': 'User registered successfully',
                'user': UserSerializer(user).data,
                'tokens': {
                    'access': str(refresh.access_token),
                    'refresh': str(refresh),
                }
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserLoginView(APIView):
    """
    User login view.
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = UserLoginSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            user = serializer.validated_data['user']
            
            # Update last login
            user.last_login = timezone.now()
            user.save()
            
            # Generate tokens
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'message': 'Login successful',
                'user': UserSerializer(user).data,
                'tokens': {
                    'access': str(refresh.access_token),
                    'refresh': str(refresh),
                }
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserLogoutView(APIView):
    """
    User logout view.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        try:
            refresh_token = request.data.get('refresh_token')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            
            return Response({
                'message': 'Logout successful'
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                'error': 'Invalid token'
            }, status=status.HTTP_400_BAD_REQUEST)


class UserProfileView(generics.RetrieveUpdateAPIView):
    """
    User profile view for retrieving and updating user information.
    """
    serializer_class = UserUpdateSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        return self.request.user


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    User detail view for admin/tenant admin operations.
    """
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated, IsTenantAdminOrReadOnly]
    queryset = User.objects.all()
    
    def get_queryset(self):
        user = self.request.user
        
        # System admin can see all users
        if user.is_admin:
            return User.objects.all()
        
        # Tenant admin can only see users from their tenant
        if user.is_tenant_administrator and user.tenant:
            return User.objects.filter(tenant=user.tenant)
        
        # Regular users can only see themselves
        return User.objects.filter(id=user.id)


class UserListView(generics.ListCreateAPIView):
    """
    User list view for admin/tenant admin operations.
    """
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated, IsTenantAdminOrReadOnly]
    
    def get_queryset(self):
        user = self.request.user
        
        # System admin can see all users
        if user.is_admin:
            return User.objects.all()
        
        # Tenant admin can only see users from their tenant
        if user.is_tenant_administrator and user.tenant:
            return User.objects.filter(tenant=user.tenant)
        
        # Regular users cannot list other users
        return User.objects.none()
    
    def perform_create(self, serializer):
        user = self.request.user
        
        # System admin can create users for any tenant
        if user.is_admin:
            tenant_id = self.request.data.get('tenant')
            if tenant_id:
                tenant = Tenant.objects.get(id=tenant_id)
                serializer.save(tenant=tenant)
            else:
                serializer.save()
        
        # Tenant admin can only create users for their tenant
        elif user.is_tenant_administrator and user.tenant:
            serializer.save(tenant=user.tenant)


class ChangePasswordView(APIView):
    """
    Change password view.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            user = request.user
            user.set_password(serializer.validated_data['new_password'])
            user.save()
            
            return Response({
                'message': 'Password changed successfully'
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PasswordResetRequestView(APIView):
    """
    Password reset request view.
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            # In a real application, you would send an email here
            # For now, we'll just return a success message
            
            return Response({
                'message': f'Password reset email sent to {email}'
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PasswordResetConfirmView(APIView):
    """
    Password reset confirmation view.
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        if serializer.is_valid():
            # In a real application, you would validate the token here
            # For now, we'll just return a success message
            
            return Response({
                'message': 'Password reset successful'
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def me(request):
    """
    Get current user information.
    """
    serializer = UserSerializer(request.user)
    return Response(serializer.data) 