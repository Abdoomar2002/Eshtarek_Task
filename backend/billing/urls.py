from django.urls import re_path
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
    re_path(r'^invoices/?$', InvoiceListView.as_view(), name='invoice-list'),
    re_path(r'^invoices/(?P<pk>\d+)/?$', InvoiceDetailView.as_view(), name='invoice-detail'),
    re_path(r'^payments/?$', PaymentListView.as_view(), name='payment-list'),
    re_path(r'^process-payment/?$', process_payment, name='process-payment'),
    re_path(r'^history/?$', billing_history, name='billing-history'),
    re_path(r'^analytics/?$', billing_analytics, name='billing-analytics'),
    re_path(r'^create-subscription-invoice/?$', create_subscription_invoice, name='create-subscription-invoice'),
]