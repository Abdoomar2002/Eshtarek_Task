from django.urls import path
from .views import (
    InvoiceListView,
    InvoiceDetailView,
    PaymentListView,
    process_payment,
    billing_history,
    billing_analytics,
    create_subscription_invoice,
)

urlpatterns = [
    path('invoices/', InvoiceListView.as_view(), name='invoice-list'),
    path('invoices/<int:pk>/', InvoiceDetailView.as_view(), name='invoice-detail'),
    path('payments/', PaymentListView.as_view(), name='payment-list'),
    path('process-payment/', process_payment, name='process-payment'),
    path('history/', billing_history, name='billing-history'),
    path('analytics/', billing_analytics, name='billing-analytics'),
    path('create-subscription-invoice/', create_subscription_invoice, name='create-subscription-invoice'),
] 