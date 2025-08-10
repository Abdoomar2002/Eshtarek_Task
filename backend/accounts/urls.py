from django.urls import re_path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    CustomTokenObtainPairView,
    register,
    logout,
    me,
    update_profile,
    UserListView,
    UserDetailView,
)

urlpatterns = [
    # JWT Authentication
    re_path(r'^token/?$', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    re_path(r'^token/refresh/?$', TokenRefreshView.as_view(), name='token_refresh'),
    
    # User Authentication
    re_path(r'^login/?$', CustomTokenObtainPairView.as_view(), name='login'),
    re_path(r'^register/?$', register, name='register'),
    re_path(r'^logout/?$', logout, name='logout'),
    
    # User Profile
    re_path(r'^profile/?$', update_profile, name='profile'),
    re_path(r'^me/?$', me, name='me'),
]