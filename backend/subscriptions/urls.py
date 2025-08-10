from django.urls import path
from .views import PlanListView, PlanDetailView, SubscriptionListView, SubscriptionDetailView, UsageView

urlpatterns = [
    path('plans/', PlanListView.as_view(), name='plan-list'),
    path('plans/<int:pk>/', PlanDetailView.as_view(), name='plan-detail'),
    path('', SubscriptionListView.as_view(), name='subscription-list'),
    path('<int:pk>/', SubscriptionDetailView.as_view(), name='subscription-detail'),
    path('usage/', UsageView.as_view(), name='subscription-usage'),
] 