from django.urls import path
from .views import PlanListView, PlanDetailView, SubscriptionListView, SubscriptionDetailView

urlpatterns = [
    path('plans/', PlanListView.as_view(), name='plan-list'),
    path('plans/<int:pk>/', PlanDetailView.as_view(), name='plan-detail'),
    path('', SubscriptionListView.as_view(), name='subscription-list'),
    path('<int:pk>/', SubscriptionDetailView.as_view(), name='subscription-detail'),
] 