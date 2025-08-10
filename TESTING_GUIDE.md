# Testing Guide

## Overview

This guide provides comprehensive testing instructions for the Multi-Tenant Subscription Management System. It covers all major features, workflows, and edge cases.

## Prerequisites

1. **Docker and Docker Compose installed**
2. **Application running** (`docker-compose up --build`)
3. **Sample data loaded** (`docker-compose exec backend python manage.py loaddata sample_data.json`)
4. **Superuser created** (`docker-compose exec backend python manage.py createsuperuser`)

## Test Credentials

### Admin User
- **Email**: admin@eshtarek.com
- **Password**: admin123

### Sample Tenants
- **TechCorp**: techcorp@example.com / tech123
- **StartupXYZ**: startup@example.com / startup123
- **EnterpriseABC**: enterprise@example.com / enterprise123

## Feature Testing

### 1. Authentication & User Management

#### 1.1 User Registration
**Test Case**: Register a new user with tenant creation

**Steps**:
1. Navigate to http://localhost:3000/register
2. Fill in the registration form:
   - Email: test@example.com
   - Password: TestPass123!
   - Confirm Password: TestPass123!
   - First Name: Test
   - Last Name: User
   - Company Name: Test Company
3. Click "Register"

**Expected Results**:
- User is created successfully
- Tenant is created automatically
- User is assigned as tenant admin
- Redirected to dashboard
- JWT tokens are generated

**API Test**:
```bash
curl -X POST http://localhost:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123!",
    "password_confirm": "TestPass123!",
    "first_name": "Test",
    "last_name": "User",
    "tenant": {
      "name": "Test Company",
      "description": "Test company description"
    }
  }'
```

#### 1.2 User Login
**Test Case**: Login with valid credentials

**Steps**:
1. Navigate to http://localhost:3000/login
2. Enter credentials: techcorp@example.com / tech123
3. Click "Login"

**Expected Results**:
- Login successful
- JWT tokens received
- Redirected to dashboard
- User information displayed

**API Test**:
```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "techcorp@example.com",
    "password": "tech123"
  }'
```

#### 1.3 User Logout
**Test Case**: Logout user and invalidate tokens

**Steps**:
1. Login as any user
2. Click logout button
3. Try to access protected routes

**Expected Results**:
- Tokens invalidated
- Redirected to login page
- Cannot access protected routes

### 2. Multi-Tenant Data Isolation

#### 2.1 Tenant Data Separation
**Test Case**: Verify data isolation between tenants

**Steps**:
1. Login as TechCorp user
2. Create a new user in TechCorp
3. Logout
4. Login as StartupXYZ user
5. Check user list

**Expected Results**:
- TechCorp user can only see TechCorp users
- StartupXYZ user cannot see TechCorp users
- Data is completely isolated

#### 2.2 Admin Access
**Test Case**: Admin can access all tenant data

**Steps**:
1. Login as admin
2. Navigate to Admin Dashboard
3. Check tenant list
4. View different tenant data

**Expected Results**:
- Admin can see all tenants
- Admin can access all tenant data
- Admin can manage all tenants

### 3. Subscription Management

#### 3.1 Plan Selection
**Test Case**: User can view and select subscription plans

**Steps**:
1. Login as tenant user
2. Navigate to Plans page
3. View available plans
4. Select a plan

**Expected Results**:
- All plans displayed with features
- Pricing information shown
- Plan selection works

**API Test**:
```bash
curl -X GET http://localhost:8000/api/subscriptions/plans/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### 3.2 Subscription Creation
**Test Case**: Create a new subscription

**Steps**:
1. Login as tenant user
2. Select a plan
3. Complete subscription process
4. Check subscription status

**Expected Results**:
- Subscription created successfully
- Billing period set correctly
- Usage limits applied

**API Test**:
```bash
curl -X POST http://localhost:8000/api/subscriptions/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "plan": 2,
    "billing_cycle": "monthly"
  }'
```

#### 3.3 Plan Upgrade/Downgrade
**Test Case**: Change subscription plan

**Steps**:
1. Login as tenant with active subscription
2. Navigate to Plans page
3. Select different plan
4. Confirm change

**Expected Results**:
- Plan change processed
- New limits applied
- Billing updated

### 4. Billing System

#### 4.1 Invoice Generation
**Test Case**: Generate invoice for subscription

**Steps**:
1. Create subscription
2. Check billing page
3. Verify invoice creation

**Expected Results**:
- Invoice generated automatically
- Correct amounts calculated
- Due dates set

**API Test**:
```bash
curl -X POST http://localhost:8000/api/billing/create-subscription-invoice/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "subscription_id": 1
  }'
```

#### 4.2 Payment Processing
**Test Case**: Process payment for invoice

**Steps**:
1. Navigate to billing page
2. Select unpaid invoice
3. Process payment
4. Check payment status

**Expected Results**:
- Payment processed (95% success rate in demo)
- Invoice marked as paid
- Payment history updated

**API Test**:
```bash
curl -X POST http://localhost:8000/api/billing/process-payment/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "invoice_id": 1,
    "payment_method": "stripe",
    "amount": "29.99"
  }'
```

#### 4.3 Billing Analytics
**Test Case**: View billing analytics

**Steps**:
1. Login as admin
2. Navigate to Admin Dashboard
3. Check billing analytics

**Expected Results**:
- Total revenue displayed
- Active subscriptions count
- Monthly revenue calculated

**API Test**:
```bash
curl -X GET http://localhost:8000/api/billing/analytics/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 5. User Management

#### 5.1 User Creation
**Test Case**: Create new user within tenant

**Steps**:
1. Login as tenant admin
2. Navigate to Users page
3. Create new user
4. Verify user creation

**Expected Results**:
- User created successfully
- User assigned to correct tenant
- User can login

**API Test**:
```bash
curl -X POST http://localhost:8000/api/users/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "first_name": "New",
    "last_name": "User",
    "role": "user"
  }'
```

#### 5.2 User Permissions
**Test Case**: Verify role-based access control

**Steps**:
1. Login as regular user
2. Try to access admin features
3. Login as tenant admin
4. Check available features

**Expected Results**:
- Regular users have limited access
- Tenant admins can manage tenant users
- System admins have full access

### 6. Usage Limits

#### 6.1 User Limit Enforcement
**Test Case**: Prevent exceeding user limits

**Steps**:
1. Login as tenant with Pro plan (25 users)
2. Try to create 26th user
3. Check error handling

**Expected Results**:
- Error message displayed
- User creation blocked
- Clear limit information shown

#### 6.2 Feature Access Control
**Test Case**: Control feature access based on plan

**Steps**:
1. Login as Free plan user
2. Try to access premium features
3. Upgrade to Pro plan
4. Verify feature access

**Expected Results**:
- Features restricted based on plan
- Upgrade prompts shown
- Features unlocked after upgrade

### 7. Admin Features

#### 7.1 Tenant Management
**Test Case**: Admin can manage all tenants

**Steps**:
1. Login as admin
2. Navigate to Admin Tenants
3. Create new tenant
4. Edit existing tenant
5. Delete tenant

**Expected Results**:
- All CRUD operations work
- Tenant data properly managed
- Validation errors handled

#### 7.2 Plan Management
**Test Case**: Admin can manage subscription plans

**Steps**:
1. Login as admin
2. Navigate to Admin Plans
3. Create new plan
4. Edit existing plan
5. Deactivate plan

**Expected Results**:
- Plan management works
- Pricing updates applied
- Plan status changes reflected

### 8. Error Handling

#### 8.1 Authentication Errors
**Test Case**: Handle invalid credentials

**Steps**:
1. Try to login with wrong password
2. Use expired token
3. Access protected route without token

**Expected Results**:
- Clear error messages
- Proper HTTP status codes
- User-friendly error handling

#### 8.2 Validation Errors
**Test Case**: Handle invalid data

**Steps**:
1. Submit form with missing required fields
2. Enter invalid email format
3. Use weak password

**Expected Results**:
- Field-level validation errors
- Clear error messages
- Form validation prevents submission

### 9. Performance Testing

#### 9.1 Load Testing
**Test Case**: System performance under load

**Tools**: Use tools like Apache Bench or Artillery

```bash
# Test API endpoints
ab -n 1000 -c 10 http://localhost:8000/api/subscriptions/plans/

# Test concurrent users
artillery run load-test.yml
```

**Expected Results**:
- Response times under 200ms
- No errors under normal load
- Graceful degradation under high load

#### 9.2 Database Performance
**Test Case**: Database query performance

**Steps**:
1. Create multiple tenants with users
2. Run complex queries
3. Monitor query performance

**Expected Results**:
- Queries optimized with indexes
- Tenant isolation working efficiently
- No N+1 query problems

### 10. Security Testing

#### 10.1 JWT Security
**Test Case**: JWT token security

**Steps**:
1. Intercept JWT token
2. Try to modify token
3. Use expired token
4. Test token refresh

**Expected Results**:
- Tokens properly signed
- Expired tokens rejected
- Refresh tokens work correctly

#### 10.2 SQL Injection Prevention
**Test Case**: Prevent SQL injection attacks

**Steps**:
1. Try SQL injection in search fields
2. Test parameterized queries
3. Verify input sanitization

**Expected Results**:
- No SQL injection vulnerabilities
- Input properly sanitized
- Parameterized queries used

#### 10.3 XSS Prevention
**Test Case**: Prevent cross-site scripting

**Steps**:
1. Try to inject JavaScript in input fields
2. Test output encoding
3. Verify CSP headers

**Expected Results**:
- No XSS vulnerabilities
- Output properly encoded
- CSP headers configured

## Automated Testing

### Running Tests

```bash
# Backend tests
docker-compose exec backend python manage.py test

# Frontend tests
docker-compose exec frontend npm test

# E2E tests (if configured)
npm run test:e2e
```

### Test Coverage

```bash
# Generate coverage report
docker-compose exec backend coverage run --source='.' manage.py test
docker-compose exec backend coverage report
docker-compose exec backend coverage html
```

## Manual Testing Checklist

- [ ] User registration with tenant creation
- [ ] User login/logout
- [ ] JWT token refresh
- [ ] Multi-tenant data isolation
- [ ] Subscription plan selection
- [ ] Subscription creation and management
- [ ] Billing and payment processing
- [ ] User management within tenants
- [ ] Usage limit enforcement
- [ ] Admin features and permissions
- [ ] Error handling and validation
- [ ] Responsive design on different devices
- [ ] Browser compatibility
- [ ] Performance under load
- [ ] Security vulnerabilities

## Bug Reporting

When reporting bugs, include:
1. **Steps to reproduce**
2. **Expected behavior**
3. **Actual behavior**
4. **Environment details**
5. **Screenshots/logs**
6. **Browser/device information**

## Performance Benchmarks

### Target Metrics
- **Page Load Time**: < 2 seconds
- **API Response Time**: < 200ms
- **Database Query Time**: < 100ms
- **Concurrent Users**: 100+ users
- **Uptime**: 99.9%

### Monitoring
- Use browser dev tools for frontend performance
- Monitor API response times
- Check database query performance
- Monitor memory and CPU usage

## Conclusion

This testing guide covers all major features and edge cases. Regular testing ensures the system remains reliable and secure. Update this guide as new features are added or existing ones are modified. 