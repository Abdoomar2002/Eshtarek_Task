# API Documentation

## Base URL
```
http://localhost:8000/api
```

## Authentication

All API requests require authentication via JWT tokens, except for login and register endpoints.

### Headers
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

## Endpoints

### Authentication

#### Register User
```http
POST /auth/register/
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "password_confirm": "password123",
  "first_name": "John",
  "last_name": "Doe",
  "phone_number": "+1234567890",
  "tenant": {
    "name": "My Company",
    "description": "Company description",
    "contact_email": "admin@mycompany.com",
    "contact_phone": "+1234567890",
    "address": "123 Main St",
    "city": "New York",
    "state": "NY",
    "country": "USA",
    "postal_code": "10001"
  }
}
```

**Response:**
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "tenant_admin",
    "tenant": 1
  },
  "tenant": {
    "id": 1,
    "name": "My Company",
    "slug": "my-company"
  },
  "tokens": {
    "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
  }
}
```

#### Login User
```http
POST /auth/login/
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "tenant_admin",
    "tenant": 1
  },
  "tenant": {
    "id": 1,
    "name": "My Company"
  }
}
```

#### Logout User
```http
POST /auth/logout/
```

**Request Body:**
```json
{
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

**Response:**
```json
{
  "message": "Successfully logged out"
}
```

#### Get Current User
```http
GET /auth/me/
```

**Response:**
```json
{
  "id": 1,
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "role": "tenant_admin",
  "tenant": 1,
  "tenant_name": "My Company"
}
```

### Tenants

#### List Tenants (Admin Only)
```http
GET /tenants/
```

**Response:**
```json
{
  "count": 3,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "name": "TechCorp",
      "slug": "techcorp",
      "description": "Technology company",
      "is_active": true,
      "contact_email": "admin@techcorp.com",
      "user_count": 12
    }
  ]
}
```

#### Get Tenant Details
```http
GET /tenants/{id}/
```

**Response:**
```json
{
  "id": 1,
  "name": "TechCorp",
  "slug": "techcorp",
  "description": "Technology company",
  "is_active": true,
  "contact_email": "admin@techcorp.com",
  "contact_phone": "+1234567890",
  "address": "123 Tech Street",
  "city": "San Francisco",
  "state": "CA",
  "country": "USA",
  "postal_code": "94105",
  "user_count": 12,
  "active_subscription": {
    "id": 1,
    "plan": {
      "name": "Pro",
      "price": "29.99"
    },
    "status": "active"
  }
}
```

#### Create Tenant (Admin Only)
```http
POST /tenants/
```

**Request Body:**
```json
{
  "name": "New Company",
  "description": "A new company",
  "contact_email": "admin@newcompany.com",
  "contact_phone": "+1234567890",
  "address": "456 Business Ave",
  "city": "New York",
  "state": "NY",
  "country": "USA",
  "postal_code": "10001"
}
```

#### Update Tenant
```http
PUT /tenants/{id}/
```

#### Delete Tenant (Admin Only)
```http
DELETE /tenants/{id}/
```

### Subscription Plans

#### List Plans
```http
GET /subscriptions/plans/
```

**Response:**
```json
{
  "count": 3,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "name": "Free",
      "slug": "free",
      "description": "Perfect for small teams",
      "price": "0.00",
      "currency": "USD",
      "billing_cycle": "monthly",
      "max_users": 5,
      "max_storage_gb": 1,
      "max_api_calls": 1000,
      "features": ["Basic Analytics", "Email Support"],
      "is_active": true,
      "is_popular": false
    }
  ]
}
```

#### Get Plan Details
```http
GET /subscriptions/plans/{id}/
```

#### Create Plan (Admin Only)
```http
POST /subscriptions/plans/
```

**Request Body:**
```json
{
  "name": "Custom Plan",
  "description": "Custom plan for specific needs",
  "price": "49.99",
  "currency": "USD",
  "billing_cycle": "monthly",
  "max_users": 50,
  "max_storage_gb": 25,
  "max_api_calls": 50000,
  "features": ["Custom Analytics", "Priority Support", "API Access"],
  "is_active": true
}
```

#### Update Plan (Admin Only)
```http
PUT /subscriptions/plans/{id}/
```

#### Delete Plan (Admin Only)
```http
DELETE /subscriptions/plans/{id}/
```

### Subscriptions

#### List Subscriptions
```http
GET /subscriptions/
```

**Response:**
```json
{
  "count": 1,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "tenant": 1,
      "plan": {
        "id": 2,
        "name": "Pro",
        "price": "29.99"
      },
      "status": "active",
      "current_period_start": "2024-01-01T00:00:00Z",
      "current_period_end": "2024-02-01T00:00:00Z",
      "usage_percentage": 60
    }
  ]
}
```

#### Create Subscription
```http
POST /subscriptions/
```

**Request Body:**
```json
{
  "plan": 2,
  "billing_cycle": "monthly"
}
```

#### Update Subscription
```http
PUT /subscriptions/{id}/
```

#### Cancel Subscription
```http
DELETE /subscriptions/{id}/
```

### Users

#### List Users
```http
GET /users/
```

**Response:**
```json
{
  "count": 5,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "email": "user@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "role": "tenant_admin",
      "is_tenant_admin": true,
      "tenant": 1,
      "tenant_name": "TechCorp",
      "is_active": true,
      "date_joined": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### Create User
```http
POST /users/
```

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "first_name": "Jane",
  "last_name": "Smith",
  "role": "user",
  "phone_number": "+1234567890"
}
```

#### Get User Details
```http
GET /users/{id}/
```

#### Update User
```http
PUT /users/{id}/
```

#### Delete User
```http
DELETE /users/{id}/
```

### Billing

#### List Invoices
```http
GET /billing/invoices/
```

**Response:**
```json
{
  "count": 3,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "invoice_number": "INV-202401-ABC12345",
      "tenant": 1,
      "subscription": 1,
      "status": "paid",
      "subtotal": "29.99",
      "tax_amount": "2.40",
      "total_amount": "32.39",
      "currency": "USD",
      "issue_date": "2024-01-01T00:00:00Z",
      "due_date": "2024-01-31T00:00:00Z",
      "paid_date": "2024-01-15T00:00:00Z",
      "is_paid": true,
      "is_overdue": false
    }
  ]
}
```

#### Get Invoice Details
```http
GET /billing/invoices/{id}/
```

#### Process Payment
```http
POST /billing/process-payment/
```

**Request Body:**
```json
{
  "invoice_id": 1,
  "payment_method": "stripe",
  "amount": "32.39"
}
```

**Response:**
```json
{
  "success": true,
  "payment_id": 1,
  "transaction_id": "txn_abc123def456",
  "message": "Payment processed successfully"
}
```

#### Get Billing History
```http
GET /billing/history/
```

**Response:**
```json
{
  "summary": {
    "total_invoiced": 299.99,
    "total_paid": 299.99,
    "outstanding": 0,
    "invoice_count": 10,
    "payment_count": 10
  },
  "invoices": [...],
  "payments": [...]
}
```

#### Get Billing Analytics
```http
GET /billing/analytics/
```

**Admin Response:**
```json
{
  "total_tenants": 15,
  "total_revenue": 14999.99,
  "active_subscriptions": 12,
  "monthly_revenue": 1249.99
}
```

**Tenant Response:**
```json
{
  "total_spent": 299.99,
  "invoice_count": 10,
  "current_plan": "Pro",
  "plan_price": 29.99,
  "next_billing": "2024-02-01T00:00:00Z"
}
```

## Error Responses

### Validation Error
```json
{
  "error": "Validation failed",
  "details": {
    "email": ["This field is required."],
    "password": ["This password is too short."]
  }
}
```

### Authentication Error
```json
{
  "detail": "Authentication credentials were not provided."
}
```

### Permission Error
```json
{
  "error": "Permission denied",
  "details": "You don't have permission to perform this action."
}
```

### Not Found Error
```json
{
  "error": "Resource not found",
  "details": "The requested resource does not exist."
}
```

## Rate Limiting

The API implements rate limiting to prevent abuse:
- **Authenticated users**: 1000 requests per hour
- **Unauthenticated users**: 100 requests per hour

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
```

## Pagination

List endpoints support pagination with the following parameters:
- `page`: Page number (default: 1)
- `page_size`: Items per page (default: 20, max: 100)

Response format:
```json
{
  "count": 100,
  "next": "http://localhost:8000/api/endpoint/?page=2",
  "previous": null,
  "results": [...]
}
```

## Filtering and Searching

Many endpoints support filtering and searching:

### Filtering
```
GET /users/?role=tenant_admin&is_active=true
```

### Searching
```
GET /users/?search=john
```

### Ordering
```
GET /users/?ordering=-date_joined
```

## Webhooks (Future Feature)

The system will support webhooks for real-time notifications:
- Subscription events (created, updated, cancelled)
- Payment events (succeeded, failed)
- User events (created, updated, deleted)

## SDKs and Libraries

### JavaScript/TypeScript
```javascript
import { SubscriptionAPI } from '@eshtarek/subscription-sdk';

const api = new SubscriptionAPI({
  baseURL: 'http://localhost:8000/api',
  token: 'your-jwt-token'
});

// Create subscription
const subscription = await api.subscriptions.create({
  plan: 2,
  billing_cycle: 'monthly'
});
```

### Python
```python
from eshtarek_subscription import SubscriptionClient

client = SubscriptionClient(
    base_url='http://localhost:8000/api',
    token='your-jwt-token'
)

# Create subscription
subscription = client.subscriptions.create(
    plan=2,
    billing_cycle='monthly'
)
```

## Testing

### Test Credentials
```
Admin User:
- Email: admin@eshtarek.com
- Password: admin123

Test Tenant:
- Email: techcorp@example.com
- Password: tech123
```

### Postman Collection
A Postman collection is available at:
```
https://www.postman.com/collections/your-collection-id
```

## Support

For API support:
- Email: api-support@eshtarek.com
- Documentation: https://docs.eshtarek.com/api
- Status page: https://status.eshtarek.com 