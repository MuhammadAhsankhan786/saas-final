# Reception Role RBAC System

## Overview

This directory contains the RBAC (Role-Based Access Control) configuration and validation system for the Reception role. The system ensures that Reception users can only access allowed modules and endpoints, preventing unauthorized access to admin features.

## Files

### `role-config.reception.json`
JSON configuration file defining:
- **allowedModules**: Modules Reception can access (dashboard, appointments, clients, payments, packages, services)
- **restrictedModules**: Modules blocked for Reception (treatments, inventory, reports, compliance, staff, business-settings, admin)
- **allowedEndpoints**: API endpoints Reception can call (/staff/* routes)
- **blockedEndpoints**: API endpoints blocked (/admin/*, /provider/*, etc.)
- **allowedNavigationItems**: Valid navigation routes

### `reception-role-validator.js`
Startup validator that:
- Validates sidebar navigation
- Validates API endpoint usage
- Validates route protection
- Provides utility functions for endpoint checking

## How It Works

### Runtime Protection (RBAC Watchdog)

The `fetchWithAuth` function in `src/lib/api.js` includes inline RBAC checks:

1. **Admin Endpoint Detection**: If a Reception user attempts to call `/admin/*`:
   - Logs a warning
   - Attempts to map to `/staff/*` equivalent
   - If no mapping exists, blocks the request and shows error toast

2. **Endpoint Validation**: Checks if the endpoint is in the allowed list
   - Blocks unauthorized endpoints
   - Allows `/staff/*` and `/client/appointments/form-data`

3. **Error Handling**: Shows toast notifications and logs violations

### Startup Validation

On app load, if user role is "reception", the console logs:
```
✅ Reception Role Verified — modules synced, routes clean, endpoints staff-safe.
```

## Testing

### E2E Tests

Run the full E2E test suite:
```bash
npm run test:e2e
```

Run with browser visible:
```bash
npm run test:e2e:headed
```

Run CI pipeline (includes RBAC validation):
```bash
npm run ci:reception
```

### Manual Testing

1. Login as Reception user
2. Check browser console for validation message
3. Attempt to access `/admin/*` routes - should be blocked or redirected
4. Verify all API calls go to `/staff/*` endpoints
5. Check that sidebar only shows allowed modules

## CI Integration

The `ci:reception` script:
1. Runs Playwright E2E tests
2. Generates HTML report
3. Runs RBAC validation
4. Fails on any RBAC violations or 5xx errors

## Troubleshooting

### RBAC Violations

If you see warnings like:
```
🚨 RBAC warning: role=reception attempted admin endpoint: /admin/appointments
✅ RBAC fix applied: /admin/appointments → /staff/appointments
```

The watchdog is working and auto-correcting the endpoint. Check why the code is calling the admin endpoint and fix the source.

### Blocked Requests

If requests are blocked:
```
❌ RBAC blocked: /admin/invalid-route
```

The endpoint doesn't have a staff-equivalent mapping. Either:
1. Add the mapping to `getStaffEquivalentEndpoint()` in `api.js`
2. Use the correct `/staff/*` endpoint in the component

## Maintenance

### Adding New Endpoints

1. Add to `allowedEndpoints` in `role-config.reception.json`
2. If it's an admin endpoint, add mapping to `getStaffEquivalentEndpoint()` in `api.js`

### Adding New Modules

1. Add module to `allowedModules` if Reception should access it
2. Add corresponding navigation items to `allowedNavigationItems`
3. Update sidebar filtering logic in `src/components/layout/sidebar.js`

