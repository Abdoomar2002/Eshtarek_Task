from django.urls import path
from .views import TenantListView, TenantDetailView

urlpatterns = [
    path('', TenantListView.as_view(), name='tenant-list'),
    path('<int:pk>/', TenantDetailView.as_view(), name='tenant-detail'),
] 