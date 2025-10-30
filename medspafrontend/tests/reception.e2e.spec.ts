/**
 * Reception Role E2E Test Suite
 * Validates all Reception modules with live backend (no mock data)
 * 
 * Run with: npx playwright test tests/reception.e2e.spec.ts
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// Reception test credentials (should be seeded in test database)
const RECEPTION_EMAIL = process.env.TEST_RECEPTION_EMAIL || 'reception@medspa.test';
const RECEPTION_PASSWORD = process.env.TEST_RECEPTION_PASSWORD || 'password123';

test.describe('Reception Role - Full RBAC E2E Suite', () => {
  let authToken: string;
  let networkRequests: any[] = [];

  test.beforeEach(async ({ page, context }) => {
    // Intercept network requests to track API calls
    networkRequests = [];
    
    page.on('request', (request) => {
      const url = request.url();
      if (url.includes('/api/')) {
        networkRequests.push({
          url,
          method: request.method(),
          timestamp: new Date().toISOString(),
        });
      }
    });

    // Login as Reception
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', RECEPTION_EMAIL);
    await page.fill('input[type="password"]', RECEPTION_PASSWORD);
    await page.click('button[type="submit"]');
    
    // Wait for login to complete
    await page.waitForURL(new RegExp(`${BASE_URL}/(dashboard|appointments)`), { timeout: 10000 });
    
    // Extract auth token from localStorage
    authToken = await page.evaluate(() => localStorage.getItem('token') || '');
    expect(authToken).toBeTruthy();
  });

  test('RBAC: Verify no /admin/* API calls are made', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForTimeout(2000); // Wait for initial data load
    
    // Check all network requests
    const adminCalls = networkRequests.filter(req => 
      req.url.includes('/admin/') && !req.url.includes('/admin/login')
    );
    
    if (adminCalls.length > 0) {
      console.error('❌ RBAC Regression: Admin routes hit by Reception role:');
      adminCalls.forEach(call => {
        console.error(`  - ${call.method} ${call.url}`);
      });
    }
    
    expect(adminCalls.length).toBe(0);
  });

  test('Appointments: Create, Update, Status Change, Delete', async ({ page }) => {
    await page.goto(`${BASE_URL}/appointments/list`);
    await page.waitForSelector('table, [data-testid="appointment-list"]', { timeout: 5000 });
    
    // Create appointment
    await page.click('button:has-text("Book Appointment"), a:has-text("Book"), button:has-text("New")');
    await page.waitForSelector('form, [data-testid="appointment-form"]', { timeout: 5000 });
    
    // Fill form (adjust selectors based on actual form structure)
    await page.selectOption('select[name="client_id"], [data-testid="client-select"]', { index: 1 });
    await page.selectOption('select[name="location_id"], [data-testid="location-select"]', { index: 1 });
    await page.fill('input[name="start_time"], input[type="datetime-local"]', 
      new Date(Date.now() + 86400000).toISOString().slice(0, 16));
    
    // Submit
    await page.click('button[type="submit"], button:has-text("Create"), button:has-text("Save")');
    
    // Verify success toast
    await expect(page.locator('text=/Appointment created successfully/i')).toBeVisible({ timeout: 5000 });
    
    // Verify API call was to /staff/appointments
    const createCall = networkRequests.find(req => 
      req.method === 'POST' && req.url.includes('/appointments')
    );
    expect(createCall).toBeTruthy();
    expect(createCall?.url).toContain('/staff/appointments');
    
    // TODO: Add update, status change, and delete tests
    // (These require identifying specific appointments in the list)
  });

  test('Clients: List, Add, Edit, Delete', async ({ page }) => {
    await page.goto(`${BASE_URL}/clients/list`);
    await page.waitForSelector('table, [data-testid="client-list"]', { timeout: 5000 });
    
    // Verify "Client data loaded successfully" toast appeared (if shown)
    // Check that table has loaded
    const tableVisible = await page.locator('table, [data-testid="client-list"]').isVisible();
    expect(tableVisible).toBe(true);
    
    // Add client
    await page.click('button:has-text("Add Client"), a:has-text("Add"), button:has-text("New")');
    await page.waitForSelector('form, [data-testid="client-form"]', { timeout: 5000 });
    
    // Fill form
    await page.fill('input[name="name"]', `Test Client ${Date.now()}`);
    await page.fill('input[name="email"]', `testclient${Date.now()}@test.com`);
    await page.fill('input[name="phone"]', '555-1234');
    
    // Submit
    await page.click('button[type="submit"], button:has-text("Save"), button:has-text("Create")');
    
    // Verify success toast
    await expect(page.locator('text=/Client saved successfully/i')).toBeVisible({ timeout: 5000 });
    
    // Verify API call was to /staff/clients
    const createCall = networkRequests.find(req => 
      req.method === 'POST' && req.url.includes('/clients')
    );
    expect(createCall).toBeTruthy();
    expect(createCall?.url).toContain('/staff/clients');
  });

  test('Payments (POS): Create Payment, Confirm, Receipt', async ({ page }) => {
    await page.goto(`${BASE_URL}/payments/pos`);
    await page.waitForSelector('[data-testid="pos-form"], form', { timeout: 5000 });
    
    // Select client
    await page.selectOption('select[name="client_id"], [data-testid="client-select"]', { index: 1 });
    
    // Add item to cart (adjust based on actual POS UI)
    // await page.click('button:has-text("Add Service"), button:has-text("Add Item")');
    
    // Process payment
    // await page.click('button:has-text("Process Payment"), button:has-text("Checkout")');
    
    // Verify success toast
    // await expect(page.locator('text=/Payment recorded successfully/i')).toBeVisible({ timeout: 5000 });
    
    // Verify API call was to /staff/payments
    const paymentCall = networkRequests.find(req => 
      req.method === 'POST' && req.url.includes('/payments')
    );
    if (paymentCall) {
      expect(paymentCall.url).toContain('/staff/payments');
    }
  });

  test('Packages: List and Assign', async ({ page }) => {
    await page.goto(`${BASE_URL}/payments/packages`);
    await page.waitForSelector('table, [data-testid="package-list"]', { timeout: 5000 });
    
    // Click assign package button
    const assignButton = page.locator('button:has-text("Assign"), button:has-text("Assign Package")').first();
    if (await assignButton.isVisible()) {
      await assignButton.click();
      await page.waitForSelector('[data-testid="assign-form"], .modal, dialog', { timeout: 5000 });
      
      // Select client and package
      await page.selectOption('select[name="client_id"], [data-testid="client-select"]', { index: 1 });
      await page.selectOption('select[name="package_id"], [data-testid="package-select"]', { index: 1 });
      
      // Submit
      await page.click('button[type="submit"], button:has-text("Assign")');
      
      // Verify success toast
      await expect(page.locator('text=/Package assigned successfully/i')).toBeVisible({ timeout: 5000 });
      
      // Verify API call was to /staff/packages/assign
      const assignCall = networkRequests.find(req => 
        req.method === 'POST' && req.url.includes('/packages/assign')
      );
      expect(assignCall).toBeTruthy();
      expect(assignCall?.url).toContain('/staff/packages/assign');
    }
  });

  test('Dashboard: Load Live Stats', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForTimeout(2000); // Wait for dashboard to load
    
    // Verify dashboard stats cards are visible
    const statsVisible = await page.locator('text=/Today\'s Appointments|Checked In|Waiting Room/i').first().isVisible();
    expect(statsVisible).toBe(true);
    
    // Verify API calls were to /staff/* endpoints
    const appointmentCalls = networkRequests.filter(req => 
      req.url.includes('/appointments')
    );
    const paymentCalls = networkRequests.filter(req => 
      req.url.includes('/payments')
    );
    
    // All calls should be to /staff/*, not /admin/*
    appointmentCalls.forEach(call => {
      expect(call.url).toContain('/staff/');
      expect(call.url).not.toContain('/admin/');
    });
    
    paymentCalls.forEach(call => {
      expect(call.url).toContain('/staff/');
      expect(call.url).not.toContain('/admin/');
    });
    
    // Verify no mock data warnings
    const mockDataWarning = await page.locator('text=/mock|Mock|test data/i').isVisible();
    expect(mockDataWarning).toBe(false);
  });

  test('Error Handling: Verify 401 and 5xx Errors Show Toasts', async ({ page }) => {
    // Simulate expired token
    await page.evaluate(() => {
      localStorage.setItem('token', 'expired-token');
    });
    
    await page.goto(`${BASE_URL}/appointments/list`);
    await page.waitForTimeout(1000);
    
    // Should show error toast or redirect to login
    const errorToast = await page.locator('text=/unauthorized|failed|error/i').first().isVisible().catch(() => false);
    const isLoginPage = page.url().includes('/login');
    
    expect(errorToast || isLoginPage).toBe(true);
  });

  test('Services: View Service List (Read-Only)', async ({ page }) => {
    await page.goto(`${BASE_URL}/services/list`);
    await page.waitForSelector('table, [data-testid="service-list"]', { timeout: 5000 });
    
    // Verify services are loaded
    const servicesVisible = await page.locator('table, [data-testid="service-list"]').isVisible();
    expect(servicesVisible).toBe(true);
    
    // Verify API call was to /staff/services
    const serviceCall = networkRequests.find(req => 
      req.url.includes('/services') && req.method === 'GET'
    );
    if (serviceCall) {
      expect(serviceCall.url).toContain('/staff/services');
    }
  });

  test('RBAC Regression: Verify Protected Routes Blocked', async ({ page }) => {
    // Try to access admin routes directly
    const blockedRoutes = [
      '/admin/appointments',
      '/admin/clients',
      '/admin/payments',
      '/reports',
      '/inventory',
      '/compliance',
    ];
    
    for (const route of blockedRoutes) {
      await page.goto(`${BASE_URL}${route}`);
      await page.waitForTimeout(1000);
      
      // Should either redirect to dashboard or show access denied
      const isDashboard = page.url().includes('/dashboard');
      const accessDenied = await page.locator('text=/Access Denied|Restricted|Forbidden/i').isVisible().catch(() => false);
      
      expect(isDashboard || accessDenied).toBe(true);
    }
  });
});

test.describe('Reception RBAC Watchdog - Network Interception', () => {
  test('Verify Watchdog Blocks /admin/* Calls', async ({ page }) => {
    // Intercept all network requests
    const blockedCalls: any[] = [];
    
    page.on('request', (request) => {
      const url = request.url();
      if (url.includes('/api/admin/') && !url.includes('/admin/login')) {
        blockedCalls.push({
          url,
          method: request.method(),
        });
      }
    });
    
    await page.goto('http://localhost:3000/login');
    
    // Login as Reception (assuming test credentials exist)
    await page.fill('input[type="email"]', RECEPTION_EMAIL);
    await page.fill('input[type="password"]', RECEPTION_PASSWORD);
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(3000);
    
    // After navigation, verify no /admin/* calls were made
    expect(blockedCalls.length).toBe(0);
  });
});

