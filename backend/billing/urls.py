from django.urls import path
from .views import InvoiceListView, InvoiceDetailView, PaymentProcessView

urlpatterns = [
    path('invoices/', InvoiceListView.as_view(), name='invoice-list'),
    path('invoices/<int:pk>/', InvoiceDetailView.as_view(), name='invoice-detail'),
    path('process-payment/', PaymentProcessView.as_view(), name='process-payment'),
] 