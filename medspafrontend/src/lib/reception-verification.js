/**
 * Reception Role Verification Utility
 * 
 * Generates proof logs for:
 * - API endpoint responses
 * - UI data loading
 * - RBAC enforcement
 * 
 * Usage: Import and call verifyReceptionSystem() from browser console
 */

import { fetchWithAuth, getAppointments, getClients, getPayments, getPackages, getServices } from './api';
import { notify } from './toast';

const PROOF_LOG_STYLE = {
  header: 'background: #1e40af; color: white; padding: 8px; font-weight: bold;',
  success: 'background: #10b981; color: white; padding: 4px 8px; border-radius: 4px;',
  error: 'background: #ef4444; color: white; padding: 4px 8px; border-radius: 4px;',
  warning: 'background: #f59e0b; color: white; padding: 4px 8px; border-radius: 4px;',
  info: 'background: #3b82f6; color: white; padding: 4px 8px; border-radius: 4px;',
};

export async function verifyReceptionSystem() {
  console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', PROOF_LOG_STYLE.header);
  console.log('%c🔍 RECEPTION ROLE VERIFICATION PROOF MODE', PROOF_LOG_STYLE.header);
  console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', PROOF_LOG_STYLE.header);
  
  const proof = {
    timestamp: new Date().toISOString(),
    database: {},
    api: {},
    frontend: {},
    rbac: {},
  };

  try {
    // ============================================================================
    // 1️⃣ API ENDPOINT PROOF
    // ============================================================================
    console.log('\n%c📊 STEP 1: API ENDPOINT VERIFICATION', PROOF_LOG_STYLE.header);
    console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', PROOF_LOG_STYLE.info);

    const endpoints = [
      { name: 'appointments', fn: () => getAppointments({}) },
      { name: 'clients', fn: () => getClients() },
      { name: 'payments', fn: () => getPayments() },
      { name: 'packages', fn: () => getPackages() },
      { name: 'services', fn: () => getServices() },
    ];

    for (const endpoint of endpoints) {
      try {
        const startTime = performance.now();
        const data = await endpoint.fn();
        const duration = (performance.now() - startTime).toFixed(2);

        const isArray = Array.isArray(data);
        const count = isArray ? data.length : (data ? 1 : 0);
        const sample = isArray ? data.slice(0, 2) : (data ? [data] : []);

        proof.api[endpoint.name] = {
          status: '200 OK',
          count,
          duration: `${duration}ms`,
          sample,
          fields: validateFields(endpoint.name, sample[0]),
        };

        console.log(`%c✅ /api/reception/${endpoint.name}`, PROOF_LOG_STYLE.success, {
          status: '200 OK',
          count: `${count} records`,
          duration: `${duration}ms`,
          sample: sample,
        });

        // Print sample JSON
        if (sample.length > 0) {
          console.log(`   Sample record:`, sample[0]);
        }
      } catch (error) {
        proof.api[endpoint.name] = {
          status: 'ERROR',
          error: error.message,
        };
        console.log(`%c❌ /api/reception/${endpoint.name}`, PROOF_LOG_STYLE.error, error.message);
      }
    }

    // ============================================================================
    // 2️⃣ FIELD VALIDATION PROOF
    // ============================================================================
    console.log('\n%c✅ STEP 2: FIELD VALIDATION CHECK', PROOF_LOG_STYLE.header);
    console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', PROOF_LOG_STYLE.info);

    const fieldChecks = {
      appointments: ['client', 'service', 'start_time', 'status'],
      clients: ['name', 'email', 'phone'],
      payments: ['amount', 'payment_method', 'status', 'client'],
      packages: ['name', 'price', 'duration'],
      services: ['name', 'price', 'duration'],
    };

    for (const [entity, fields] of Object.entries(fieldChecks)) {
      const data = proof.api[entity]?.sample?.[0];
      if (data) {
        console.log(`\n${entity}:`);
        fields.forEach(field => {
          const hasField = checkField(data, field);
          const icon = hasField ? '✅' : '❌';
          const style = hasField ? PROOF_LOG_STYLE.success : PROOF_LOG_STYLE.error;
          console.log(`   %c${icon} ${field}`, style, hasField ? 'present' : 'missing');
        });
      }
    }

    // ============================================================================
    // 3️⃣ RBAC PROOF (Unauthorized Route Blocking)
    // ============================================================================
    console.log('\n%c🔒 STEP 3: RBAC ENFORCEMENT PROOF', PROOF_LOG_STYLE.header);
    console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', PROOF_LOG_STYLE.info);

    try {
      // Test blocked endpoint (direct fetch to bypass auto-remapping)
      console.log('%c⚠️  Testing unauthorized route: /api/admin/appointments', PROOF_LOG_STYLE.warning);
      
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user.role !== 'reception') {
        console.log('%c⚠️  Skipping RBAC test: Not logged in as Reception', PROOF_LOG_STYLE.warning);
        proof.rbac.testSkipped = 'Not logged in as Reception';
      } else {
        try {
          // Direct fetch to test RBAC blocking (fetchWithAuth would auto-remap)
          const token = localStorage.getItem('token');
          const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
          
          const response = await fetch(`${API_BASE}/admin/appointments`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
          
          if (response.status === 403) {
            console.log('%c✅ RBAC SUCCESS: Admin route blocked with 403 Forbidden', PROOF_LOG_STYLE.success);
            proof.rbac.adminRoute = { blocked: true, status: 403, method: 'backend_middleware' };
          } else if (response.ok) {
            console.log('%c❌ RBAC FAILURE: Admin route accessible', PROOF_LOG_STYLE.error, { status: response.status });
            proof.rbac.adminRoute = { blocked: false, status: response.status, error: 'Should be blocked' };
          } else {
            console.log('%c⚠️  Unexpected status', PROOF_LOG_STYLE.warning, { status: response.status });
            proof.rbac.adminRoute = { blocked: 'unknown', status: response.status };
          }
        } catch (error) {
          // Network error or frontend RBAC block
          const isBlocked = error.message.includes('Access restricted') || 
                           error.message.includes('Unauthorized endpoint') ||
                           error.message.includes('403');
          
          if (isBlocked) {
            console.log('%c✅ RBAC SUCCESS: Admin route blocked by frontend guard', PROOF_LOG_STYLE.success, error.message);
            proof.rbac.adminRoute = { blocked: true, method: 'frontend_guard', message: error.message };
          } else {
            console.log('%c⚠️  Network error (may still be blocked)', PROOF_LOG_STYLE.warning, error.message);
            proof.rbac.adminRoute = { blocked: 'network_error', error: error.message };
          }
        }
      }
    } catch (error) {
      console.log('%c⚠️  RBAC test failed', PROOF_LOG_STYLE.warning, error.message);
      proof.rbac.adminRoute = { blocked: 'test_failed', error: error.message };
    }

    // ============================================================================
    // 4️⃣ SUMMARY PROOF
    // ============================================================================
    console.log('\n%c📋 STEP 4: VERIFICATION SUMMARY', PROOF_LOG_STYLE.header);
    console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', PROOF_LOG_STYLE.info);

    const allEndpointsOk = Object.values(proof.api).every(ep => ep.status === '200 OK');
    const allFieldsValid = Object.values(proof.api).every(ep => 
      ep.fields && Object.values(ep.fields).every(valid => valid)
    );
    const rbacBlocked = proof.rbac.adminRoute?.blocked === true;

    console.log(`%cAPI Status: ${allEndpointsOk ? '✅ ALL 200 OK' : '❌ ERRORS DETECTED'}`, 
      allEndpointsOk ? PROOF_LOG_STYLE.success : PROOF_LOG_STYLE.error);
    console.log(`%cFields Valid: ${allFieldsValid ? '✅ ALL FIELDS PRESENT' : '❌ MISSING FIELDS'}`, 
      allFieldsValid ? PROOF_LOG_STYLE.success : PROOF_LOG_STYLE.error);
    console.log(`%cRBAC Blocked: ${rbacBlocked ? '✅ UNAUTHORIZED ROUTES BLOCKED' : '⚠️  RBAC TEST INCONCLUSIVE'}`, 
      rbacBlocked ? PROOF_LOG_STYLE.success : PROOF_LOG_STYLE.warning);

    // Store proof object globally for access
    window.receptionProof = proof;
    console.log('\n%c✅ Verification complete. Access proof object: window.receptionProof', PROOF_LOG_STYLE.success);

    notify.success('Reception system verification complete. Check console for proof.');
    
    return proof;
  } catch (error) {
    console.error('%c❌ Verification failed', PROOF_LOG_STYLE.error, error);
    notify.error('Verification failed: ' + error.message);
    throw error;
  }
}

function validateFields(entity, sample) {
  if (!sample) return {};

  const validators = {
    appointments: {
      client_name: () => sample.client?.name || sample.client?.clientUser?.name,
      service_name: () => sample.service?.name,
      date: () => sample.start_time,
      status: () => sample.status,
    },
    clients: {
      name: () => sample.name,
      email: () => sample.email,
      phone: () => sample.phone,
    },
    payments: {
      amount: () => typeof sample.amount === 'number',
      payment_method: () => sample.payment_method,
      status: () => sample.status,
      client_name: () => sample.client?.name || sample.client_name,
    },
    packages: {
      name: () => sample.name,
      price: () => typeof sample.price === 'number',
      duration: () => typeof sample.duration === 'number',
    },
    services: {
      name: () => sample.name,
      price: () => typeof sample.price === 'number',
      duration: () => typeof sample.duration === 'number',
    },
  };

  const validator = validators[entity];
  if (!validator) return {};

  const results = {};
  for (const [field, check] of Object.entries(validator)) {
    results[field] = !!check();
  }
  return results;
}

function checkField(data, field) {
  if (!data) return false;
  
  // Handle nested fields (e.g., "client.name")
  const parts = field.split('.');
  let value = data;
  for (const part of parts) {
    value = value?.[part];
    if (value === undefined || value === null) return false;
  }
  
  return true;
}

// Auto-expose in window for console access
if (typeof window !== 'undefined') {
  window.verifyReceptionSystem = verifyReceptionSystem;
  console.log('%c💡 Use window.verifyReceptionSystem() to run full verification', PROOF_LOG_STYLE.info);
}

