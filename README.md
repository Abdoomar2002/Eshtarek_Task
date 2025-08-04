# Multi-Tenant Subscription Management System

A comprehensive subscription management platform built with Django and React, supporting multi-tenant architecture with isolated data, plan management, and subscription workflows.

## 🏗️ Architecture

- **Frontend**: React.js with TypeScript and Material-UI
- **Backend**: Django REST Framework with Python
- **Database**: PostgreSQL
- **Authentication**: JWT-based
- **Containerization**: Docker & Docker Compose

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose installed
- Git

### Setup Instructions

1. **Clone and Navigate**
   ```bash
   git clone <repository-url>
   cd CodeQuest
   ```

2. **Start the Application**
   ```bash
   docker-compose up --build
   ```

3. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - Admin Panel: http://localhost:8000/admin

4. **Initial Setup**
   ```bash
   # Create superuser (in a new terminal)
   docker-compose exec backend python manage.py createsuperuser
   
   # Load sample data
   docker-compose exec backend python manage.py loaddata sample_data.json
   ```

## 📊 Sample Data

The system comes with pre-loaded sample data:

### Default Admin User
- Email: admin@eshtarek.com
- Password: admin123

### Sample Tenants
- **TechCorp**: techcorp@example.com / tech123
- **StartupXYZ**: startup@example.com / startup123
- **EnterpriseABC**: enterprise@example.com / enterprise123

### Subscription Plans
- **Free**: 5 users, basic features
- **Pro**: 25 users, advanced features
- **Enterprise**: 100 users, premium features

## 🔐 Authentication

### JWT Endpoints
- `POST /api/auth/register/` - User registration
- `POST /api/auth/login/` - User login
- `POST /api/auth/logout/` - User logout
- `GET /api/auth/me/` - Get current user info

### Request Format
```json
{
  "email": "user@example.com",
  "password": "password123",
  "tenant_name": "Company Name"
}
```

## 🏢 Tenant Management

### Tenant Endpoints
- `GET /api/tenants/` - List tenants (Admin only)
- `POST /api/tenants/` - Create tenant (Admin only)
- `GET /api/tenants/{id}/` - Get tenant details
- `PUT /api/tenants/{id}/` - Update tenant
- `DELETE /api/tenants/{id}/` - Delete tenant (Admin only)

## 📋 Subscription Plans

### Plan Endpoints
- `GET /api/subscriptions/plans/` - List all plans
- `POST /api/subscriptions/plans/` - Create plan (Admin only)
- `PUT /api/subscriptions/plans/{id}/` - Update plan (Admin only)
- `DELETE /api/subscriptions/plans/{id}/` - Delete plan (Admin only)

### Plan Structure
```json
{
  "name": "Pro Plan",
  "price": 29.99,
  "max_users": 25,
  "features": ["Advanced Analytics", "API Access", "Priority Support"],
  "is_active": true
}
```

## 💳 Subscriptions

### Subscription Endpoints
- `GET /api/subscriptions/` - List user's subscriptions
- `POST /api/subscriptions/` - Create subscription
- `PUT /api/subscriptions/{id}/` - Update subscription
- `DELETE /api/subscriptions/{id}/` - Cancel subscription

### Billing Simulation
The system includes a mock billing system that simulates Stripe-like functionality:
- `POST /api/billing/process-payment/` - Process payment
- `GET /api/billing/invoices/` - Get billing history

## 👥 User Management

### User Endpoints
- `GET /api/users/` - List users (Tenant-scoped)
- `POST /api/users/` - Create user (Tenant-scoped)
- `PUT /api/users/{id}/` - Update user
- `DELETE /api/users/{id}/` - Delete user

## 🔒 Multi-Tenant Security

- **Database-level isolation**: Each tenant's data is isolated at the database level
- **JWT tenant claims**: Tokens include tenant information
- **Middleware protection**: All requests are validated for tenant access
- **Row-level security**: Database queries are automatically scoped to tenant

## 🎯 Role-Based Access

### Admin Features
- Manage all tenants and plans
- View system-wide analytics
- Configure billing policies
- Monitor usage across tenants

### Tenant User Features
- Manage tenant-specific users
- View and modify subscription
- Access tenant-scoped data
- Update tenant settings

## 🐳 Docker Configuration

### Services
- **frontend**: React development server
- **backend**: Django application
- **database**: PostgreSQL
- **redis**: Cache and session storage

### Environment Variables
See `.env.example` for required environment variables.

## 🧪 Testing

```bash
# Run backend tests
docker-compose exec backend python manage.py test

# Run frontend tests
docker-compose exec frontend npm test
```

## 📈 Usage Limits

The system enforces usage limits based on subscription plans:
- **User count limits**: Prevents exceeding plan user limits
- **Feature access**: Controls feature availability per plan
- **API rate limiting**: Enforces usage quotas

## 🔧 Development

### Local Development Setup
```bash
# Backend development
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py runserver

# Frontend development
cd frontend
npm install
npm start
```

### Database Migrations
```bash
docker-compose exec backend python manage.py makemigrations
docker-compose exec backend python manage.py migrate
```

## 📝 API Documentation

Full API documentation is available at:
- Swagger UI: http://localhost:8000/api/docs/
- ReDoc: http://localhost:8000/api/redoc/

## 🚨 Error Handling

The system includes comprehensive error handling:
- **Validation errors**: Detailed field-level validation
- **Authentication errors**: Proper JWT error responses
- **Permission errors**: Clear access denied messages
- **Rate limiting**: Graceful quota exceeded responses

## 🔄 Workflow Examples

### Tenant Onboarding
1. Admin creates tenant
2. Tenant admin registers
3. Tenant subscribes to plan
4. Tenant invites users
5. Users access tenant-scoped features

### Plan Upgrade/Downgrade
1. Tenant selects new plan
2. System validates user count
3. Billing is processed
4. Plan is updated
5. Usage limits are adjusted

## 📊 Monitoring & Analytics

- **Tenant usage tracking**: Monitor resource consumption
- **Subscription analytics**: Track plan popularity
- **Revenue metrics**: Billing and payment analytics
- **User activity**: Engagement and feature usage

## 🔐 Security Features

- **JWT token rotation**: Automatic token refresh
- **Password policies**: Enforced password requirements
- **Rate limiting**: API abuse prevention
- **CORS configuration**: Secure cross-origin requests
- **SQL injection protection**: Parameterized queries
- **XSS protection**: Input sanitization

## 🎉 Getting Started with Development

1. **Fork the repository**
2. **Create a feature branch**
3. **Make your changes**
4. **Add tests**
5. **Submit a pull request**

## 📞 Support

For questions or issues:
- Create an issue in the repository
- Check the documentation
- Review the API docs

---

**Built with ❤️ for Eshtarek's Multi-Tenant Platform** 