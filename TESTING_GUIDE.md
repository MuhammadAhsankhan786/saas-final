# Role-Based UI Isolation - Testing Guide

## Quick Start

This guide provides step-by-step instructions for testing the role-based UI isolation implementation in the MedSpa SaaS application.

---

## Prerequisites

1. **Backend running** on `http://localhost:8000`
2. **Frontend running** on `http://localhost:3000` (or your configured port)
3. **Database seeded** with test users
4. **Browser console** open for verification

---

## Test Users (Default Credentials)

### Admin
- **Email:** `admin@medispa.com`
- **Password:** Check database configuration
- **Access:** Full system access

### Provider
- **Email:** `provider@medispa.com`
- **Password:** Check database configuration
- **Access:** Appointments, Treatments, Inventory

### Reception
- **Email:** `reception@medispa.com`
- **Password:** Check database configuration
- **Access:** Appointments, Clients, Payments

### Client
- **Email:** `client@medispa.com` or `test@example.com`
- **Password:** `demo123` (or as configured)
- **Access:** Own appointments and payments

---

## Testing Procedure

### Step 1: Prepare Test Environment

```bash
# Backend
cd Q-A-Tested-MedSpa-Backend
php artisan serve

# Frontend (in separate terminal)
cd medspafrontend
npm run dev
```

### Step 2: Test Each Role

#### 2.1 Admin Role Testing

1. **Login as Admin**
   - Navigate to `http://localhost:3000/login`
   - Enter admin credentials
   - Verify JWT token stored in localStorage
   - Check `user.role = "admin"` in console

2. **Verify Visible UI Elements**
   - ✅ Dashboard (KPIs, revenue charts)
   - ✅ Appointments (Calendar, Book, List)
   - ✅ Clients (List, Add)
   - ✅ Treatments (Consents, SOAP, Photos)
   - ✅ Payments (POS, History, Packages)
   - ✅ Inventory (Products, Alerts)
   - ✅ Reports (Revenue, Analytics, Staff)
   - ✅ Compliance (Audit Log, Alerts)
   - ✅ Settings (Profile, Business, Staff)
   - ✅ Locations

3. **Test Admin Operations**
   ```
   Actions to perform:
   - Create new staff member
   - View revenue report
   - Update business settings
   - Manage inventory
   - Generate compliance report
   ```

4. **Verify Database**
   ```sql
   SELECT * FROM users WHERE role='admin';
   SELECT * FROM audit_logs WHERE user_id=<admin_id>;
   ```

#### 2.2 Provider Role Testing

1. **Login as Provider**
   - Logout from admin
   - Login with provider credentials
   - Verify `user.role = "provider"`

2. **Verify Visible UI Elements**
   - ✅ Dashboard (today's appointments)
   - ✅ Appointments (Calendar, List)
   - ✅ Clients (List only - read-only)
   - ✅ Treatments (Consents, SOAP, Photos)
   - ✅ Inventory (Products, Alerts)
   - ✅ Compliance (Alerts only)
   - ✅ Settings (Profile only)

3. **Verify Hidden Elements**
   - ❌ Appointments/Book (should be hidden)
   - ❌ Clients/Add (should be hidden)
   - ❌ All Payments (should be hidden)
   - ❌ All Reports (should be hidden)
   - ❌ Compliance/Audit (should be hidden)
   - ❌ Settings/Business (should be hidden)
   - ❌ Settings/Staff (should be hidden)
   - ❌ Locations (should be hidden)

4. **Test Provider Operations**
   ```
   Actions to perform:
   - Update SOAP notes for appointment
   - Mark appointment as completed
   - Upload before/after photos
   - Adjust inventory stock level
   ```

5. **Test Unauthorized Access**
   ```javascript
   // Try to access admin routes
   // Should return 403 Forbidden
   fetch('/api/admin/reports/revenue', {
     headers: { 'Authorization': `Bearer ${token}` }
   })
   ```

#### 2.3 Reception Role Testing

1. **Login as Reception**
   - Logout from provider
   - Login with reception credentials
   - Verify `user.role = "reception"`

2. **Verify Visible UI Elements**
   - ✅ Dashboard (check-ins, scheduling)
   - ✅ Appointments (Calendar, Book, List)
   - ✅ Clients (List, Add)
   - ✅ Payments (POS, History, Packages)
   - ✅ Settings (Profile only)

3. **Verify Hidden Elements**
   - ❌ All Treatments (should be hidden)
   - ❌ All Inventory (should be hidden)
   - ❌ All Reports (should be hidden)
   - ❌ All Compliance (should be hidden)
   - ❌ Settings/Business (should be hidden)
   - ❌ Settings/Staff (should be hidden)
   - ❌ Locations (should be hidden)

4. **Test Reception Operations**
   ```
   Actions to perform:
   - Book appointment for client
   - Add new client
   - Process payment via POS
   - View appointment calendar
   ```

5. **Test Unauthorized Access**
   ```javascript
   // Try to access treatment routes
   // Should return 403 Forbidden
   fetch('/api/admin/treatments', {
     headers: { 'Authorization': `Bearer ${token}` }
   })
   ```

#### 2.4 Client Role Testing

1. **Login as Client**
   - Logout from reception
   - Login with client credentials
   - Verify `user.role = "client"`

2. **Verify Visible UI Elements**
   - ✅ Dashboard (appointments, packages)
   - ✅ Appointments (Book, own appointments)
   - ✅ Payments (History, own packages)
   - ✅ Settings (Profile only)

3. **Verify Hidden Elements**
   - ❌ Appointments/Calendar (should be hidden)
   - ❌ Appointments/List (should be hidden)
   - ❌ All Clients management (should be hidden)
   - ❌ All Treatments (should be hidden)
   - ❌ Payments/POS (should be hidden)
   - ❌ All Inventory (should be hidden)
   - ❌ All Reports (should be hidden)
   - ❌ All Compliance (should be hidden)
   - ❌ Settings/Business (should be hidden)
   - ❌ Settings/Staff (should be hidden)
   - ❌ Locations (should be hidden)

4. **Test Client Operations**
   ```
   Actions to perform:
   - Book own appointment
   - View own appointment history
   - View own payment history
   - View assigned packages
   ```

5. **Test Unauthorized Access**
   ```javascript
   // Try to access admin/staff routes
   // Should return 403 Forbidden
   fetch('/api/admin/users', {
     headers: { 'Authorization': `Bearer ${token}` }
   })
   
   fetch('/api/staff/appointments', {
     headers: { 'Authorization': `Bearer ${token}` }
   })
   ```

---

## Automated Testing

### Option 1: Browser Console Script

1. **Load the verification script:**
   ```javascript
   // Copy and paste verify_role_isolation.js into browser console
   // Or load from file
   ```

2. **Run full test:**
   ```javascript
   window.verifyRoleIsolation.fullTest()
   ```

3. **Check results:**
   - View console output
   - Note any failures
   - Take screenshots of errors

### Option 2: Manual Verification Checklist

Create a checklist document with the following:

```
[ ] Admin can access all modules
[ ] Provider cannot access reports, payments management, staff settings
[ ] Reception cannot access treatments, inventory, reports
[ ] Client cannot access admin/staff features
[ ] Unauthorized API calls return 403
[ ] Frontend shows "Access Denied" for unauthorized pages
[ ] Sidebar navigation filtered correctly
[ ] No layout breaking issues
[ ] Responsive design works on all devices
```

---

## API Testing

### Using Postman or curl

#### Test Admin Access
```bash
# Should succeed
curl -H "Authorization: Bearer <admin_token>" \
  http://localhost:8000/api/admin/appointments

# Should fail for non-admin
curl -H "Authorization: Bearer <provider_token>" \
  http://localhost:8000/api/admin/appointments
  # Expected: 403 Forbidden
```

#### Test Provider Access
```bash
# Should succeed
curl -H "Authorization: Bearer <provider_token>" \
  http://localhost:8000/api/staff/appointments

# Should fail
curl -H "Authorization: Bearer <provider_token>" \
  http://localhost:8000/api/admin/reports/revenue
  # Expected: 403 Forbidden
```

#### Test Reception Access
```bash
# Should succeed
curl -H "Authorization: Bearer <reception_token>" \
  http://localhost:8000/api/staff/appointments

# Should fail
curl -H "Authorization: Bearer <reception_token>" \
  http://localhost:8000/api/admin/treatments
  # Expected: 403 Forbidden
```

#### Test Client Access
```bash
# Should succeed
curl -H "Authorization: Bearer <client_token>" \
  http://localhost:8000/api/client/appointments

# Should fail
curl -H "Authorization: Bearer <client_token>" \
  http://localhost:8000/api/admin/users
  # Expected: 403 Forbidden
```

---

## Database Verification

### Check User Roles
```sql
SELECT id, name, email, role, created_at 
FROM users 
WHERE role IN ('admin', 'provider', 'reception', 'client');
```

### Check Appointment Attribution
```sql
SELECT 
  a.id,
  a.client_id,
  a.provider_id,
  a.status,
  u.name as client_name,
  u.role as client_role
FROM appointments a
LEFT JOIN users u ON a.client_id = u.id
WHERE a.status = 'booked';
```

### Check Audit Logs
```sql
SELECT id, user_id, action, resource, created_at 
FROM audit_logs 
ORDER BY created_at DESC 
LIMIT 10;
```

---

## Integration Testing

### Twilio SMS Verification

1. **Check Laravel Logs:**
   ```bash
   tail -f storage/logs/laravel.log | grep -i twilio
   ```

2. **Expected Output:**
   ```
   [2024-XX-XX] Twilio SMS sent to +1234567890
   [2024-XX-XX] Appointment confirmation SMS delivered
   ```

3. **Verify Webhook:**
   - Check Twilio Dashboard for delivery status
   - Verify SMS contains appointment details
   - Confirm SMS sent to correct phone number

### Stripe Payment Verification

1. **Check Stripe Dashboard:**
   - Log into Stripe Dashboard
   - Navigate to Payments
   - Verify payment intent created
   - Check webhook events received

2. **Check Database:**
   ```sql
   SELECT 
     id, 
     client_id, 
     amount, 
     status, 
     stripe_payment_intent_id,
     created_at
   FROM payments 
   ORDER BY created_at DESC 
   LIMIT 10;
   ```

3. **Verify Webhook:**
   - Check Laravel logs for webhook events
   - Verify payment status updated to "completed"
   - Confirm receipt generated

---

## Responsive Design Testing

### Desktop (≥1200px)
- [ ] Full sidebar visible
- [ ] 4-column grid layouts
- [ ] All charts and KPIs visible
- [ ] No horizontal scroll
- [ ] Cards display in grid

### Tablet (768px - 1024px)
- [ ] Sidebar collapsible
- [ ] 2-column grid layouts
- [ ] Navigation menu works
- [ ] Touch-friendly buttons
- [ ] No overflow

### Mobile (≤600px)
- [ ] Sidebar toggles to hamburger menu
- [ ] Single column layout
- [ ] Cards stack vertically
- [ ] Forms adapt to width
- [ ] Touch targets ≥44px

### Edge Cases
- [ ] Very small screens (<320px)
- [ ] Very large screens (>1920px)
- [ ] Landscape orientation
- [ ] High DPI displays

---

## Security Testing

### Test 1: Expired Token
```javascript
// Wait for token to expire
// Then try to access protected route
// Should redirect to login
```

### Test 2: Invalid Token
```javascript
localStorage.setItem('token', 'invalid_token');
// Try to access protected route
// Should redirect to login
```

### Test 3: Manually Set Admin Role
```javascript
// Try to manipulate localStorage
const user = JSON.parse(localStorage.getItem('user'));
user.role = 'admin';
localStorage.setItem('user', JSON.stringify(user));
// Should still be blocked by backend
```

### Test 4: Direct URL Access
```
# Log in as client, then manually navigate to:
http://localhost:3000/reports/revenue
# Should show "Access Denied"
```

---

## Reporting Issues

### When Test Fails

1. **Document the issue:**
   - Which role was logged in
   - What action was attempted
   - What was expected
   - What actually happened

2. **Collect logs:**
   - Browser console errors
   - Network tab requests
   - Laravel logs
   - Database queries

3. **Create bug report:**
   ```
   Title: Role-based access issue
   Role: provider
   Action: Tried to access /reports/revenue
   Expected: 403 Forbidden
   Actual: Page loaded successfully
   Steps to reproduce:
   1. Log in as provider
   2. Navigate to reports
   3. See page loads
   ```

---

## Success Criteria

### ✅ All Tests Pass When:

1. **UI Visibility:**
   - Each role sees only authorized components
   - Sidebar navigation filtered correctly
   - No unauthorized pages accessible

2. **API Access:**
   - Backend returns 403 for unauthorized routes
   - Frontend shows "Access Denied" for unauthorized pages
   - Database operations restricted by role

3. **Security:**
   - JWT tokens validated on every request
   - Role-based middleware enforces access
   - No privilege escalation possible

4. **Integration:**
   - Twilio SMS sends correctly
   - Stripe payments process correctly
   - Database updates reflect immediately

5. **Responsive:**
   - Layout works on all screen sizes
   - No overflow or hidden elements
   - Navigation remains functional

---

## Next Steps

After completing all tests:

1. ✅ Review test results
2. ✅ Fix any found issues
3. ✅ Re-run failed tests
4. ✅ Document test results
5. ✅ Generate final report
6. ✅ Deploy to production

---

**Last Updated:** Generated automatically  
**Test Status:** Ready for manual testing  
**Contact:** See project documentation


