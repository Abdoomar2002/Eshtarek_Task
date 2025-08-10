from django.urls import re_path
from .views import PlanListView, PlanDetailView, SubscriptionListView, SubscriptionDetailView, UsageView

urlpatterns = [
    re_path(r'^plans/?$', PlanListView.as_view(), name='plan-list'),
    re_path(r'^plans/(?P<pk>\d+)/?$', PlanDetailView.as_view(), name='plan-detail'),
    re_path(r'^$', SubscriptionListView.as_view(), name='subscription-list'),
    re_path(r'^(?P<pk>\d+)/?$', SubscriptionDetailView.as_view(), name='subscription-detail'),
    re_path(r'^usage/?$', UsageView.as_view(), name='subscription-usage'),
]