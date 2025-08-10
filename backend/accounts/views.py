from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import authenticate
from django.db import transaction
from .models import User
from .serializers import UserSerializer, UserRegistrationSerializer
from tenants.models import Tenant
from tenants.serializers import TenantSerializer


class CustomTokenObtainPairView(TokenObtainPairView):
    """Custom token obtain view with tenant information."""
    
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        
        if response.status_code == 200:
            # Add user and tenant information to response
            user = authenticate(
                request,
                username=request.data.get('email'),
                password=request.data.get('password')
            )
            if user:
                response.data['user'] = UserSerializer(user).data
                if user.tenant:
                    response.data['tenant'] = TenantSerializer(user.tenant).data
        
        return response


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    """User registration with tenant creation."""
    serializer = UserRegistrationSerializer(data=request.data)
    
    if serializer.is_valid():
        try:
            with transaction.atomic():
                # Create tenant if provided
                tenant_data = serializer.validated_data.pop('tenant', None)
                tenant = None
                
                if tenant_data:
                    tenant_serializer = TenantSerializer(data=tenant_data)
                    if tenant_serializer.is_valid():
                        tenant = tenant_serializer.save()
                
                # Create user
                user = serializer.save(tenant=tenant)
                
                # Generate tokens
                refresh = RefreshToken.for_user(user)
                
                return Response({
                    'user': UserSerializer(user).data,
                    'tenant': TenantSerializer(tenant).data if tenant else None,
                    'tokens': {
                        'access': str(refresh.access_token),
                        'refresh': str(refresh),
                    }
                }, status=status.HTTP_201_CREATED)
        
        except Exception as e:
            return Response({
                'error': 'Registration failed',
                'details': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
    """User logout with token blacklisting."""
    try:
        refresh_token = request.data.get('refresh_token')
        if refresh_token:
            token = RefreshToken(refresh_token)
            token.blacklist()
        
        return Response({'message': 'Successfully logged out'})
    except Exception as e:
        return Response({
            'error': 'Logout failed',
            'details': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me(request):
    """Get current user information."""
    serializer = UserSerializer(request.user)
    data = serializer.data
    
    # Add tenant information
    if request.user.tenant:
        data['tenant'] = TenantSerializer(request.user.tenant).data
    
    return Response(data)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_profile(request):
    """Update user profile."""
    serializer = UserSerializer(request.user, data=request.data, partial=True)
    
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserListView(generics.ListCreateAPIView):
    """List and create users (tenant-scoped)."""
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Filter users by tenant
        if self.request.user.is_admin:
            return User.objects.all()
        elif self.request.user.tenant:
            return User.objects.filter(tenant=self.request.user.tenant)
        return User.objects.none()
    
    def perform_create(self, serializer):
        # Assign to current tenant if not admin
        if not self.request.user.is_admin and self.request.user.tenant:
            serializer.save(tenant=self.request.user.tenant)
        else:
            serializer.save()


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, and delete user."""
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Filter users by tenant
        if self.request.user.is_admin:
            return User.objects.all()
        elif self.request.user.tenant:
            return User.objects.filter(tenant=self.request.user.tenant)
        return User.objects.none() 