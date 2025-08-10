from django.urls import re_path
from .views import TenantListView, TenantDetailView

urlpatterns = [
    re_path(r'^$', TenantListView.as_view(), name='tenant-list'),
    re_path(r'^(?P<pk>\d+)/?$', TenantDetailView.as_view(), name='tenant-detail'),
]